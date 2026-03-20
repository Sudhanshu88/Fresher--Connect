"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { AuthShell } from "@/components/auth-shell";
import { Feedback } from "@/components/feedback";
import { dashboardPath } from "@/lib/routes";
import { usePlatformStore } from "@/lib/stores/platform-store";

export default function AdminLoginPage() {
  const router = useRouter();
  const user = usePlatformStore((state) => state.user);
  const loginAdmin = usePlatformStore((state) => state.loginAdmin);
  const [form, setForm] = useState({ email: "", password: "" });
  const [message, setMessage] = useState("");
  const [tone, setTone] = useState<"default" | "error" | "success">("default");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      router.replace(dashboardPath(user.role));
    }
  }, [router, user]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setMessage("");

    try {
      await loginAdmin(form);
      setTone("success");
      setMessage("Admin login successful. Redirecting to the governance workspace.");
      router.push("/admin");
    } catch (_error) {
      setTone("error");
      setMessage("Admin login failed. Use an admin account and confirm the backend is running.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthShell
      brandSubtitle="Protected governance access"
      left={
        <>
          <div className="page-intro auth-copy-block">
            <span className="section-label">Admin Sign In</span>
            <h1 className="page-title">Access the moderation and governance workspace.</h1>
            <p className="muted">
              This route is reserved for platform admins who verify companies, review jobs, and manage access controls.
            </p>
          </div>

          <div className="auth-feature-grid">
            <article className="auth-feature-card">
              <span className="preview-kicker">Company Verification</span>
              <h3>Control recruiter access</h3>
              <p>Approve or reject employer accounts before workspace access is enabled.</p>
            </article>
            <article className="auth-feature-card">
              <span className="preview-kicker">Job Moderation</span>
              <h3>Review listing quality</h3>
              <p>Hide, approve, or reject listings before they become visible to candidates.</p>
            </article>
          </div>

          <section className="card auth-note-card">
            <span className="section-label">Admin Scope</span>
            <div className="detail-list">
              <div className="detail-item">
                <span>Audit visibility</span>
                <strong>Review recent platform activity and keep moderation decisions accountable.</strong>
              </div>
              <div className="detail-item">
                <span>Access controls</span>
                <strong>Admin routes stay isolated from candidate and recruiter authentication flows.</strong>
              </div>
            </div>
          </section>
        </>
      }
      right={
        <>
          <div className="auth-card-copy">
            <span className="section-label">Admin Access</span>
            <h2>Welcome back</h2>
            <p className="muted">Sign in with an administrator account to continue platform governance.</p>
          </div>

          <Feedback message={message} tone={tone} />
          <form className="form-grid" onSubmit={handleSubmit}>
            <label className="field">
              <span>Email</span>
              <input
                type="email"
                value={form.email}
                onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                placeholder="admin@example.com"
                required
              />
            </label>
            <label className="field">
              <span>Password</span>
              <input
                type="password"
                value={form.password}
                onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                placeholder="Enter admin password"
                required
              />
            </label>
            <button className="btn primary" type="submit" disabled={submitting}>
              {submitting ? "Signing in..." : "Sign in as admin"}
            </button>
          </form>

          <div className="auth-inline-meta">
            <span>Not an admin?</span>
            <Link href="/login" className="text-link">
              Use the standard login
            </Link>
          </div>
        </>
      }
    />
  );
}
