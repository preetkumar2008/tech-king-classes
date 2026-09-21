import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import CourseManager from "./course-manager";

export default async function AdminCoursesPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") redirect("/student/dashboard");

  const { data: courses, error } = await supabase
    .from("courses")
    .select("id, title, slug, short_description, description, thumbnail_url, level, language, duration, is_free, price, is_published, created_at, updated_at")
    .order("created_at", { ascending: false });

  return (
    <main className="admin-page">
      <header className="admin-header">
        <div>
          <p className="dashboard-label">CONTENT MANAGEMENT</p>
          <h1>Course Management</h1>
          <p>Add, edit, publish and organize your Tech King Classes courses.</p>
        </div>
        <div className="admin-header-actions">
          <Link href="/admin" className="secondary-button">← Dashboard</Link>
          <Link href="/courses" className="primary-button">View Website</Link>
        </div>
      </header>

      {error ? (
        <section className="admin-error-card">
          <strong>Could not load courses.</strong>
          <p>{error.message}</p>
          <small>Make sure the admin role migration has been run in Supabase.</small>
        </section>
      ) : null}

      <CourseManager initialCourses={courses ?? []} />
    </main>
  );
}
