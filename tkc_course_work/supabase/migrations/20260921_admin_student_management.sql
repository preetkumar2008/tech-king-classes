-- Tech King Classes: student management support
-- Run in Supabase SQL Editor.

alter table public.profiles
  add column if not exists email text;

create index if not exists profiles_email_idx on public.profiles(email);

-- Backfill emails from Supabase Auth for existing users.
update public.profiles p
set email = u.email
from auth.users u
where u.id = p.id
  and (p.email is null or p.email = '');

-- Keep new/updated profiles in sync with auth email metadata.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, mobile, email, profile_photo_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce(new.raw_user_meta_data ->> 'mobile', ''),
    new.email,
    new.raw_user_meta_data ->> 'profile_photo_url'
  )
  on conflict (id) do update set
    email = excluded.email,
    full_name = case when public.profiles.full_name = '' then excluded.full_name else public.profiles.full_name end,
    mobile = case when public.profiles.mobile = '' then excluded.mobile else public.profiles.mobile end;
  return new;
end;
$$;

revoke all on function public.handle_new_user() from public, anon, authenticated;

-- Admin read access for all data used by the student-management screen.
drop policy if exists "Admins can view all profiles" on public.profiles;
create policy "Admins can view all profiles"
on public.profiles
for select to authenticated
using (public.is_admin());

drop policy if exists "Admins can view all lesson progress" on public.lesson_progress;
create policy "Admins can view all lesson progress"
on public.lesson_progress
for select to authenticated
using (public.is_admin());

drop policy if exists "Admins can view all quiz attempts" on public.quiz_attempts;
create policy "Admins can view all quiz attempts"
on public.quiz_attempts
for select to authenticated
using (public.is_admin());

drop policy if exists "Admins can view all completions" on public.course_completions;
create policy "Admins can view all completions"
on public.course_completions
for select to authenticated
using (public.is_admin());

drop policy if exists "Admins can view all certificates" on public.certificates;
create policy "Admins can view all certificates"
on public.certificates
for select to authenticated
using (public.is_admin());
