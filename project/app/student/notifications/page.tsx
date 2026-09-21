import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function StudentNotificationsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: notifications } = await supabase
    .from("notifications")
    .select("id,title,message,type,publish_at,created_at")
    .order("publish_at", { ascending: false });

  const { data: reads } = await supabase
    .from("notification_reads")
    .select("notification_id")
    .eq("user_id", user.id);
  const readIds = new Set((reads || []).map((row) => row.notification_id));

  return (
    <main className="student-dashboard">
      <header className="dashboard-header"><div><p className="dashboard-label">TECH KING CLASSES</p><h1>Notifications</h1><p>Important announcements and class updates.</p></div><Link href="/student/dashboard" className="secondary-button">← Dashboard</Link></header>
      <section className="student-notification-list">
        {(notifications || []).length === 0 ? <div className="admin-empty-card"><span>🔔</span><h3>No notifications</h3><p>You are all caught up.</p></div> : (notifications || []).map((notification) => (
          <article className={`student-notification-card ${notification.type} ${readIds.has(notification.id) ? "read" : "unread"}`} key={notification.id}>
            <div className="notification-icon">{notification.type === "live" ? "🔴" : notification.type === "warning" ? "⚠️" : notification.type === "success" ? "✅" : "🔔"}</div>
            <div><div className="notification-meta"><span>{notification.type}</span><time>{new Date(notification.publish_at).toLocaleString()}</time></div><h2>{notification.title}</h2><p>{notification.message}</p></div>
          </article>
        ))}
      </section>
    </main>
  );
}
