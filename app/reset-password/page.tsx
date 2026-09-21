"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const router = useRouter();
  const supabase = createClient();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [ready, setReady] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;

    const prepareRecovery = async () => {
      const { data } = await supabase.auth.getSession();
      if (mounted && data.session) setReady(true);
    };

    prepareRecovery();

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      if (event === "PASSWORD_RECOVERY" && session) setReady(true);
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, [supabase]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    setMessage("Password updated successfully. You can now login with your new password.");
    setPassword("");
    setConfirmPassword("");
  }

  return (
    <main className="auth-shell">
      <div className="auth-card">
        <div className="auth-logo">
          <img src="/tech-king-logo.png" alt="Tech King Classes" />
        </div>
        <h1>Set New Password</h1>
        <p className="auth-subtitle">
          {ready ? "Choose a new password for your Tech King Classes account." : "Open this page using the secure link from your reset email."}
        </p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label>
            New Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter new password"
              minLength={6}
              required
              disabled={!ready || loading}
            />
          </label>

          <label>
            Confirm Password
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              minLength={6}
              required
              disabled={!ready || loading}
            />
          </label>

          {error && <div className="auth-error">{error}</div>}
          {message && <div className="auth-success">{message}</div>}

          <button type="submit" disabled={!ready || loading}>
            {loading ? "Updating..." : "Update Password"}
          </button>
        </form>

        <p className="auth-footer-link">
          <Link href="/login" onClick={() => router.refresh()}>Back to Login</Link>
        </p>
      </div>
    </main>
  );
}
