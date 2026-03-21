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
    title: "Return to your search with complete visibility.",
    description: "Review verified openings, saved opportunities, and live application progress from one organized career dashboard.",
    summary: "Use your candidate account to continue exploring opportunities, monitoring updates, and presenting yourself professionally.",
    noteTitle: "Candidate access",
    noteBody: "Continue exploring roles, tracking recruiter updates, and building momentum toward your next opportunity.",
    featureA: {
      kicker: "Career Momentum",
      title: "Discover better-fit opportunities",
      body: "Review verified roles faster and focus your time on openings that truly match your strengths."
    },
    featureB: {
      kicker: "Application Clarity",
      title: "Track every recruiter response",
      body: "Stay informed at each stage so you always know what comes next and when to act."
    },
    flowPoints: [
      "Browse verified roles before signing in, then unlock faster applications once your account is active.",
      "Saved opportunities, application timelines, and profile tools remain connected in one place.",
      "Secure session controls protect your account while keeping access simple and professional."
    ],
    registerHref: "/register",
    registerText: "Build your career profile",
    submitText: "Continue to Career Dashboard"
  },
  company: {
    label: "Employer Sign In",
    title: "Return to your hiring workflow with confidence.",
    description: "Verified employer accounts unlock job posting, candidate review, and structured hiring decisions from one professional workspace.",
    summary: "Use your employer account to publish opportunities, evaluate talent, and move every hiring stage forward with clarity.",
    noteTitle: "Employer access",
    noteBody: "Create opportunities, review candidates, and keep recruiters aligned after account verification is complete.",
    featureA: {
      kicker: "Hiring Efficiency",
      title: "Publish roles with consistency",
      body: "Launch polished opportunities quickly while keeping employer branding and job expectations aligned."
    },
    featureB: {
      kicker: "Pipeline Visibility",
      title: "Move talent forward decisively",
      body: "Review applicants, update stages, and keep your hiring team informed without scattered communication."
    },
    flowPoints: [
      "Only verified employer accounts can enter the hiring workspace and manage live opportunities.",
      "Job publishing, applicant review, and stage updates stay connected inside one secure operating flow.",
      "Protected session controls help your team move quickly without compromising access integrity."
    ],
    registerHref: "/register?role=company",
    registerText: "Create an employer account",
    submitText: "Enter Hiring Workspace"
  }
} as const;

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="auth-shell">
          <section className="auth-card auth-card-strong">
            <div className="empty-state">Preparing secure sign-in...</div>
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
      setMessage("Welcome back. Your workspace is ready.");
      router.push(nextPath || dashboardPath(sessionUser.role));
    } catch (_error) {
      setTone("error");
      setMessage("We couldn't sign you in. Please confirm your credentials and try again.");
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
            <span className="section-label">What You Can Do</span>
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
              <span>Professional Email Address</span>
              <input
                type="email"
                value={form.email}
                onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                placeholder="you@example.com"
                required
              />
            </label>
            <label className="field">
              <span>Secure Password</span>
              <input
                type="password"
                value={form.password}
                onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                placeholder="Enter your password"
                required
              />
            </label>
            <button className="btn primary" type="submit" disabled={submitting}>
              {submitting ? "Signing you in..." : content.submitText}
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
              Use the governance sign in
            </Link>
          </div>
        </>
      }
    />
  );
}
