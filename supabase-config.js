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

   Purchases unlock only with a code, checked on the server (redeem_order in
   supabase/schema.sql).
   ===================================================================== */
window.PM_SUPABASE = {
  url: '',
  anonKey: ''
};
