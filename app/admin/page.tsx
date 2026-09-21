import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function AdminDashboardPage() {
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

  const [
    { count: students },
    { count: courses },
    { count: publishedCourses },
    { count: lessons },
    { count: quizzes },
    { count: certificates },
  ] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "student"),
    supabase.from("courses").select("id", { count: "exact", head: true }),
    supabase.from("courses").select("id", { count: "exact", head: true }).eq("is_published", true),
    supabase.from("lessons").select("id", { count: "exact", head: true }),
    supabase.from("quizzes").select("id", { count: "exact", head: true }),
    supabase.from("certificates").select("id", { count: "exact", head: true }),
  ]);

  const stats = [
    ["👨‍🎓", "Students", students ?? 0],
    ["📚", "Total Courses", courses ?? 0],
    ["🌐", "Published Courses", publishedCourses ?? 0],
    ["🎥", "Lessons", lessons ?? 0],
    ["📝", "Quizzes", quizzes ?? 0],
    ["🏆", "Certificates", certificates ?? 0],
  ];

  return (
    <main className="admin-page">
      <header className="admin-header">
        <div>
          <p className="dashboard-label">TECH KING CLASSES</p>
          <h1>Admin Dashboard</h1>
          <p>Welcome, {profile.full_name || "Admin"} 👋</p>
        </div>
        <div className="admin-header-actions">
          <Link href="/student/dashboard" className="secondary-button">Student View</Link>
          <Link href="/courses" className="primary-button">View Website</Link>
        </div>
      </header>

      <section className="admin-stats-grid">
        {stats.map(([icon, label, value]) => (
          <div className="admin-stat-card" key={label as string}>
            <span>{icon}</span>
            <div>
              <p>{label}</p>
              <strong>{value}</strong>
            </div>
          </div>
        ))}
      </section>

      <section className="admin-section">
        <div className="admin-section-heading">
          <div>
            <p className="dashboard-label">CONTENT MANAGEMENT</p>
            <h2>Manage Tech King Classes</h2>
          </div>
        </div>

        <div className="admin-action-grid">
          <Link href="/admin/courses" className="admin-action-card">
            <span>📚</span><div><h3>Courses</h3><p>Add, edit, publish and manage courses.</p></div><b>→</b>
          </Link>
          <Link href="/admin/content" className="admin-action-card">
            <span>🧩</span><div><h3>Modules & Lessons</h3><p>Build modules, lessons, videos and notes.</p></div><b>→</b>
          </Link>
          <Link href="/admin/enrollments" className="admin-action-card">
            <span>💳</span><div><h3>Enrollments & Payments</h3><p>Track enrollments and payment-ready access.</p></div><b>→</b>
          </Link>
          <Link href="/admin/students" className="admin-action-card">
            <span>👨‍🎓</span><div><h3>Students</h3><p>View registered students and learning status.</p></div><b>→</b>
          </Link>
          <Link href="/admin/quizzes" className="admin-action-card">
            <span>📝</span><div><h3>Quizzes</h3><p>Manage tests and question content.</p></div><b>→</b>
          </Link>
          <Link href="/admin/notifications" className="admin-action-card">
            <span>🔔</span><div><h3>Notifications</h3><p>Create and publish student announcements.</p></div><b>→</b>
          </Link>
          <Link href="/admin/analytics" className="admin-action-card">
            <span>📊</span><div><h3>Analytics</h3><p>Track course performance, quizzes and learning outcomes.</p></div><b>→</b>
          </Link>
          <Link href="/certificates" className="admin-action-card">
            <span>🏆</span><div><h3>Certificates</h3><p>Review issued certificates.</p></div><b>→</b>
          </Link>
        </div>
      </section>

      <section className="admin-notice">
        <span>🔐</span>
        <div>
          <strong>Admin access is protected.</strong>
          <p>Only profiles with the <code>admin</code> role can access this dashboard and admin data policies.</p>
        </div>
      </section>
    </main>
  );
}
