-- ===========================================================================
-- ProMouser: TEST PAYMENTS (optional, for use before Razorpay is live)
--
-- Lets the site's fake checkout grant credits, passes and Lite for real in your
-- Supabase project, so you can test the whole flow end to end.
--
-- !! Anyone signed in can call this and give themselves anything for free. !!
-- Before taking real payments: run the DROP line at the bottom, and set
-- testPayments: false in supabase-config.js.
--
-- Run AFTER schema.sql.
-- ===========================================================================

create or replace function public.test_grant_order(p_order text, p_products text[]) returns int
language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then raise exception 'NOT_SIGNED_IN'; end if;
  return public.grant_order(auth.uid(), p_order, p_products, null, 'test');
end $$;
revoke all on function public.test_grant_order(text, text[]) from public, anon;
grant execute on function public.test_grant_order(text, text[]) to authenticated;

-- To switch test payments off:
-- drop function if exists public.test_grant_order(text, text[]);
