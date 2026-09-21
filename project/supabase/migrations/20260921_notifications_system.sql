create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  message text not null,
  type text not null default 'info' check (type in ('info','success','warning','live')),
  is_published boolean not null default false,
  publish_at timestamptz not null default now(),
  expires_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint notifications_expiry_check check (expires_at is null or expires_at > publish_at)
);

create table if not exists public.notification_reads (
  notification_id uuid not null references public.notifications(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  read_at timestamptz not null default now(),
  primary key (notification_id, user_id)
);

alter table public.notifications enable row level security;
alter table public.notification_reads enable row level security;

drop policy if exists "Published notifications are visible to students" on public.notifications;
drop policy if exists "Admins can view all notifications" on public.notifications;
drop policy if exists "Admins can create notifications" on public.notifications;
drop policy if exists "Admins can update notifications" on public.notifications;
drop policy if exists "Admins can delete notifications" on public.notifications;
drop policy if exists "Students can view their own notification reads" on public.notification_reads;
drop policy if exists "Students can create their own notification reads" on public.notification_reads;
drop policy if exists "Students can update their own notification reads" on public.notification_reads;

create policy "Published notifications are visible to students"
on public.notifications
for select
to authenticated
using (
  is_published = true
  and publish_at <= now()
  and (expires_at is null or expires_at > now())
);

create policy "Admins can view all notifications"
on public.notifications
for select
to authenticated
using (
  exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin')
);

create policy "Admins can create notifications"
on public.notifications
for insert
to authenticated
with check (
  exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin')
  and created_by = (select auth.uid())
);

create policy "Admins can update notifications"
on public.notifications
for update
to authenticated
using (
  exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin')
)
with check (
  exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin')
);

create policy "Admins can delete notifications"
on public.notifications
for delete
to authenticated
using (
  exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin')
);

create policy "Students can view their own notification reads"
on public.notification_reads
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Students can create their own notification reads"
on public.notification_reads
for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "Students can update their own notification reads"
on public.notification_reads
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create index if not exists notifications_published_idx
on public.notifications(is_published, publish_at, expires_at);

create index if not exists notification_reads_user_idx
on public.notification_reads(user_id, read_at desc);
