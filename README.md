# Tech King Classes

LMS starter for Tech King Classes using Next.js, TypeScript and Supabase.

## Local setup

1. Copy `.env.example` to `.env.local`.
2. Add your Supabase project URL and publishable key.
3. Install dependencies:

```bash
npm install
```

4. Start development:

```bash
npm run dev
```

## Included LMS areas

- Student registration/login
- Student dashboard
- Course catalogue and course management
- Modules and lessons
- YouTube/Vimeo lesson player
- Free-course enrollment
- Enrollment/payment-ready database structure (no payment provider is enabled)
- Quiz/test management and attempts
- Certificates and public verification
- Student management
- Notifications
- Admin analytics
- Role-based admin protection

## Security notes

- `.env.local` is intentionally not included in this archive.
- Supabase publishable keys may be used in browser/server clients; never put a Supabase service-role key in this project.
- Protected lessons require an active course enrollment; free-preview lessons remain available after login.
- Payment provider is intentionally neutral/manual. No Razorpay integration is enabled.
- Apply all required SQL migrations in `supabase/migrations` to the matching Supabase project.

## Verification performed for this archive

- TypeScript check: `tsc --noEmit` passed in the verification environment.
- Source scan performed for service-role/API-secret leakage.
- Protected-lesson access was hardened to require an active enrollment (admins bypass the enrollment gate).
