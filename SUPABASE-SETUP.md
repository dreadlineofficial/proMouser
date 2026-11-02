# Connecting ProMouser to Supabase

The site works on its own in **demo mode**, where accounts live only in the visitor's
browser. Once you paste your Supabase keys into `supabase-config.js`, accounts, credits,
Lite, orders and recommendation history move to your Supabase project, with real
sign-in that works on every device. You don't need to change any other file.

It takes about 10 minutes.

---

## 1. Create the project
1. Go to <https://supabase.com/dashboard> and click **New project**.
2. Pick a name and a database password, and save the password somewhere safe.
   For India, choose the **Mumbai** region.
3. Wait a minute or two for the project to finish setting up.

## 2. Create the database
1. In the left sidebar, open **SQL Editor** and click **New query**.
2. Open `supabase/schema.sql` from this folder, copy all of it, paste it in and click **Run**.
   It should end with "Success. No rows returned".
3. *(Optional, until Razorpay is live)* Do the same with `supabase/test-payments.sql`.
   This keeps the fake checkout working, so test purchases really add credits, a pass or Lite.

Check that it worked: **Table Editor** should now list `profiles`, `credit_balances`,
`products`, `orders` and `recommendation_runs`. The profile migration adds a unique
username, bio, location, website and avatar URL to `profiles`; existing accounts receive
a generated username. Running the schema again is safe.

## 3. Set up sign-in
1. **Authentication → Sign In / Providers → Email** should be enabled (it is by default).
   - **Confirm email** ON (recommended): new users get an email link. The site tells them
     to check their inbox, and the link brings them back to `account.html`.
   - Turning it OFF makes testing quicker, because sign-up logs you straight in.
2. **Authentication → URL Configuration**
   - **Site URL:** `https://promouser.website`
   - **Redirect URLs:** add `https://promouser.website/account`.
     For local testing, also add `http://localhost:8000/account`.
3. To enable connected sign-in accounts, open **Authentication → Sign In / Providers** and
   configure Google and/or Discord with credentials from those providers. Add the account
   page URLs above to the allowed redirect URLs. Users can sign in with those providers,
   or link/unlink an identity from **My account**; they must keep at least one sign-in
   method connected.

## 4. Paste your keys into the site
1. Click **Connect** at the top of the dashboard, or go to **Project Settings → API Keys**.
2. Copy the **Project URL** and the **publishable** key (`sb_publishable_…`).
   On older projects this is the **anon public** key.
3. Put them in `supabase-config.js`:
   ```js
   window.PM_SUPABASE = {
     url: 'https://YOUR-PROJECT.supabase.co',
     anonKey: 'sb_publishable_...',
     testPayments: true
   };
   ```
   These two values are designed to be public. **Never** paste the `service_role` /
   secret key into any site file.

## 5. Try it
Test locally with `python3 -m http.server 8000` in this folder, then open
<http://localhost:8000>. Or upload the folder to your host the same way as before.

1. Create an account and finish onboarding.
2. In Supabase, **Table Editor → profiles** should show your row, with your games and weight
   saved in `prefs`.
3. Edit your profile and upload a photo. The schema creates a public `avatars` storage
   bucket (JPEG or GIF, 1 MB maximum); users can write only to their own folder, and GIF
   uploads are restricted to Ultra accounts. Profile photos are publicly readable, so only
   upload an image you are comfortable sharing. Rerun the updated `supabase/schema.sql` to
   enable GIF uploads on an existing project.
4. Link a configured Google or Discord identity from **My account**.
5. Run a recommendation. In `credit_balances`, `daily` drops from 5 to 4.
6. Buy something in the shop (test payment). It shows up in `orders`.

---

## What's protected
I tested all of this against a real Postgres database:
- Users can read only their own account data and update only allowed profile fields. Avatar
  images are intentionally public; only upload photos you are comfortable sharing.
- Users can't change their own credits, plan, pass or orders, even by calling the API directly.
- The server decides what a run costs (1 credit on Free, 3 on Lite, 0 on Ultra, free with a Recommendation Pass).
  Passes live in `user_passes`, one row per feature, so a pass never touches your credits.
- Plans are `free`, `lite` and `ultra`. Ultra recommendations cost 0 credits. Ultra's watchlist, saved profiles and
  assistant memory live in `profiles.extras`, and a trigger refuses changes to it from non-Ultra accounts.
  It refills 5 or 15 daily credits at midnight India time. Lite and Ultra are lifetime plans, so they never expire.
- Prices come from the `products` table, not the browser.
- Deleting an account removes all of that user's data.

## Things to know
- **Old demo accounts don't carry over.** They only ever existed in each visitor's browser.
- **Email limits.** Supabase's built-in email only sends a few messages per hour. Before
  launch, add your own SMTP under **Authentication → Emails → SMTP Settings** (for example
  Resend, Brevo or Zoho), or new sign-ups won't get their confirmation emails.
- **Privacy page.** `privacy.html` still describes demo mode (data stored only in the browser).
  Update it to say accounts are now stored with Supabase. The site also keeps a copy of
  your own account in the browser (`pm_sb_user`) so pages load instantly.
- **Recommendations run in the browser.** Credits are enforced on the server, but the
  matching itself happens on the page. That means a technical user could run the engine
  from dev-tools without spending credits. That's fine for now. If it ever matters, move
  `PM.recommend` into a Supabase Edge Function.
- **Prices live in two places.** They're in `products` (the database) and in `PM_CONFIG`
  (`backend.js`, used for display). Change both together. **When you download a new version of the site, run
  `schema.sql` again** in the SQL Editor. It's safe to re-run: it updates prices and functions and
  keeps every user, credit and order. Daily credit amounts are in
  `pm_allowance` / `pm_cost` in `schema.sql`.

## ProMouser Online (shared accounts)
ProMouser Online uses this same Supabase project, so one account works on both sites.
1. After `schema.sql`, also run `supabase/online.sql` (a copy is in this folder; the original is in
   the ProMouser-Online repo).
2. Put the same URL and key in ProMouser Online's `supabase-config.js`.
3. Add the Online site's address to **Authentication → URL Configuration → Redirect URLs**.

Basic, Lite and Ultra are one-time (lifetime) purchases. Ultra also adds a year (365 days) of **ProMouser Turbo**
(`profiles.turbo_until`), which ProMouser Online reads. CPS test personal bests are saved to
`profiles.cps_best` and shown on Online profiles.

## Dev mode with Supabase (optional)
The dev panel (Ctrl+Shift+D on localhost) can switch plans and set credits in Supabase too, but only for
developer accounts. Run `supabase/dev-tools.sql`, then add yourself:
```sql
insert into public.developers (user_id) select id from auth.users where email = 'you@example.com';
```
Everyone else gets "not a developer", even if they find the functions.

## When you add Razorpay
1. Create a Supabase **Edge Function** that creates the Razorpay order on the server.
2. Create a second Edge Function for Razorpay's **payment webhook**. It should verify
   Razorpay's signature, then call
   `grant_order(user_id, order_id, product_ids, payment_id)` with the service-role key.
   It returns the order total, so you can check it matches what Razorpay charged.
3. In `shop.js`, replace `PMPayments.pay()` with Razorpay Checkout (the comment there has
   the steps). After payment, the site waits for the webhook's order to appear.
4. Set `testPayments: false` in `supabase-config.js`, then run
   `drop function public.test_grant_order(text, text[]);` in the SQL Editor.

## Files
| File | What it is |
|---|---|
| `supabase-config.js` | your project URL and key (the only file you edit) |
| `backend-supabase.js` | the Supabase version of the site's account/credits backend |
| `backend.js` | demo backend, used when no keys are set; holds `PM_CONFIG` |
| `supabase/schema.sql` | tables, security rules and server functions |
| `supabase/test-payments.sql` | optional: lets the fake checkout grant purchases |
| `supabase/dev-tools.sql` | optional: dev-panel actions for accounts in `public.developers` |
| `vendor/supabase-2.117.3.js` | the official Supabase JS library (MIT), loaded only when connected |
