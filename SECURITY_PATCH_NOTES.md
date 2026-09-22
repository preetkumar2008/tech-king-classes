# Tech King Classes — Secure Admin Patch

Changes:
- Unauthenticated `/admin/*` requests redirect to `/login`.
- Authenticated users without `profiles.role = 'admin'` redirect to `/student/dashboard`.
- Existing server-side admin checks and Supabase RLS remain as a second security layer.
- Duplicate nested project copies were excluded from this clean package.

Before deployment:
1. Keep `.env.local` out of the ZIP.
2. Run `npm install`.
3. Run `npm run build`.
4. Test `/admin` with an admin account and a normal student account.
