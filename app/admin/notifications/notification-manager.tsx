"use client";

import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export type NotificationRow = {
  id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "live";
  is_published: boolean;
  publish_at: string;
  expires_at: string | null;
  created_at: string;
};

export default function NotificationManager({ initialNotifications }: { initialNotifications: NotificationRow[] }) {
  const supabase = createClient();
  const [notifications, setNotifications] = useState(initialNotifications);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [type, setType] = useState<NotificationRow["type"]>("info");
  const [expiresAt, setExpiresAt] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function createNotification(event: FormEvent) {
    event.preventDefault();
    setError("");
    setSuccess("");
    if (!title.trim() || !message.trim()) {
      setError("Title and message are required.");
      return;
    }

    setBusy(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError("Admin session not found.");
      setBusy(false);
      return;
    }

    const { data, error: insertError } = await supabase
      .from("notifications")
      .insert({
        title: title.trim(),
        message: message.trim(),
        type,
        is_published: false,
        created_by: user.id,
        ...(expiresAt ? { expires_at: new Date(expiresAt).toISOString() } : {}),
      })
      .select("id,title,message,type,is_published,publish_at,expires_at,created_at")
      .single();

    if (insertError) setError(insertError.message);
    else if (data) {
      setNotifications((current) => [data, ...current]);
      setTitle("");
      setMessage("");
      setExpiresAt("");
      setSuccess("Announcement created as draft.");
    }
    setBusy(false);
  }

  async function togglePublished(notification: NotificationRow) {
    setError("");
    const { data, error: updateError } = await supabase
      .from("notifications")
      .update({ is_published: !notification.is_published, updated_at: new Date().toISOString() })
      .eq("id", notification.id)
      .select("id,title,message,type,is_published,publish_at,expires_at,created_at")
      .single();

    if (updateError) setError(updateError.message);
    else if (data) setNotifications((current) => current.map((item) => item.id === data.id ? data : item));
  }

  async function removeNotification(id: string) {
    if (!window.confirm("Delete this announcement?")) return;
    setError("");
    const { error: deleteError } = await supabase.from("notifications").delete().eq("id", id);
    if (deleteError) setError(deleteError.message);
    else setNotifications((current) => current.filter((item) => item.id !== id));
  }

  return (
    <div className="notification-admin-grid">
      <form className="admin-panel notification-form" onSubmit={createNotification}>
        <div className="admin-panel-heading"><div><p className="dashboard-label">NEW ANNOUNCEMENT</p><h2>Create Notification</h2></div></div>
        <label>Title<input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. New Python Batch Starts Monday" /></label>
        <label>Message<textarea rows={6} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Write the announcement students should see..." /></label>
        <div className="admin-form-row">
          <label>Type<select value={type} onChange={(e) => setType(e.target.value as NotificationRow["type"])}><option value="info">Info</option><option value="success">Success</option><option value="warning">Important</option><option value="live">Live Class</option></select></label>
          <label>Expires (optional)<input type="datetime-local" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} /></label>
        </div>
        {error && <p className="admin-error">{error}</p>}
        {success && <p className="admin-success-card">{success}</p>}
        <button className="primary-button" type="submit" disabled={busy}>{busy ? "Creating..." : "Create Draft"}</button>
      </form>

      <section className="admin-panel">
        <div className="admin-panel-heading"><div><p className="dashboard-label">ANNOUNCEMENTS</p><h2>Manage Notifications</h2></div><span className="admin-count">{notifications.length} total</span></div>
        <div className="notification-admin-list">
          {notifications.length === 0 ? <p className="admin-empty">No announcements yet.</p> : notifications.map((notification) => (
            <article className="notification-admin-card" key={notification.id}>
              <div className="notification-admin-main"><div className={`notification-type ${notification.type}`}>{notification.type}</div><h3>{notification.title}</h3><p>{notification.message}</p><small>Created {new Date(notification.created_at).toLocaleString()}</small></div>
              <div className="content-actions"><button type="button" onClick={() => togglePublished(notification)}>{notification.is_published ? "Unpublish" : "Publish"}</button><button type="button" onClick={() => removeNotification(notification.id)}>Delete</button></div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
