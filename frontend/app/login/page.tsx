"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { Feedback } from "@/components/feedback";
import { dashboardPath } from "@/lib/routes";
import { usePlatformStore } from "@/lib/stores/platform-store";

export default function LoginPage() {
  const router = useRouter();
  const user = usePlatformStore((state) => state.user);
  const login = usePlatformStore((state) => state.login);
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
      const nextPath =
        typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("next") : null;
      const sessionUser = await login(form);
      setTone("success");
      setMessage("Sign-in successful. Redirecting to your workspace.");
      router.push(nextPath || dashboardPath(sessionUser.role));
    } catch (_error) {
      setTone("error");
      setMessage("Sign-in failed. Check your email, password, and backend availability.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AppShell title="Role-based sign in for candidates and recruiters." subtitle="Typed auth flow over the existing backend">
      <section className="hero">
        <section className="panel stack">
          <span className="section-label">Sign In</span>
          <h2>Continue into the right workspace.</h2>
          <p className="muted">
            Candidate and company sign-in use the shared auth flow here. Admin accounts have a separate login page.
          </p>
          <Feedback message={message} tone={tone} />
          <form className="form" onSubmit={handleSubmit}>
            <label className="field">
              <span>Email</span>
              <input
                type="email"
                value={form.email}
                onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                placeholder="name@example.com"
                required
              />
            </label>
            <label className="field">
              <span>Password</span>
              <input
                type="password"
                value={form.password}
                onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                placeholder="Enter password"
                required
              />
            </label>
            <button className="btn primary" type="submit" disabled={submitting}>
              {submitting ? "Signing in..." : "Sign in"}
            </button>
          </form>
        </section>

        <section className="hero-card stack">
          <span className="section-label">Access map</span>
          <div className="detail-list">
            <div className="detail-item">
              <span>Candidate</span>
              <strong>/user dashboard with applications, notifications, and profile state</strong>
            </div>
            <div className="detail-item">
              <span>Company</span>
              <strong>/company dashboard with analytics, jobs, and pipeline controls</strong>
            </div>
            <div className="detail-item">
              <span>Admin</span>
              <strong>/admin/login for verification, moderation, and audit controls</strong>
            </div>
          </div>
          <div className="message">
            No account yet?{" "}
            <Link href="/register" className="inline-link">
              Create one in the new TypeScript flow
            </Link>
            . Admins should{" "}
            <Link href="/admin/login" className="inline-link">
              use the separate admin login
            </Link>
            .
          </div>
        </section>
      </section>
    </AppShell>
  );
}
