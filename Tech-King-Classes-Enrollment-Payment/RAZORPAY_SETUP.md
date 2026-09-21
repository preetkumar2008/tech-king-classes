# Razorpay Test Mode Setup

The payment flow is integrated, but it intentionally does not include any secret key.

## 1. Create Razorpay Test Mode keys
Create Test Mode API keys in your Razorpay Dashboard. Keep the Key Secret private.

## 2. Add `.env.local` at the project root

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxx
RAZORPAY_KEY_SECRET=your_test_key_secret
```

`RAZORPAY_KEY_SECRET` must never be exposed with `NEXT_PUBLIC_`.

## 3. Run the Supabase migration
Run `supabase/migrations/20260921_enrollment_payment_system.sql` in Supabase SQL Editor. If the earlier version was already run, run the full updated file; the helper functions use `create or replace`.

## 4. Test
Use a paid, published course. Click **Buy Now**, complete the Razorpay Test Mode checkout with Razorpay's current test credentials, then the server verifies the signature and activates the enrollment.

Do not use live keys until the full payment flow, webhook/reconciliation process, refund handling, and production security review are complete.
