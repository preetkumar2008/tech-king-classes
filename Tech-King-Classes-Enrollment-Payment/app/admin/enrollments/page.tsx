import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function AdminEnrollmentsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") redirect("/student/dashboard");

  const { data: rows } = await supabase
    .from("enrollments")
    .select("id,status,enrolled_at,expires_at,profiles(full_name,mobile),courses(title,price,is_free)")
    .order("enrolled_at", { ascending: false });

  return (
    <main className="admin-page">
      <header className="admin-header">
        <div><p className="dashboard-label">ADMIN • LMS</p><h1>Enrollments & Payments</h1><p>Track free enrollments and payment-ready course access.</p></div>
        <Link href="/admin" className="secondary-button">← Dashboard</Link>
      </header>
      <section className="admin-section">
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead><tr><th>Student</th><th>Course</th><th>Type</th><th>Status</th><th>Enrolled</th></tr></thead>
            <tbody>
              {(rows || []).map((row: any) => (
                <tr key={row.id}>
                  <td><strong>{row.profiles?.full_name || "Student"}</strong><small>{row.profiles?.mobile || ""}</small></td>
                  <td>{row.courses?.title || "Course"}</td>
                  <td>{row.courses?.is_free ? "Free" : `₹${Number(row.courses?.price || 0).toLocaleString("en-IN")}`}</td>
                  <td><span className="status-pill">{row.status}</span></td>
                  <td>{new Date(row.enrolled_at).toLocaleDateString("en-IN")}</td>
                </tr>
              ))}
              {!rows?.length && <tr><td colSpan={5}>No enrollments yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
