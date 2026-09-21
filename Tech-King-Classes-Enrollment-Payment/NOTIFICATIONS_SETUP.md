# Tech King Classes — Notifications & Announcements

## What was added
- Admin: `/admin/notifications`
- Student: `/student/notifications`
- Latest announcements preview on `/student/dashboard`
- Admin can create drafts, publish/unpublish, set optional expiry, and delete announcements.
- Notification types: Info, Success, Important, Live Class.
- Supabase RLS protects student/admin access.

## Supabase
Run the complete SQL from:

`supabase/migrations/20260921_notifications_system.sql`

Use Supabase Dashboard → SQL Editor → New query. Do not paste the filename/path itself into the SQL editor.

## Local project
Keep your existing `.env.local` in the project root. It is intentionally not included in this package.

Then run:

```powershell
npm install
npm run dev
```

Admin:
`http://localhost:3000/admin/notifications`

Student:
`http://localhost:3000/student/notifications`

If port 3000 is occupied, use the port shown by Next.js (for example 3001).
