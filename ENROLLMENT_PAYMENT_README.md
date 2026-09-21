# Tech King Classes — Enrollment & Payment System

Added:
- Free-course enrollment through a secure Supabase RPC.
- Enrollment records with active/expired/cancelled status.
- Payment table designed for Razorpay integration later.
- Course page now checks enrollment status.
- Free courses can be enrolled from the course page after login.
- Paid courses show a payment-setup message until Razorpay credentials/server verification are configured.
- Admin enrollment/payment tracking page: `/admin/enrollments`.
- Admin dashboard link to Enrollments & Payments.

## Supabase migration
Run:
`supabase/migrations/20260921_enrollment_payment_system.sql`

## Local setup
Keep your existing `.env.local` in the project root, then run:
`npm install`
`npm run dev`

If Next.js starts on port 3001, use:
`http://localhost:3001/admin/enrollments`

No payment secret/key is included in this ZIP.
