-- ===========================================================================
-- ProMouser: DEV TOOLS (optional)
--
-- Lets the dev panel (dev.js, Ctrl+Shift+D on localhost) switch plans, set
-- credits and passes in Supabase mode, but ONLY for accounts you list in
-- public.developers. Everyone else gets "NOT_A_DEVELOPER".
--
-- Run AFTER schema.sql, then make yourself a developer:
--   insert into public.developers (user_id)
--   select id from auth.users where email = 'you@example.com';
-- ===========================================================================

create table if not exists public.developers (
  user_id uuid primary key references auth.users(id) on delete cascade,
  added_at timestamptz not null default now()
);
alter table public.developers enable row level security;   -- no policies: invisible to the browser
revoke all on public.developers from anon, authenticated;

create or replace function public.pm_require_dev() returns uuid
language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null or not exists (select 1 from public.developers where user_id = auth.uid()) then
    raise exception 'NOT_A_DEVELOPER';
  end if;
  return auth.uid();
end $$;

create or replace function public.dev_set_plan(p_tier text) returns void
language plpgsql security definer set search_path = '' as $$
declare uid uuid := public.pm_require_dev();
begin
  if p_tier in ('lite','ultra') then
    update public.profiles set plan = p_tier, plan_cancelled = false, plan_since = now(), plan_renews_at = null where id = uid;
    update public.credit_balances set daily = public.pm_allowance(p_tier) where user_id = uid;
  elsif p_tier = 'free' then
    update public.profiles set plan = 'free', plan_cancelled = false, plan_since = null, plan_renews_at = null where id = uid;
    update public.credit_balances set daily = least(daily, public.pm_allowance('free')) where user_id = uid;
  else raise exception 'BAD_TIER'; end if;
end $$;

create or replace function public.dev_set_credits(p_daily int default null, p_purchased int default null) returns void
language plpgsql security definer set search_path = '' as $$
declare uid uuid := public.pm_require_dev();
begin
  update public.credit_balances set daily = coalesce(greatest(p_daily, 0), daily), purchased = coalesce(greatest(p_purchased, 0), purchased),
    daily_date = public.pm_today() where user_id = uid;
end $$;

create or replace function public.dev_set_pass(p_feature text, p_days int) returns void
language plpgsql security definer set search_path = '' as $$
declare uid uuid := public.pm_require_dev();
begin
  if p_days > 0 then
    insert into public.user_passes (user_id, feature, until) values (uid, p_feature, now() + make_interval(days => p_days))
      on conflict (user_id, feature) do update set until = excluded.until;
  else
    delete from public.user_passes where user_id = uid and feature = p_feature;
  end if;
end $$;

create or replace function public.dev_next_day() returns void
language plpgsql security definer set search_path = '' as $$
declare uid uuid := public.pm_require_dev();
begin
  update public.credit_balances set daily_date = public.pm_today() - 1 where user_id = uid;
  perform public.pm_refresh(uid);
end $$;

create or replace function public.dev_clear(p_what text) returns void
language plpgsql security definer set search_path = '' as $$
declare uid uuid := public.pm_require_dev();
begin
  if p_what = 'history' then delete from public.recommendation_runs where user_id = uid;
  elsif p_what = 'orders' then delete from public.orders where user_id = uid;
  elsif p_what = 'onboarding' then update public.profiles set onboarded = false where id = uid;
  else raise exception 'BAD_TARGET'; end if;
end $$;

create or replace function public.dev_set_turbo(p_days int) returns void
language plpgsql security definer set search_path = '' as $$
declare uid uuid := public.pm_require_dev();
begin
  update public.profiles set turbo_until = case when p_days > 0 then now() + make_interval(days => p_days) end where id = uid;
end $$;

do $$ declare f text; begin
  foreach f in array array['pm_require_dev()', 'dev_set_plan(text)', 'dev_set_turbo(int)', 'dev_set_credits(int, int)', 'dev_set_pass(text, int)', 'dev_next_day()', 'dev_clear(text)'] loop
    execute format('revoke all on function public.%s from public, anon', f);
    execute format('grant execute on function public.%s to authenticated', f);
  end loop;
end $$;
