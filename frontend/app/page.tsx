"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";

import { AppShell } from "@/components/app-shell";
import { Feedback } from "@/components/feedback";
import { StatCard } from "@/components/stat-card";
import { apiRequest, resolveApiBase } from "@/lib/api";
import { formatDateTime } from "@/lib/format";
import { usePlatformStore } from "@/lib/stores/platform-store";
import type { Review } from "@/lib/types";

type ReviewResponse = {
  ok: boolean;
  reviews: Review[];
};

type CreateReviewResponse = {
  ok: boolean;
  review: Review;
};

const defaultReviewForm = {
  name: "",
  role: "guest",
  rating: "5",
  review: ""
};

export default function HomePage() {
  const user = usePlatformStore((state) => state.user);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [tone, setTone] = useState<"default" | "error" | "success">("default");
  const [form, setForm] = useState(defaultReviewForm);

  useEffect(() => {
    if (!user) {
      return;
    }
    setForm((current) => ({
      ...current,
      name: current.name || user.company_name || user.name || "",
      role: user.role
    }));
  }, [user]);

  useEffect(() => {
    let active = true;

    async function loadReviews() {
      try {
        const response = await apiRequest<ReviewResponse>("/api/reviews?limit=6");
        if (active) {
          setReviews(response.reviews);
        }
      } catch (_error) {
        if (active) {
          setTone("error");
          setMessage("Reviews could not be loaded from the backend.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadReviews();
    return () => {
      active = false;
    };
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    try {
      const response = await apiRequest<CreateReviewResponse>("/api/reviews", {
        method: "POST",
        body: {
          name: form.name,
          role: form.role,
          rating: Number(form.rating),
          review: form.review
        }
      });
      setReviews((current) => [response.review, ...current].slice(0, 6));
      setForm((current) => ({ ...defaultReviewForm, name: current.name, role: current.role }));
      setTone("success");
      setMessage("Review stored in the backend database.");
    } catch (_error) {
      setTone("error");
      setMessage("Review submit failed. Check backend connection and try again.");
    }
  }

  return (
    <AppShell
      title="Structured opportunity discovery for candidates. Efficient hiring operations for employers."
      subtitle="Hiring journeys designed for both sides"
    >
      <section className="hero">
        <div className="stack">
          <span className="section-label">Entry-Level Hiring Platform</span>
          <p className="muted">
            This frontend is now structured as a scalable React application using Next.js App Router,
            TypeScript contracts, and Zustand state. The current Flask + MongoDB backend remains the data layer.
          </p>
          <div className="button-row">
            <Link href="/jobs" className="btn primary">
              Explore jobs
            </Link>
            <Link href="/register" className="btn secondary">
              Create account
            </Link>
          </div>
          <div className="card-grid">
            <StatCard label="Frontend stack" value="Next.js" hint="App Router, route-level composition, server-ready structure" />
            <StatCard label="Type safety" value="TypeScript" hint="Typed auth, jobs, applications, dashboards, and analytics" />
            <StatCard label="Shared state" value="Zustand" hint="Session, dashboards, and role-specific workspace state" />
          </div>
        </div>
        <section className="hero-card stack">
          <span className="section-label">Migration Scope</span>
          <h2>Core product routes are now organized as React pages.</h2>
          <div className="detail-list">
            <div className="detail-item">
              <span>Candidate flow</span>
              <strong>Landing - Opportunities - Sign in/Registration - Workspace - Application detail</strong>
            </div>
            <div className="detail-item">
              <span>Recruiter flow</span>
              <strong>Recruiter workspace - Employer branding - Job publishing - Pipeline updates</strong>
            </div>
            <div className="detail-item">
              <span>Admin flow</span>
              <strong>Analytics, audit activity, verification controls, and moderation</strong>
            </div>
            <div className="detail-item">
              <span>API base</span>
              <strong>{resolveApiBase()}</strong>
            </div>
          </div>
        </section>
      </section>

      <section className="card-grid">
        <div className="panel stack">
          <span className="section-label">Pages</span>
          <h3>Route groups aligned to product roles</h3>
          <div className="tag-list">
            <span className="tag">/jobs</span>
            <span className="tag">/jobs/[id]</span>
            <span className="tag">/login</span>
            <span className="tag">/register</span>
            <span className="tag">/user</span>
            <span className="tag">/company</span>
            <span className="tag">/admin</span>
          </div>
        </div>
        <div className="panel stack">
          <span className="section-label">State</span>
          <h3>Centralized session and dashboard data</h3>
          <p className="muted">
            Session hydration, candidate dashboard, company analytics, and admin workspace all flow through a typed Zustand store.
          </p>
        </div>
        <div className="panel stack">
          <span className="section-label">Migration Path</span>
          <h3>Static frontend can be retired incrementally</h3>
          <p className="muted">
            Existing backend APIs, auth tokens, and storage endpoints are reused so the migration can move page-by-page instead of a hard rewrite.
          </p>
        </div>
      </section>

      <section className="two-col">
        <section className="panel stack">
          <div className="row">
            <div className="stack">
              <span className="section-label">Reviews</span>
              <h2>Store feedback in the backend, not local browser storage.</h2>
            </div>
          </div>
          <Feedback message={message} tone={tone} />
          <form className="form" onSubmit={handleSubmit}>
            <div className="two-col">
              <label className="field">
                <span>Your name</span>
                <input
                  value={form.name}
                  onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                  placeholder="Enter your name"
                  required
                />
              </label>
              <label className="field">
                <span>Role</span>
                <select
                  value={form.role}
                  onChange={(event) => setForm((current) => ({ ...current, role: event.target.value }))}
                >
                  <option value="fresher">Candidate</option>
                  <option value="company">Company</option>
                  <option value="guest">Guest</option>
                </select>
              </label>
            </div>
            <div className="two-col">
              <label className="field">
                <span>Rating</span>
                <select
                  value={form.rating}
                  onChange={(event) => setForm((current) => ({ ...current, rating: event.target.value }))}
                >
                  <option value="5">5 / 5</option>
                  <option value="4">4 / 5</option>
                  <option value="3">3 / 5</option>
                  <option value="2">2 / 5</option>
                  <option value="1">1 / 5</option>
                </select>
              </label>
              <div className="field">
                <span className="helper">Backend-powered social proof</span>
                <div className="message">Reviews are loaded from <code>/api/reviews</code>.</div>
              </div>
            </div>
            <label className="field">
              <span>Review</span>
              <textarea
                value={form.review}
                onChange={(event) => setForm((current) => ({ ...current, review: event.target.value }))}
                placeholder="Share what is working and what should improve."
                required
              />
            </label>
            <button className="btn primary" type="submit">
              Submit review
            </button>
          </form>
        </section>

        <section className="panel stack">
          <span className="section-label">Latest feedback</span>
          <h2>Recent reviews from the platform database</h2>
          {loading ? <div className="empty">Loading reviews...</div> : null}
          {!loading && !reviews.length ? <div className="empty">No reviews available yet.</div> : null}
          <div className="list">
            {reviews.map((review) => (
              <article className="activity-card stack" key={review.id}>
                <div className="row">
                  <strong>{review.name}</strong>
                  <span className="pill">{review.role}</span>
                </div>
                <div className="meta">Rating: {review.rating} / 5</div>
                <p>{review.review}</p>
                <span className="helper">{formatDateTime(review.created_at)}</span>
              </article>
            ))}
          </div>
        </section>
      </section>
    </AppShell>
  );
}
