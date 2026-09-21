-- Tech King Classes: Admin role + admin read access
-- Run this in Supabase SQL Editor.

alter table public.profiles
  add column if not exists role text not null default 'student';

alter table public.profiles
  drop constraint if exists profiles_role_check;

alter table public.profiles
  add constraint profiles_role_check
  check (role in ('student', 'teacher', 'admin'));

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
  );
$$;

revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

-- Admin can read all profiles.
drop policy if exists "Admins can view all profiles" on public.profiles;
create policy "Admins can view all profiles"
on public.profiles
for select
to authenticated
using (public.is_admin());

-- Admin management access for course/content tables.
drop policy if exists "Admins can manage courses" on public.courses;
create policy "Admins can manage courses"
on public.courses
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Admins can manage modules" on public.modules;
create policy "Admins can manage modules"
on public.modules
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Admins can manage lessons" on public.lessons;
create policy "Admins can manage lessons"
on public.lessons
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Admins can manage quizzes" on public.quizzes;
create policy "Admins can manage quizzes"
on public.quizzes
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Admins can manage quiz questions" on public.quiz_questions;
create policy "Admins can manage quiz questions"
on public.quiz_questions
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Admins can manage quiz options" on public.quiz_options;
create policy "Admins can manage quiz options"
on public.quiz_options
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- Admin can inspect learning/progress/results for dashboard analytics.
drop policy if exists "Admins can view all lesson progress" on public.lesson_progress;
create policy "Admins can view all lesson progress"
on public.lesson_progress
for select
to authenticated
using (public.is_admin());

drop policy if exists "Admins can view all quiz attempts" on public.quiz_attempts;
create policy "Admins can view all quiz attempts"
on public.quiz_attempts
for select
to authenticated
using (public.is_admin());

drop policy if exists "Admins can view all quiz answers" on public.quiz_answers;
create policy "Admins can view all quiz answers"
on public.quiz_answers
for select
to authenticated
using (public.is_admin());

drop policy if exists "Admins can view all completions" on public.course_completions;
create policy "Admins can view all completions"
on public.course_completions
for select
to authenticated
using (public.is_admin());

drop policy if exists "Admins can view all certificates" on public.certificates;
create policy "Admins can view all certificates"
on public.certificates
for select
to authenticated
using (public.is_admin());

-- After creating your own account, run:
-- update public.profiles set role = 'admin' where mobile = 'YOUR_MOBILE';
