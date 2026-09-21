-- Tech King Classes: payment provider cleanup
-- Razorpay is not enabled. Keep the payment table provider-neutral until a
-- real payment provider is intentionally integrated.

alter table public.payments
  alter column provider set default 'manual';

update public.payments
set provider = 'manual'
where lower(provider) = 'razorpay';
