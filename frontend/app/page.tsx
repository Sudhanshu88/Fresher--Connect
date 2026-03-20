"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";

import { AppShell } from "@/components/app-shell";
import { Feedback } from "@/components/feedback";
import { apiRequest } from "@/lib/api";
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
          setMessage("Platform feedback could not be loaded right now.");
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
      setMessage("Feedback shared successfully.");
    } catch (_error) {
      setTone("error");
      setMessage("Feedback submit failed. Check the backend connection and try again.");
    }
  }

  return (
    <AppShell contentClassName="landing-shell">
      <section className="hero hero-expanded">
        <div className="hero-copy">
          <span className="section-label">Professional Hiring Platform</span>
          <h1>Connect ambitious candidates with trusted employers through one professional hiring experience.</h1>
          <p>
            Fresher Connect unifies opportunity discovery, verified employer access, application tracking,
            and recruiter operations into a single platform designed for credibility, clarity, and scale.
          </p>

          <div className="button-row">
            <Link className="btn primary" href="/jobs">
              Explore opportunities
            </Link>
            <Link className="btn ghost" href="/register">
              Create an account
            </Link>
          </div>

          <p className="helper-text">
            Built for credible hiring, transparent decisions, and role-based workflows.
          </p>

          <div className="trust-row">
            <span className="trust-pill">Verified employer onboarding</span>
            <span className="trust-pill">Candidate application tracking</span>
            <span className="trust-pill">Admin-led governance and moderation</span>
          </div>
        </div>

        <section className="hero-card">
          <span className="section-label">Platform Highlights</span>
          <h2>Every key workflow lives inside one connected hiring ecosystem.</h2>
          <p className="muted">
            From discovery to decision, every touchpoint stays aligned so candidates, recruiters, and admins move faster with less ambiguity.
          </p>
          <div className="metric-grid">
            <div className="metric">
              <strong>8</strong>
              <span>Core experience surfaces</span>
            </div>
            <div className="metric">
              <strong>3</strong>
              <span>Role-based workspaces</span>
            </div>
            <div className="metric">
              <strong>{reviews.length || 6}</strong>
              <span>Recent community feedback entries</span>
            </div>
          </div>
        </section>
      </section>

      <section className="section">
        <div className="section-head">
          <div className="page-intro">
            <span className="section-label">Platform Overview</span>
            <h2>Every workspace is aligned for trust, speed, and decision-making.</h2>
            <p className="muted">
              Clear hierarchy and consistent language help both candidates and employers move through the platform with confidence.
            </p>
          </div>
        </div>

        <div className="preview-grid">
          <article className="preview-card">
            <span className="preview-kicker">Landing</span>
            <h3>Clear market positioning</h3>
            <p>Candidates and employers immediately understand the platform value, workflow, and next action.</p>
          </article>
          <article className="preview-card">
            <span className="preview-kicker">Access</span>
            <h3>Role-based account entry</h3>
            <p>Separate sign-in and onboarding flows keep candidate, recruiter, and admin access clear.</p>
          </article>
          <article className="preview-card">
            <span className="preview-kicker">Opportunities</span>
            <h3>Structured opportunity discovery</h3>
            <p>Search, filter, and compare role requirements before taking action on any listing.</p>
          </article>
          <article className="preview-card">
            <span className="preview-kicker">Application Progress</span>
            <h3>Transparent hiring updates</h3>
            <p>Candidates can see the active stage, timeline, and decision context from a dedicated status view.</p>
          </article>
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <div className="page-intro">
            <span className="section-label">Workflow Overview</span>
            <h2>One professional journey for candidates. One structured workflow for recruiters.</h2>
          </div>
        </div>

        <div className="workflow-grid">
          <article className="workflow-step">
            <span className="workflow-number">01</span>
            <h3>Explore opportunities</h3>
            <p>Candidates search verified opportunities and move into detailed role views with clear qualification criteria.</p>
          </article>
          <article className="workflow-step">
            <span className="workflow-number">02</span>
            <h3>Review role expectations</h3>
            <p>Each listing surfaces employer context, responsibilities, compensation, and the expected hiring path.</p>
          </article>
          <article className="workflow-step">
            <span className="workflow-number">03</span>
            <h3>Submit and monitor</h3>
            <p>Applications flow into a dedicated tracking view so candidates always understand their current status.</p>
          </article>
          <article className="workflow-step">
            <span className="workflow-number">04</span>
            <h3>Recruiters manage decisions</h3>
            <p>Employers create listings, review talent, and update hiring decisions from a structured recruiter workspace.</p>
          </article>
        </div>
      </section>

      <section className="section" id="reviewSection">
        <div className="section-head">
          <div className="page-intro">
            <span className="section-label">Platform Feedback</span>
            <h2>Share your experience with Fresher Connect.</h2>
            <p className="muted">
              Add concise feedback on job discovery, recruiter workflows, or the overall application experience.
            </p>
          </div>
        </div>

        <div className="split-grid review-section-grid">
          <section className="form-section-card review-form-card">
            <div className="form-section-head">
              <span className="preview-kicker">Submit Feedback</span>
              <h3>Tell us what is working well and where the experience can improve.</h3>
              <p>Feedback submitted here is saved to the platform and reflected immediately below.</p>
            </div>

            <Feedback message={message} tone={tone} />
            <form className="form-grid two-col" onSubmit={handleSubmit}>
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
                <span>I am a</span>
                <select
                  value={form.role}
                  onChange={(event) => setForm((current) => ({ ...current, role: event.target.value }))}
                >
                  <option value="fresher">Candidate</option>
                  <option value="company">Recruiter</option>
                  <option value="guest">Guest</option>
                </select>
              </label>

              <label className="field">
                <span>Rating</span>
                <select
                  value={form.rating}
                  onChange={(event) => setForm((current) => ({ ...current, rating: event.target.value }))}
                >
                  <option value="5">5 stars</option>
                  <option value="4">4 stars</option>
                  <option value="3">3 stars</option>
                  <option value="2">2 stars</option>
                  <option value="1">1 star</option>
                </select>
              </label>

              <label className="field full-span">
                <span>Your feedback</span>
                <textarea
                  value={form.review}
                  onChange={(event) => setForm((current) => ({ ...current, review: event.target.value }))}
                  placeholder="Share your experience with Fresher Connect"
                  rows={5}
                  required
                />
              </label>

              <button className="btn primary" type="submit">
                Submit feedback
              </button>
            </form>
          </section>

          <section className="card review-list-shell">
            <div className="form-section-head">
              <span className="preview-kicker">Recent Feedback</span>
              <h3>Latest feedback from the platform community</h3>
              <p>Candidates, recruiters, and guests can all share concise feedback here.</p>
            </div>
            {loading ? <div className="empty-state">Loading feedback...</div> : null}
            {!loading && !reviews.length ? <div className="empty-state">No feedback available yet.</div> : null}
            <div className="review-list">
              {reviews.map((review) => (
                <article className="activity-card" key={review.id}>
                  <div className="row">
                    <strong>{review.name}</strong>
                    <span className="status-pill applied">{review.role}</span>
                  </div>
                  <p>Rating: {review.rating} / 5</p>
                  <p>{review.review}</p>
                  <span className="helper">{formatDateTime(review.created_at)}</span>
                </article>
              ))}
            </div>
          </section>
        </div>
      </section>
    </AppShell>
  );
}
