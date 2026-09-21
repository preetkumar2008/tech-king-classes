# Tech King Classes — Student Management

Adds `/admin/students` for admin-only student management.

Features:
- Search students by name, mobile or email
- Student profile summary
- Completed lessons
- Quiz attempts and pass status
- Completed courses
- Certificates with verification links
- Admin-only Supabase RLS access
- Adds `profiles.email` and backfills existing Auth emails

Run `supabase/migrations/20260921_admin_student_management.sql` in Supabase SQL Editor before using the page.
