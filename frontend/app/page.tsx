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
  role: "fresher",
  rating: "5",
  review: ""
};

const reviewProfiles: Record<
  string,
  {
    name: string;
    role: string;
    company: string;
    review: string;
  }
> = {
  Aarav: {
    name: "Aarav Mehta",
    role: "Graduate Product Analyst",
    company: "BrightStack Labs",
    review:
      "Fresher Connect made my first job search feel structured and credible. I could spot verified employers quickly, present my profile professionally, and track every update without second-guessing the process."
  },
  Nisha: {
    name: "Nisha Kapoor",
    role: "Talent Acquisition Lead",
    company: "GrowthDock",
    review:
      "Our team moved faster because candidate profiles arrived clearer, communication stayed centralized, and every hiring decision had the context we needed. It felt far more efficient than juggling disconnected tools."
  }
};

function reviewRoleLabel(role: string) {
  if (role === "company") {
    return "Recruiter";
  }
  if (role === "fresher") {
    return "Candidate";
  }
  return "Career Mentor";
}

function presentReview(review: Review) {
  const override = reviewProfiles[review.name];
  if (override) {
    return override;
  }

  return {
    name: review.name,
    role: reviewRoleLabel(review.role),
    company: "Fresher Connect Community",
    review: review.review
  };
}

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
          setMessage("Community stories are temporarily unavailable. Please check back shortly.");
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
      setMessage("Thank you for sharing your experience with Fresher Connect.");
    } catch (_error) {
      setTone("error");
      setMessage("We couldn't publish your feedback just yet. Please try again in a moment.");
    }
  }

  return (
    <AppShell contentClassName="landing-shell">
      <section className="hero hero-expanded">
        <div className="hero-copy">
          <span className="section-label">Career Acceleration Platform</span>
          <h1>Launch Careers Faster. Hire Graduates Smarter.</h1>
          <p>
            Fresher Connect helps ambitious graduates stand out with recruiter-ready profiles and gives hiring teams access to a trusted pipeline of early-career talent.
            From discovery to decision, every step stays clear, professional, and conversion-focused.
          </p>

          <div className="button-row">
            <Link className="btn primary" href="/register">
              Launch Your Career Today
            </Link>
            <Link className="btn ghost" href="/register?role=company">
              Find Top Talent Now
            </Link>
          </div>

          <p className="helper-text">
            Verified employers, recruiter-ready profiles, and disciplined hiring workflows in one trusted platform.
          </p>

          <div className="trust-row">
            <span className="trust-pill">Verified employer network</span>
            <span className="trust-pill">ATS-ready candidate storytelling</span>
            <span className="trust-pill">Structured hiring decisions</span>
          </div>
        </div>

        <section className="hero-card">
          <span className="section-label">Platform Impact</span>
          <h2>Built to turn first jobs and first hires into confident decisions.</h2>
          <p className="muted">
            Fresher Connect combines trustworthy employer access, stronger candidate presentation, and a disciplined hiring rhythm that keeps everyone aligned.
          </p>
          <div className="metric-grid">
            <div className="metric">
              <strong>10,000+</strong>
              <span>graduates supported through early-career moves</span>
            </div>
            <div className="metric">
              <strong>500+</strong>
              <span>partner companies hiring with confidence</span>
            </div>
            <div className="metric">
              <strong>95%</strong>
              <span>satisfaction across candidate and recruiter journeys</span>
            </div>
          </div>
        </section>
      </section>

      <section className="section">
        <div className="section-head">
          <div className="page-intro">
            <span className="section-label">Our Mission</span>
            <h2>We help early-career talent get discovered with confidence.</h2>
            <p className="muted">
              Fresher Connect exists to remove uncertainty from graduate hiring. We combine verified opportunities, guided candidate storytelling, and disciplined recruiter workflows so the right people connect faster and with greater trust.
            </p>
          </div>
        </div>

        <div className="preview-grid">
          <article className="preview-card">
            <span className="preview-kicker">10,000+ Freshers Placed</span>
            <h3>Stand out to the right employers sooner</h3>
            <p>Showcase your strengths with a profile built to inspire confidence from the very first review.</p>
          </article>
          <article className="preview-card">
            <span className="preview-kicker">500+ Partner Companies</span>
            <h3>Hire ready-to-grow talent with less friction</h3>
            <p>Recruiters get a cleaner pipeline, clearer signals, and faster movement from screening to decision.</p>
          </article>
          <article className="preview-card">
            <span className="preview-kicker">95% Satisfaction Rate</span>
            <h3>Keep every hiring conversation aligned</h3>
            <p>Structured updates reduce uncertainty for candidates and give hiring teams a more reliable process.</p>
          </article>
          <article className="preview-card">
            <span className="preview-kicker">Trusted Platform Design</span>
            <h3>Create confidence on both sides of the table</h3>
            <p>Professional language, verified access, and transparent stages make every interaction feel credible.</p>
          </article>
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <div className="page-intro">
            <span className="section-label">How It Works</span>
            <h2>Every step is designed to create hiring momentum.</h2>
          </div>
        </div>

        <div className="workflow-grid">
          <article className="workflow-step">
            <span className="workflow-number">01</span>
            <h3>Build a standout profile</h3>
            <p>Create a polished candidate presence that showcases your education, skills, resume, and career goals professionally.</p>
          </article>
          <article className="workflow-step">
            <span className="workflow-number">02</span>
            <h3>Reach verified opportunities</h3>
            <p>Discover employer-vetted roles with the context you need to evaluate fit before you apply.</p>
          </article>
          <article className="workflow-step">
            <span className="workflow-number">03</span>
            <h3>Track every hiring update</h3>
            <p>Stay informed from application submission to final decision with a structured, easy-to-follow timeline.</p>
          </article>
          <article className="workflow-step">
            <span className="workflow-number">04</span>
            <h3>Move decisions forward with clarity</h3>
            <p>Recruiters manage pipelines, coordinate feedback, and keep hiring decisions timely and transparent.</p>
          </article>
        </div>
      </section>

      <section className="section" id="reviewSection">
        <div className="section-head">
          <div className="page-intro">
            <span className="section-label">Success Stories</span>
            <h2>Trusted by graduates, recruiters, and career mentors.</h2>
            <p className="muted">
              Every success story helps future candidates and hiring teams understand what a stronger, more transparent hiring journey can feel like.
            </p>
          </div>
        </div>

        <div className="split-grid review-section-grid">
          <section className="form-section-card review-form-card">
            <div className="form-section-head">
              <span className="preview-kicker">Share Your Perspective</span>
              <h3>Tell us how Fresher Connect helped you move forward.</h3>
              <p>Your feedback helps us refine the experience for both ambitious graduates and busy hiring teams.</p>
            </div>

            <Feedback message={message} tone={tone} />
            <form className="form-grid two-col" onSubmit={handleSubmit}>
              <label className="field">
                <span>Full Name</span>
                <input
                  value={form.name}
                  onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                  placeholder="Your full name"
                  required
                />
              </label>

              <label className="field">
                <span>How do you use Fresher Connect?</span>
                <select
                  value={form.role}
                  onChange={(event) => setForm((current) => ({ ...current, role: event.target.value }))}
                >
                  <option value="fresher">Candidate</option>
                  <option value="company">Recruiter</option>
                  <option value="guest">Career Mentor</option>
                </select>
              </label>

              <label className="field">
                <span>Overall Experience</span>
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
                <span>What stood out to you?</span>
                <textarea
                  value={form.review}
                  onChange={(event) => setForm((current) => ({ ...current, review: event.target.value }))}
                  placeholder="Describe the clarity, speed, or confidence Fresher Connect added to your experience."
                  rows={5}
                  required
                />
              </label>

              <button className="btn primary" type="submit">
                Share Your Experience
              </button>
            </form>
          </section>

          <section className="card review-list-shell">
            <div className="form-section-head">
              <span className="preview-kicker">Community Voices</span>
              <h3>What professionals are saying about Fresher Connect</h3>
              <p>Real experiences from candidates, recruiters, and mentors using the platform to move careers and hiring outcomes forward.</p>
            </div>
            {loading ? <div className="empty-state">Loading community stories...</div> : null}
            {!loading && !reviews.length ? <div className="empty-state">No community stories are available yet.</div> : null}
            <div className="review-list">
              {reviews.map((review) => (
                <article className="activity-card" key={review.id}>
                  {(() => {
                    const displayReview = presentReview(review);
                    return (
                      <>
                        <div className="row">
                          <strong>{displayReview.name}</strong>
                          <span className="tag">{reviewRoleLabel(review.role)}</span>
                        </div>
                        <div className="meta">
                          {displayReview.role} | {displayReview.company}
                        </div>
                        <p>Rated {review.rating} / 5 for overall experience.</p>
                        <p>{displayReview.review}</p>
                        <span className="helper">{formatDateTime(review.created_at)}</span>
                      </>
                    );
                  })()}
                </article>
              ))}
            </div>
          </section>
        </div>
      </section>
    </AppShell>
  );
}
