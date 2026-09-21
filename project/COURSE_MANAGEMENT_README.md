# Tech King Classes — Course Management Update

## Included
- `/admin/courses` admin course management page
- Create course
- Edit course
- Publish / unpublish course
- Delete course (database cascade removes modules/lessons)
- Free / paid course pricing
- Level, language, duration, thumbnail URL
- Course search
- Admin-only CRUD enforced by the existing `is_admin()` RLS policy in `supabase/migrations/20260920_admin_role.sql`

## Setup
1. Keep your existing `.env.local` in the project root. It is intentionally not included in this ZIP.
2. Make sure the admin role migration has been run in Supabase.
3. Run `npm install` in your local project if needed.
4. Run `npm run dev`.
5. Open `/admin/courses` while logged in as an admin.
