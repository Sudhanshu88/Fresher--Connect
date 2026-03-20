"use client";

import { FormEvent, Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import { AuthShell } from "@/components/auth-shell";
import { Feedback } from "@/components/feedback";
import { dashboardPath } from "@/lib/routes";
import { usePlatformStore } from "@/lib/stores/platform-store";

const roleContent = {
  fresher: {
    label: "Candidate Sign In",
    title: "Return to your hiring journey with full visibility.",
    description: "Access live opportunities, saved roles, and application progress from one professional workspace.",
    summary: "Use your candidate account to continue exploring roles and monitoring every application milestone.",
    noteTitle: "Candidate workspace",
    noteBody: "Continue from saved roles, recent applications, and your latest hiring updates.",
    featureA: {
      kicker: "Candidate Workspace",
      title: "Search, submit, track",
      body: "Review verified opportunities, submit applications, and monitor progress from one workspace."
    },
    featureB: {
      kicker: "Application Progress",
      title: "Stay informed at every stage",
      body: "See where each application stands and what action, if any, is required next."
    },
    flowPoints: [
      "Opportunity discovery remains available before sign-in.",
      "Application tracking becomes available after account access is confirmed.",
      "Authentication and session controls stay protected through the platform API."
    ],
    registerHref: "/register",
    registerText: "Create a candidate account",
    submitText: "Sign in as candidate"
  },
  company: {
    label: "Company Sign In",
    title: "Return to your recruiter workspace and move hiring decisions forward.",
    description: "Verified company accounts unlock job listing creation, applicant review, and hiring pipeline management in one workspace.",
    summary: "Use your verified company account to publish opportunities, review candidate profiles, and update every hiring stage.",
    noteTitle: "Recruiter workspace",
    noteBody: "Create listings, review candidates, and manage hiring decisions after admin verification.",
    featureA: {
      kicker: "Recruiter Workspace",
      title: "Create and manage listings",
      body: "Launch structured job listings, keep employer details consistent, and stay ready for new applicants."
    },
    featureB: {
      kicker: "Candidate Pipeline",
      title: "Review and update talent",
      body: "Move applicants between stages, collaborate around decisions, and keep the hiring team aligned."
    },
    flowPoints: [
      "Only admin-verified company accounts can access the recruiter workspace.",
      "Unauthenticated access returns to the dedicated company sign-in path.",
      "Authentication and session controls stay protected through the platform API."
    ],
    registerHref: "/register?role=company",
    registerText: "Create a company account",
    submitText: "Sign in to recruiter workspace"
  }
} as const;

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="auth-shell">
          <section className="auth-card auth-card-strong">
            <div className="empty-state">Loading sign-in experience...</div>
          </section>
        </main>
      }
    >
      <LoginPageContent />
    </Suspense>
  );
}

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const user = usePlatformStore((state) => state.user);
  const login = usePlatformStore((state) => state.login);
  const [form, setForm] = useState({ email: "", password: "" });
  const [message, setMessage] = useState("");
  const [tone, setTone] = useState<"default" | "error" | "success">("default");
  const [submitting, setSubmitting] = useState(false);

  const role = searchParams.get("role") === "company" ? "company" : "fresher";
  const content = roleContent[role];

  function roleHref(nextRole: "fresher" | "company") {
    const params = new URLSearchParams();
    if (nextRole === "company") {
      params.set("role", "company");
    }
    const nextPath = searchParams.get("next");
    if (nextPath) {
      params.set("next", nextPath);
    }
    return params.toString() ? `/login?${params.toString()}` : "/login";
  }

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
      const nextPath = searchParams.get("next");
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
    <AuthShell
      brandSubtitle={role === "company" ? "Secure recruiter access" : "Secure account access"}
      left={
        <>
          <div className="page-intro auth-copy-block">
            <span className="section-label">{content.label}</span>
            <h1 className="page-title">{content.title}</h1>
            <p className="muted">{content.description}</p>
          </div>

          <div className="role-switch auth-role-switch" aria-label="Select sign-in role">
            <button
              type="button"
              className={role === "fresher" ? "active" : ""}
              onClick={() => router.replace(roleHref("fresher"))}
            >
              Candidate
            </button>
            <button
              type="button"
              className={role === "company" ? "active" : ""}
              onClick={() => router.replace(roleHref("company"))}
            >
              Company
            </button>
          </div>

          <p className="helper-text auth-role-summary">{content.summary}</p>

          <div className="auth-feature-grid">
            <article className="auth-feature-card">
              <span className="preview-kicker">{content.featureA.kicker}</span>
              <h3>{content.featureA.title}</h3>
              <p>{content.featureA.body}</p>
            </article>
            <article className="auth-feature-card">
              <span className="preview-kicker">{content.featureB.kicker}</span>
              <h3>{content.featureB.title}</h3>
              <p>{content.featureB.body}</p>
            </article>
          </div>

          <section className="card auth-note-card">
            <span className="section-label">Access Flow</span>
            <div className="detail-list">
              {content.flowPoints.map((point) => (
                <div className="detail-item" key={point}>
                  <strong>{point}</strong>
                </div>
              ))}
            </div>
          </section>
        </>
      }
      right={
        <>
          <div className="auth-card-copy">
            <span className="section-label">{content.noteTitle}</span>
            <h2>Welcome back</h2>
            <p className="muted">{content.noteBody}</p>
          </div>

          <Feedback message={message} tone={tone} />
          <form className="form-grid" onSubmit={handleSubmit}>
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
              {submitting ? "Signing in..." : content.submitText}
            </button>
          </form>

          <div className="auth-inline-meta">
            <span>New to Fresher Connect?</span>
            <Link href={content.registerHref} className="text-link">
              {content.registerText}
            </Link>
          </div>

          <div className="auth-inline-meta">
            <span>Platform administrator?</span>
            <Link href="/admin/login" className="text-link">
              Use the admin sign-in
            </Link>
          </div>
        </>
      }
    />
  );
}
