-- Admin CRUD for modules and lessons.
-- Run after 20260920_admin_role.sql.

alter table public.modules enable row level security;
alter table public.lessons enable row level security;

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
