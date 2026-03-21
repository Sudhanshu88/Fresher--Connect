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
      setMessage("Welcome back. Your governance workspace is ready.");
      router.push("/admin");
    } catch (_error) {
      setTone("error");
      setMessage("We couldn't verify admin access. Please review your credentials and try again.");
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
            <h1 className="page-title">Access the governance console with confidence.</h1>
            <p className="muted">
              This route is reserved for platform leaders who verify employers, moderate live roles, and protect marketplace quality.
            </p>
          </div>

          <div className="auth-feature-grid">
            <article className="auth-feature-card">
              <span className="preview-kicker">Employer Verification</span>
              <h3>Control who enters the hiring ecosystem</h3>
              <p>Approve trusted employer accounts before recruiter access is activated across the platform.</p>
            </article>
            <article className="auth-feature-card">
              <span className="preview-kicker">Marketplace Quality</span>
              <h3>Review listings before they go live</h3>
              <p>Approve, hold, or reject opportunities to protect candidate trust and listing quality.</p>
            </article>
          </div>

          <section className="card auth-note-card">
            <span className="section-label">Leadership Scope</span>
            <div className="detail-list">
              <div className="detail-item">
                <span>Audit visibility</span>
                <strong>Monitor high-impact actions and keep every moderation decision accountable.</strong>
              </div>
              <div className="detail-item">
                <span>Access controls</span>
                <strong>Admin access remains isolated from candidate and recruiter authentication for stronger governance.</strong>
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
            <p className="muted">Sign in with your administrator credentials to continue platform governance and quality control.</p>
          </div>

          <Feedback message={message} tone={tone} />
          <form className="form-grid" onSubmit={handleSubmit}>
            <label className="field">
              <span>Administrator Email Address</span>
              <input
                type="email"
                value={form.email}
                onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                placeholder="admin@company.com"
                required
              />
            </label>
            <label className="field">
              <span>Administrator Password</span>
              <input
                type="password"
                value={form.password}
                onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                placeholder="Enter your administrator password"
                required
              />
            </label>
            <button className="btn primary" type="submit" disabled={submitting}>
              {submitting ? "Verifying access..." : "Enter Governance Console"}
            </button>
          </form>

          <div className="auth-inline-meta">
            <span>Not an admin?</span>
            <Link href="/login" className="text-link">
              Use standard sign in
            </Link>
          </div>
        </>
      }
    />
  );
}
