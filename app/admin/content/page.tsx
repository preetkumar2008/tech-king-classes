import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ContentManager from "./content-manager";

export default async function AdminContentPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("full_name, role").eq("id", user.id).single();
  if (profile?.role !== "admin") redirect("/student/dashboard");

  const [{ data: courses }, { data: modules }, { data: lessons }] = await Promise.all([
    supabase.from("courses").select("id, title, slug").order("title"),
    supabase.from("modules").select("id, course_id, title, description, sort_order").order("sort_order"),
    supabase.from("lessons").select("id, module_id, title, slug, description, video_url, notes_url, sort_order, is_free_preview").order("sort_order"),
  ]);

  return (
    <main className="admin-page">
      <header className="admin-header">
        <div>
          <p className="dashboard-label">CONTENT MANAGEMENT</p>
          <h1>Modules & Lessons</h1>
          <p>Build the learning structure inside every Tech King Classes course.</p>
        </div>
        <div className="admin-header-actions">
          <Link href="/admin/courses" className="secondary-button">← Courses</Link>
          <Link href="/admin" className="primary-button">Dashboard</Link>
        </div>
      </header>
      <ContentManager courses={courses ?? []} initialModules={modules ?? []} initialLessons={lessons ?? []} />
    </main>
  );
}
