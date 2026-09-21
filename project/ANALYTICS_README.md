# Tech King Classes — Analytics Dashboard

Added `/admin/analytics` for admin-only LMS analytics.

Includes:
- student count
- published courses
- active enrollments
- course completions
- quiz attempts
- average quiz score
- quiz pass rate
- certificates issued
- per-course enrollment, lesson activity, quiz and certificate metrics
- learning health indicators
- quick admin links

No new Supabase migration is required. The existing admin-role migration already grants admins read access to the tables used by analytics.

## Run

```powershell
npm install
npm run dev
```

Open `/admin/analytics` using the port shown by Next.js.
