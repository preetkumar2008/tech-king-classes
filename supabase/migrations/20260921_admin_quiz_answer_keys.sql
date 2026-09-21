-- Tech King Classes: allow admins to manage the private quiz answer keys.
-- This table remains inaccessible to students/anon users.

drop policy if exists "Admins can manage quiz answer keys" on public.quiz_answer_keys;
create policy "Admins can manage quiz answer keys"
on public.quiz_answer_keys
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

revoke all on public.quiz_answer_keys from anon;
grant select, insert, update, delete on public.quiz_answer_keys to authenticated;
