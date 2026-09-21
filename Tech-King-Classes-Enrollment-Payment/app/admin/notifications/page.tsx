import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import NotificationManager, { NotificationRow } from "./notification-manager";

export default async function AdminNotificationsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("full_name, role").eq("id", user.id).single();
  if (profile?.role !== "admin") redirect("/student/dashboard");

  const { data: notifications } = await supabase
    .from("notifications")
    .select("id,title,message,type,is_published,publish_at,expires_at,created_at")
    .order("created_at", { ascending: false });

  return (
    <main className="admin-page">
      <header className="admin-header">
        <div><p className="dashboard-label">TECH KING CLASSES</p><h1>Notifications & Announcements</h1><p>Publish important updates for your students.</p></div>
        <div className="admin-header-actions"><Link href="/admin" className="secondary-button">← Admin Dashboard</Link><Link href="/student/dashboard" className="primary-button">Student View</Link></div>
      </header>
      <NotificationManager initialNotifications={(notifications || []) as NotificationRow[]} />
    </main>
  );
}
