-- ===========================================================================
-- ProMouser: Supabase setup
-- Run once in Supabase Dashboard → SQL Editor → New query → paste → Run.
-- Safe to re-run: it only creates things that are missing and replaces functions.
--
-- Rules this enforces:
--   * The browser can READ its own rows, but it can never write credits,
--     plan, pass or orders. Those change only through the functions below.
--   * Credits work for everything. A pass covers ONE feature (right now:
--     'recommendation'), making that feature free while it's active.
--   * Spending is one atomic server-side call (spend_credits). The server
--     decides the cost from the user's plan, so users can't change it.
--   * Paid items are granted only by grant_order(), which only the service
--     role can call (your Razorpay webhook / Edge Function).
--   * The numbers mirror window.PM_CONFIG in backend.js. Change both together.
--     Daily credits reset at midnight India time (pm_today below).
-- ===========================================================================

-- ---------------------------------------------------------------- helpers
create or replace function public.pm_today() returns date
language sql stable set search_path = '' as $$ select (now() at time zone 'Asia/Kolkata')::date $$;

create or replace function public.pm_allowance(p_plan text) returns int
language sql immutable set search_path = '' as $$ select case p_plan when 'ultra' then 30 when 'lite' then 20 when 'basic' then 7 else 5 end $$;

create or replace function public.pm_rank(p_plan text) returns int
language sql immutable set search_path = '' as $$ select case p_plan when 'ultra' then 3 when 'lite' then 2 when 'basic' then 1 else 0 end $$;

create or replace function public.pm_cost(p_plan text) returns int
language sql immutable set search_path = '' as $$ select case when p_plan = 'ultra' then 0 when p_plan = 'lite' then 2 else 1 end $$;   -- Ultra: recommendations are free

-- ---------------------------------------------------------------- tables
create table if not exists public.profiles (
  id             uuid primary key references auth.users(id) on delete cascade,
  name           text not null check (char_length(name) between 1 and 60),
  prefs          jsonb not null default '{"games":[],"weight":"any","grip":"any","connection":"any"}'
                 check (jsonb_typeof(prefs) = 'object' and pg_column_size(prefs) < 8000),
  onboarded      boolean not null default false,
  plan           text not null default 'free',
  plan_since     timestamptz,
  plan_renews_at timestamptz,
  plan_cancelled boolean not null default false,
  created_at     timestamptz not null default now()
);

create table if not exists public.credit_balances (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  daily      int  not null default 5 check (daily >= 0),
  daily_date date not null default public.pm_today(),
  purchased  int  not null default 0 check (purchased >= 0)
);

-- plans: free < basic < lite < ultra (named constraints so re-running this file upgrades older installs)
alter table public.profiles drop constraint if exists profiles_plan_check;
alter table public.profiles add constraint profiles_plan_check check (plan in ('free','basic','lite','ultra'));
-- Basic, Lite and Ultra are one-time (lifetime) purchases: plan_renews_at stays null for them.
-- ProMouser Turbo is the monthly plan for ProMouser Online; buying Ultra adds a year (365 days) of it.
alter table public.profiles add column if not exists turbo_until timestamptz;
-- CPS test personal bests per test length ("5": 9.4), shown on ProMouser Online profiles
alter table public.profiles add column if not exists cps_best jsonb not null default '{}'::jsonb;
-- ProMouser Core progress (XP, streaks, achievements, training plans, Mousle): every account, written by the browser
alter table public.profiles add column if not exists progress jsonb not null default '{}'::jsonb;
alter table public.profiles drop constraint if exists profiles_progress_check;
alter table public.profiles add constraint profiles_progress_check check (jsonb_typeof(progress) = 'object' and pg_column_size(progress) < 64000);
-- Ultra extras: watchlist, saved preference profiles, assistant memory
alter table public.profiles add column if not exists extras jsonb not null default '{}'::jsonb;
alter table public.profiles drop constraint if exists profiles_extras_check;
alter table public.profiles add constraint profiles_extras_check check (jsonb_typeof(extras) = 'object' and pg_column_size(extras) < 32000);

-- one row per active pass; a pass makes ONE feature free until it expires
create table if not exists public.user_passes (
  user_id uuid not null references auth.users(id) on delete cascade,
  feature text not null check (feature in ('recommendation')),
  until   timestamptz not null,
  primary key (user_id, feature)
);

-- what the shop sells. Prices are checked here, not in the browser.
create table if not exists public.products (
  id        text primary key,
  type      text not null,
  feature   text,                                   -- passes only: which feature it covers
  name      text not null,
  credits   int  not null default 0,
  days      int  not null default 0,
  price_inr int  not null check (price_inr >= 0),
  active    boolean not null default true,
  check ((type = 'pass') = (feature is not null))
);
alter table public.products drop constraint if exists products_type_check;
alter table public.products add constraint products_type_check check (type in ('credits','pass','basic','lite','ultra','turbo','item'));
-- passes name the feature they cover; ProMouser Online items name the item they grant
alter table public.products drop constraint if exists products_check;
alter table public.products drop constraint if exists products_feature_check;
alter table public.products add constraint products_feature_check check ((type in ('pass','item')) = (feature is not null));

insert into public.products (id, type, feature, name, credits, days, price_inr) values
  ('credits-10',  'credits', null,             '10 credits',                     10,  0,  39),
  ('credits-30',  'credits', null,             '30 credits',                     30,  0,  99),
  ('credits-100', 'credits', null,             '100 credits',                   100,  0, 249),
  ('credits-300', 'credits', null,             '300 credits',                   300,  0, 649),
  ('rec-pass-1m', 'pass',    'recommendation', 'Recommendation Pass (1 month)',   0, 30, 199),
  ('basic-lifetime', 'basic', null,          'ProMouser Basic (lifetime)',      0,  0,  599),
  ('lite-lifetime',  'lite',  null,          'ProMouser Lite (lifetime)',       0,  0, 2499),
  ('ultra-lifetime', 'ultra', null,          'ProMouser Ultra (lifetime)',      0,  0, 3199),
  ('turbo-1m',       'turbo', null,          'ProMouser Turbo (1 month)',       0, 30,  199)
on conflict (id) do update set type = excluded.type, feature = excluded.feature, name = excluded.name, credits = excluded.credits,
  days = excluded.days, price_inr = excluded.price_inr, active = true;
-- the old monthly plans: kept for order history, no longer sold
update public.products set active = false where id in ('lite-1m', 'ultra-1m');

create table if not exists public.orders (
  id                  text primary key,
  user_id             uuid not null references auth.users(id) on delete cascade,
  items               jsonb not null,
  total_inr           int  not null,
  provider            text not null default 'razorpay',
  provider_payment_id text,
  status              text not null default 'paid',
  created_at          timestamptz not null default now()
);
create index if not exists orders_user_idx on public.orders (user_id, created_at desc);

-- one row per recommendation run (the browser's history entry, stored as-is)
create table if not exists public.recommendation_runs (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users(id) on delete cascade,
  data       jsonb not null check (jsonb_typeof(data) = 'object' and pg_column_size(data) < 20000),
  created_at timestamptz not null default now()
);
create index if not exists runs_user_idx on public.recommendation_runs (user_id, created_at desc);

-- ---------------------------------------------------------------- row level security
alter table public.profiles            enable row level security;
alter table public.credit_balances     enable row level security;
alter table public.user_passes         enable row level security;
alter table public.products            enable row level security;
alter table public.orders              enable row level security;
alter table public.recommendation_runs enable row level security;

drop policy if exists "own profile read"   on public.profiles;
drop policy if exists "own profile update" on public.profiles;
drop policy if exists "own balance read"   on public.credit_balances;
drop policy if exists "own passes read"    on public.user_passes;
drop policy if exists "products read"      on public.products;
drop policy if exists "own orders read"    on public.orders;
drop policy if exists "own runs read"      on public.recommendation_runs;
drop policy if exists "own runs insert"    on public.recommendation_runs;

create policy "own profile read"   on public.profiles            for select to authenticated using ((select auth.uid()) = id);
create policy "own profile update" on public.profiles            for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
create policy "own balance read"   on public.credit_balances     for select to authenticated using ((select auth.uid()) = user_id);
create policy "own passes read"    on public.user_passes         for select to authenticated using ((select auth.uid()) = user_id);
create policy "products read"      on public.products            for select to anon, authenticated using (active);
create policy "own orders read"    on public.orders              for select to authenticated using ((select auth.uid()) = user_id);
create policy "own runs read"      on public.recommendation_runs for select to authenticated using ((select auth.uid()) = user_id);
create policy "own runs insert"    on public.recommendation_runs for insert to authenticated with check ((select auth.uid()) = user_id);

-- Column-level lock: a user may edit only these profile columns. Plan, pass and
-- renewal dates are not writable from the browser even though the row is theirs.
revoke insert, update, delete on public.profiles, public.credit_balances, public.user_passes, public.products, public.orders from anon, authenticated;
revoke insert, update, delete on public.recommendation_runs from anon;
revoke update, delete on public.recommendation_runs from authenticated;
grant update (name, prefs, onboarded, plan_cancelled, extras, progress) on public.profiles to authenticated;

-- only Ultra accounts may change their extras (the browser can't flip this: plan isn't writable)
create or replace function public.pm_guard_extras() returns trigger
language plpgsql set search_path = '' as $$
begin
  if new.extras is distinct from old.extras and new.plan <> 'ultra' and current_user in ('authenticated', 'anon') then
    raise exception 'NEEDS_ULTRA';
  end if;
  return new;
end $$;
drop trigger if exists pm_guard_extras on public.profiles;
create trigger pm_guard_extras before update on public.profiles for each row execute function public.pm_guard_extras();

-- ---------------------------------------------------------------- new user bootstrap
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, name)
    values (new.id, left(coalesce(nullif(trim(new.raw_user_meta_data->>'name'), ''), split_part(new.email, '@', 1), 'Player'), 60));
  insert into public.credit_balances (user_id) values (new.id);
  return new;
end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------- daily refill + expiry (internal)
create or replace function public.pm_refresh(p_user uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare p public.profiles;
begin
  select * into p from public.profiles where id = p_user for update;
  if not found then return; end if;
  if p.plan in ('basic','lite','ultra') and p.plan_renews_at is not null and p.plan_renews_at < now() then
    update public.profiles set plan = 'free', plan_cancelled = false where id = p_user;
    p.plan := 'free';
  end if;
  update public.credit_balances set daily = public.pm_allowance(p.plan), daily_date = public.pm_today()
    where user_id = p_user and daily_date <> public.pm_today();
  delete from public.user_passes where user_id = p_user and until < now();
end $$;
revoke all on function public.pm_refresh(uuid) from public, anon, authenticated;

-- ---------------------------------------------------------------- called from the browser
-- Everything the site needs about the signed-in user, in one round trip.
create or replace function public.get_my_state() returns jsonb
language plpgsql security definer set search_path = '' as $$
declare uid uuid := auth.uid(); r jsonb;
begin
  if uid is null then raise exception 'NOT_SIGNED_IN'; end if;
  perform public.pm_refresh(uid);
  select jsonb_build_object(
      'id', p.id, 'email', u.email, 'name', p.name, 'prefs', p.prefs, 'onboarded', p.onboarded,
      'created_at', p.created_at, 'plan', p.plan, 'plan_since', p.plan_since, 'plan_renews_at', p.plan_renews_at,
      'plan_cancelled', p.plan_cancelled, 'extras', p.extras, 'turbo_until', p.turbo_until, 'cps_best', p.cps_best, 'progress', p.progress,
      'passes', coalesce((select jsonb_object_agg(x.feature, x.until) from public.user_passes x where x.user_id = p.id and x.until > now()), '{}'::jsonb),
      'credits', jsonb_build_object('date', b.daily_date, 'daily', b.daily, 'purchased', b.purchased))
    into r
    from public.profiles p join public.credit_balances b on b.user_id = p.id join auth.users u on u.id = p.id
    where p.id = uid;
  if r is null then raise exception 'NO_PROFILE'; end if;
  return r;
end $$;

-- Spend credits on a feature. The cost comes from the plan, not the caller.
-- A pass for that feature makes it free. Daily credits are used before purchased ones.
-- Features so far: 'recommendation'. Add a branch here when credits pay for something new.
create or replace function public.spend_credits(p_feature text default 'recommendation') returns jsonb
language plpgsql security definer set search_path = '' as $$
declare uid uuid := auth.uid(); p public.profiles; b public.credit_balances; cost int; from_daily int;
begin
  if uid is null then raise exception 'NOT_SIGNED_IN'; end if;
  if p_feature is null or p_feature not in ('recommendation', 'assistant') then raise exception 'UNKNOWN_FEATURE'; end if;
  perform public.pm_refresh(uid);
  select * into p from public.profiles where id = uid;
  select * into b from public.credit_balances where user_id = uid for update;
  if exists (select 1 from public.user_passes where user_id = uid and feature = p_feature and until > now()) then
    return jsonb_build_object('charged', 0, 'pass', p_feature);
  end if;
  -- ProMouser AI: 1 credit per batch of questions (the browser asks once per batch); free on Ultra
  cost := case when p_feature = 'assistant' then (case when p.plan = 'ultra' then 0 else 1 end) else public.pm_cost(p.plan) end;
  if cost = 0 then return jsonb_build_object('charged', 0, 'pass', null, 'plan', p.plan); end if;
  if b.daily + b.purchased < cost then raise exception 'NO_CREDITS'; end if;
  from_daily := least(b.daily, cost);
  update public.credit_balances set daily = daily - from_daily, purchased = purchased - (cost - from_daily) where user_id = uid;
  return jsonb_build_object('charged', cost, 'pass', null);
end $$;
drop function if exists public.spend_credits();

-- Delete the signed-in user's account and all their data (cascades from auth.users).
create or replace function public.delete_my_account() returns void
language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then raise exception 'NOT_SIGNED_IN'; end if;
  delete from auth.users where id = auth.uid();
end $$;

-- Save a CPS test result; only ever raises a personal best.
create or replace function public.save_cps_best(p_seconds int, p_cps numeric) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare uid uuid := auth.uid(); r jsonb;
begin
  if uid is null then raise exception 'NOT_SIGNED_IN'; end if;
  if p_seconds not in (1, 2, 3, 5, 10, 15, 30, 60) or p_cps is null or p_cps <= 0 or p_cps > 40 then raise exception 'BAD_SCORE'; end if;
  update public.profiles set cps_best = jsonb_set(cps_best, array[p_seconds::text], to_jsonb(round(p_cps, 2)))
    where id = uid and coalesce((cps_best ->> p_seconds::text)::numeric, 0) < p_cps;
  select cps_best into r from public.profiles where id = uid;
  return r;
end $$;
revoke all on function public.save_cps_best(int, numeric) from public, anon;
grant execute on function public.save_cps_best(int, numeric) to authenticated;

revoke all on function public.get_my_state()      from public, anon;
revoke all on function public.spend_credits(text) from public, anon;
revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.get_my_state()      to authenticated;
grant execute on function public.spend_credits(text) to authenticated;
grant execute on function public.delete_my_account() to authenticated;

-- ---------------------------------------------------------------- paid orders (server only)
-- Call with the service-role key from your Razorpay webhook / Edge Function AFTER
-- verifying Razorpay's signature. Never from the browser. Re-sending the same
-- order id does nothing, so webhook retries are safe.
-- p_products: product ids, repeated for quantity, e.g. '{credits-30,credits-30}'.
-- Returns the order total so the webhook can check it matches what Razorpay charged.
create or replace function public.grant_order(p_user uuid, p_order text, p_products text[], p_payment text default null, p_provider text default 'razorpay')
returns int language plpgsql security definer set search_path = '' as $$
declare pr public.products; items jsonb := '[]'; total int := 0; pid text; n int;
begin
  if p_products is null or cardinality(p_products) = 0 or cardinality(p_products) > 20 then raise exception 'BAD_ORDER'; end if;
  if not exists (select 1 from auth.users where id = p_user) then raise exception 'NO_USER'; end if;
  for pid, n in select x, count(*)::int from unnest(p_products) x group by x order by x loop
    select * into pr from public.products where id = pid and active;
    if not found then raise exception 'UNKNOWN_PRODUCT %', pid; end if;
    items := items || jsonb_build_object('id', pr.id, 'type', pr.type, 'feature', pr.feature, 'name', pr.name, 'credits', pr.credits, 'price', pr.price_inr, 'qty', n);
    total := total + pr.price_inr * n;
  end loop;

  insert into public.orders (id, user_id, items, total_inr, provider, provider_payment_id)
    values (p_order, p_user, items, total, p_provider, p_payment)
    on conflict (id) do nothing;
  if not found then return total; end if;   -- already granted

  perform public.pm_refresh(p_user);
  for pid, n in select x, count(*)::int from unnest(p_products) x group by x loop
    select * into pr from public.products where id = pid;
    if pr.type = 'credits' then
      update public.credit_balances set purchased = purchased + pr.credits * n where user_id = p_user;
    elsif pr.type = 'pass' then
      insert into public.user_passes (user_id, feature, until) values (p_user, pr.feature, now() + make_interval(days => pr.days * n))
        on conflict (user_id, feature) do update set until = greatest(public.user_passes.until, now()) + make_interval(days => pr.days * n);
    elsif pr.type in ('basic','lite','ultra') then   -- one-time: the plan is kept for life and never downgrades
      update public.profiles set plan_cancelled = false, plan_renews_at = null,
        plan_since = case when plan = pr.type then coalesce(plan_since, now()) else now() end,
        plan = pr.type
        where id = p_user and public.pm_rank(plan) <= public.pm_rank(pr.type);
      update public.credit_balances set daily = greatest(daily, public.pm_allowance(pr.type)) where user_id = p_user;
      if pr.type = 'ultra' then
        update public.profiles set turbo_until = greatest(coalesce(turbo_until, now()), now()) + interval '365 days' where id = p_user;
      end if;
    elsif pr.type = 'turbo' then
      update public.profiles set turbo_until = greatest(coalesce(turbo_until, now()), now()) + make_interval(days => pr.days * n) where id = p_user;
    elsif pr.type = 'item' then   -- ProMouser Online cosmetics (online.sql); feature holds the item id
      insert into public.online_inventory (user_id, item_id, source) values (p_user, pr.feature, 'purchase') on conflict do nothing;
    end if;
  end loop;
  return total;
end $$;
revoke all on function public.grant_order(uuid, text, text[], text, text) from public, anon, authenticated;
grant execute on function public.grant_order(uuid, text, text[], text, text) to service_role;
