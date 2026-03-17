"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { Feedback } from "@/components/feedback";
import { apiRequest, writeAccessToken } from "@/lib/api";
import { dashboardPath } from "@/lib/routes";
import { usePlatformStore } from "@/lib/stores/platform-store";
import type { SessionUser } from "@/lib/types";

type RegisterResponse = {
  ok: boolean;
  user: SessionUser;
  access_token: string;
};

const defaultForm = {
  role: "fresher",
  name: "",
  email: "",
  password: "",
  education: "",
  grad_year: "",
  skills: "",
  location: "",
  summary: "",
  company_name: "",
  company_website: "",
  company_description: "",
  industry_type: "",
  company_size: ""
};

export default function RegisterPage() {
  const router = useRouter();
  const user = usePlatformStore((state) => state.user);
  const setUser = usePlatformStore((state) => state.setUser);
  const [form, setForm] = useState(defaultForm);
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

    const payload =
      form.role === "company"
        ? {
            role: "company",
            name: form.name,
            email: form.email,
            password: form.password,
            company_name: form.company_name,
            company_website: form.company_website,
            location: form.location,
            company_description: form.company_description,
            industry_type: form.industry_type,
            company_size: form.company_size
          }
        : {
            role: "fresher",
            name: form.name,
            email: form.email,
            password: form.password,
            education: form.education,
            grad_year: Number(form.grad_year),
            skills: form.skills,
            location: form.location,
            summary: form.summary
          };

    try {
      const response = await apiRequest<RegisterResponse>("/api/auth/register", {
        method: "POST",
        body: payload
      });
      writeAccessToken(response.access_token);
      setUser(response.user);
      setTone("success");
      setMessage("Account created. Redirecting to your workspace.");
      router.push(dashboardPath(response.user.role));
    } catch (_error) {
      setTone("error");
      setMessage("Registration failed. Check the required fields and backend connection.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AppShell title="Typed account creation for candidates and companies." subtitle="One register flow, two role-specific payloads">
      <section className="hero">
        <section className="panel stack">
          <span className="section-label">Register</span>
          <h2>Create a fresher or company account.</h2>
          <div className="button-row">
            <button
              className={`btn ${form.role === "fresher" ? "primary" : "secondary"}`}
              type="button"
              onClick={() => setForm((current) => ({ ...current, role: "fresher" }))}
            >
              Fresher
            </button>
            <button
              className={`btn ${form.role === "company" ? "primary" : "secondary"}`}
              type="button"
              onClick={() => setForm((current) => ({ ...current, role: "company" }))}
            >
              Company
            </button>
          </div>
          <Feedback message={message} tone={tone} />
          <form className="form" onSubmit={handleSubmit}>
            <div className="two-col">
              <label className="field">
                <span>Name</span>
                <input
                  value={form.name}
                  onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                  placeholder={form.role === "company" ? "Recruiter or contact name" : "Candidate name"}
                  required
                />
              </label>
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
            </div>
            <label className="field">
              <span>Password</span>
              <input
                type="password"
                value={form.password}
                onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                placeholder="Minimum 8 characters"
                minLength={8}
                required
              />
            </label>
            <label className="field">
              <span>Location</span>
              <input
                value={form.location}
                onChange={(event) => setForm((current) => ({ ...current, location: event.target.value }))}
                placeholder="City, state, or remote preference"
              />
            </label>

            {form.role === "company" ? (
              <>
                <div className="two-col">
                  <label className="field">
                    <span>Company name</span>
                    <input
                      value={form.company_name}
                      onChange={(event) => setForm((current) => ({ ...current, company_name: event.target.value }))}
                      placeholder="Company name"
                      required
                    />
                  </label>
                  <label className="field">
                    <span>Website</span>
                    <input
                      value={form.company_website}
                      onChange={(event) => setForm((current) => ({ ...current, company_website: event.target.value }))}
                      placeholder="https://company.com"
                    />
                  </label>
                </div>
                <div className="two-col">
                  <label className="field">
                    <span>Industry</span>
                    <input
                      value={form.industry_type}
                      onChange={(event) => setForm((current) => ({ ...current, industry_type: event.target.value }))}
                      placeholder="IT, SaaS, EdTech..."
                    />
                  </label>
                  <label className="field">
                    <span>Company size</span>
                    <input
                      value={form.company_size}
                      onChange={(event) => setForm((current) => ({ ...current, company_size: event.target.value }))}
                      placeholder="1-10, 11-50..."
                    />
                  </label>
                </div>
                <label className="field">
                  <span>Description</span>
                  <textarea
                    value={form.company_description}
                    onChange={(event) => setForm((current) => ({ ...current, company_description: event.target.value }))}
                    placeholder="Describe the company and hiring context."
                  />
                </label>
              </>
            ) : (
              <>
                <div className="two-col">
                  <label className="field">
                    <span>Education</span>
                    <input
                      value={form.education}
                      onChange={(event) => setForm((current) => ({ ...current, education: event.target.value }))}
                      placeholder="B.Tech, BCA, MCA..."
                      required
                    />
                  </label>
                  <label className="field">
                    <span>Graduation year</span>
                    <input
                      type="number"
                      value={form.grad_year}
                      onChange={(event) => setForm((current) => ({ ...current, grad_year: event.target.value }))}
                      placeholder="2026"
                      required
                    />
                  </label>
                </div>
                <label className="field">
                  <span>Skills</span>
                  <input
                    value={form.skills}
                    onChange={(event) => setForm((current) => ({ ...current, skills: event.target.value }))}
                    placeholder="JavaScript, SQL, React"
                  />
                </label>
                <label className="field">
                  <span>Summary</span>
                  <textarea
                    value={form.summary}
                    onChange={(event) => setForm((current) => ({ ...current, summary: event.target.value }))}
                    placeholder="Short introduction for your candidate profile."
                  />
                </label>
              </>
            )}

            <button className="btn primary" type="submit" disabled={submitting}>
              {submitting ? "Creating account..." : "Create account"}
            </button>
          </form>
        </section>

        <section className="hero-card stack">
          <span className="section-label">Why this structure</span>
          <h2>Registration now maps directly to typed backend contracts.</h2>
          <div className="detail-list">
            <div className="detail-item">
              <span>Fresher payload</span>
              <strong>Name, education, grad year, skills, location, summary</strong>
            </div>
            <div className="detail-item">
              <span>Company payload</span>
              <strong>Contact name, company name, website, location, description, industry, size</strong>
            </div>
            <div className="detail-item">
              <span>After success</span>
              <strong>Token stored in session state and routed into the matching dashboard</strong>
            </div>
          </div>
          <div className="message">
            Already registered?{" "}
            <Link href="/login" className="inline-link">
              Sign in here
            </Link>
            .
          </div>
        </section>
      </section>
    </AppShell>
  );
}
