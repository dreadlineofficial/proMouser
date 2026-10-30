/* =====================================================================
   ProMouser: Supabase connection

   Leave url empty and the site runs in DEMO mode: accounts and credits are
   stored only in this browser (backend.js).

   To connect your project (full steps in SUPABASE-SETUP.md):
     Supabase Dashboard → Project Settings → API (or the "Connect" button)
       url      ← Project URL, e.g. https://abcdefghijkl.supabase.co
       anonKey  ← the "anon public" key, or the newer "publishable" key (sb_publishable_…)

   Both values are meant to be public. They are safe in browser code because
   the database rules in supabase/schema.sql decide what each user can do.
   NEVER put the service_role / secret key here.

   testPayments: true lets the fake checkout grant purchases for real, which
   needs supabase/test-payments.sql. Set it to false (and drop that function)
   before you take real money.
   ===================================================================== */
window.PM_SUPABASE = {
  url: '',
  anonKey: '',
  testPayments: true
};
