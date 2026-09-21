create table if not exists public.enrollments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  status text not null default 'active' check (status in ('active','expired','cancelled')),
  enrolled_at timestamptz not null default now(),
  expires_at timestamptz,
  payment_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, course_id)
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  amount numeric(10,2) not null check (amount >= 0),
  currency text not null default 'INR',
  provider text not null default 'manual',
  provider_order_id text unique,
  provider_payment_id text unique,
  status text not null default 'created' check (status in ('created','pending','paid','failed','refunded')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.enrollments enable row level security;
alter table public.payments enable row level security;

create policy "Students can view their enrollments"
on public.enrollments for select to authenticated
using ((select auth.uid()) = user_id);

create policy "Admins can view all enrollments"
on public.enrollments for select to authenticated
using (exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin'));

create policy "Students can view their payments"
on public.payments for select to authenticated
using ((select auth.uid()) = user_id);

create policy "Admins can view all payments"
on public.payments for select to authenticated
using (exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin'));

create index if not exists enrollments_user_idx on public.enrollments(user_id);
create index if not exists enrollments_course_idx on public.enrollments(course_id);
create index if not exists enrollments_status_idx on public.enrollments(status);
create index if not exists payments_user_idx on public.payments(user_id);
create index if not exists payments_course_idx on public.payments(course_id);
create index if not exists payments_status_idx on public.payments(status);

create or replace function public.enroll_free_course(p_course_id uuid)
returns table (enrollment_id uuid, enrolled boolean)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_is_free boolean;
  v_is_published boolean;
  v_enrollment_id uuid;
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;

  select c.is_free, c.is_published
    into v_is_free, v_is_published
  from public.courses c
  where c.id = p_course_id;

  if not coalesce(v_is_published, false) then raise exception 'Course not available'; end if;
  if not coalesce(v_is_free, false) then raise exception 'This course requires payment'; end if;

  insert into public.enrollments (user_id, course_id, status)
  values (v_user_id, p_course_id, 'active')
  on conflict (user_id, course_id)
  do update set status = 'active', updated_at = now()
  returning id into v_enrollment_id;

  return query select v_enrollment_id, true;
end;
$$;

revoke all on function public.enroll_free_course(uuid) from public, anon;
grant execute on function public.enroll_free_course(uuid) to authenticated;
