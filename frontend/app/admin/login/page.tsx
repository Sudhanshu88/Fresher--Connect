"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { AppShell } from "@/components/app-shell";
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
      setMessage("Admin login successful. Redirecting to the admin workspace.");
      router.push("/admin");
    } catch (_error) {
      setTone("error");
      setMessage("Admin login failed. Use an admin account and confirm the backend is running.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AppShell title="Admin-only sign in for verification, moderation, and access control." subtitle="Separate admin entry point over the Flask backend">
      <section className="hero">
        <section className="panel stack">
          <span className="section-label">Admin Login</span>
          <h2>Access the moderation workspace.</h2>
          <p className="muted">
            This route is reserved for platform admins who verify companies, review jobs, and manage permissions.
          </p>
          <Feedback message={message} tone={tone} />
          <form className="form" onSubmit={handleSubmit}>
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
              {submitting ? "Signing in..." : "Login as admin"}
            </button>
          </form>
        </section>

        <section className="hero-card stack">
          <span className="section-label">Admin scope</span>
          <div className="detail-list">
            <div className="detail-item">
              <span>Company verification</span>
              <strong>Approve or reject recruiter accounts before company access is enabled</strong>
            </div>
            <div className="detail-item">
              <span>Job moderation</span>
              <strong>Hide, approve, or reject job posts from the admin dashboard</strong>
            </div>
            <div className="detail-item">
              <span>User control</span>
              <strong>Disable risky accounts and review audit activity from one page</strong>
            </div>
          </div>
          <div className="message">
            Not an admin?{" "}
            <Link href="/login" className="inline-link">
              Use the standard login
            </Link>
            .
          </div>
        </section>
      </section>
    </AppShell>
  );
}
