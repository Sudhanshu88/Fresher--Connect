"use client";

import { FormEvent, Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { Feedback } from "@/components/feedback";
import { JobCard } from "@/components/job-card";
import { StatCard } from "@/components/stat-card";
import { apiRequest } from "@/lib/api";
import { usePlatformStore } from "@/lib/stores/platform-store";
import type { Job, Pagination } from "@/lib/types";

type JobsResponse = {
  ok: boolean;
  jobs: Job[];
  categories: string[];
  filters: {
    categories: string[];
    locations: string[];
    companies: string[];
    experience_levels: string[];
    skills: string[];
    salary_min: number | null;
    salary_max: number | null;
  };
  pagination: Pagination;
};

type JobFilters = {
  search: string;
  category: string;
  location: string;
  skills: string;
  page: number;
};

const defaultFilters: JobFilters = {
  search: "",
  category: "",
  location: "",
  skills: "",
  page: 1
};

function readFilters(searchParams: { get(name: string): string | null }): JobFilters {
  const page = Number(searchParams.get("page") || "1");
  return {
    search: searchParams.get("search") || "",
    category: searchParams.get("category") || "",
    location: searchParams.get("location") || "",
    skills: searchParams.get("skills") || "",
    page: Number.isFinite(page) && page > 0 ? page : 1
  };
}

function buildJobsHref(filters: JobFilters) {
  const params = new URLSearchParams();
  if (filters.search.trim()) {
    params.set("search", filters.search.trim());
  }
  if (filters.category) {
    params.set("category", filters.category);
  }
  if (filters.location) {
    params.set("location", filters.location);
  }
  if (filters.skills.trim()) {
    params.set("skills", filters.skills.trim());
  }
  if (filters.page > 1) {
    params.set("page", String(filters.page));
  }
  return params.toString() ? `/jobs?${params.toString()}` : "/jobs";
}

export default function JobsPage() {
  return (
    <Suspense
      fallback={
        <AppShell>
          <div className="empty-state">Loading verified opportunities...</div>
        </AppShell>
      }
    >
      <JobsPageContent />
    </Suspense>
  );
}

function JobsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchParamKey = searchParams.toString();
  const user = usePlatformStore((state) => state.user);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [locations, setLocations] = useState<string[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [filters, setFilters] = useState(defaultFilters);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [tone, setTone] = useState<"default" | "error" | "success">("default");
  const [submittingJobId, setSubmittingJobId] = useState<number | null>(null);

  useEffect(() => {
    const nextFilters = readFilters(searchParams);
    setFilters(nextFilters);
    void loadJobs(nextFilters);
  }, [searchParamKey]);

  async function loadJobs(nextFilters: JobFilters) {
    setLoading(true);
    setMessage("");

    const params = new URLSearchParams();
    if (nextFilters.search.trim()) {
      params.set("search", nextFilters.search.trim());
    }
    if (nextFilters.category) {
      params.set("category", nextFilters.category);
    }
    if (nextFilters.location) {
      params.set("location", nextFilters.location);
    }
    if (nextFilters.skills.trim()) {
      params.set("skills", nextFilters.skills.trim());
    }
    params.set("page", String(nextFilters.page));
    params.set("page_size", "9");

    try {
      const response = await apiRequest<JobsResponse>(`/api/jobs?${params.toString()}`);
      setJobs(response.jobs);
      setCategories(response.filters.categories || response.categories || []);
      setLocations(response.filters.locations || []);
      setPagination(response.pagination);
      setFilters(nextFilters);
    } catch (_error) {
      setTone("error");
      setMessage("We couldn't load opportunities right now. Please refresh and try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleApply(jobId: number) {
    if (!user) {
      router.push(`/login?next=${encodeURIComponent(`/jobs/${jobId}`)}`);
      return;
    }
    if (user.role !== "fresher") {
      setTone("error");
      setMessage("Applications can only be submitted from a candidate account.");
      return;
    }

    setSubmittingJobId(jobId);
    setMessage("");
    try {
      await apiRequest("/api/applications", {
        method: "POST",
        body: { job_id: jobId }
      });
      setTone("success");
      setMessage("Application submitted successfully. You can track every update from your career dashboard.");
    } catch (_error) {
      setTone("error");
      setMessage("We couldn't submit this application. You may have already applied, or the role is temporarily unavailable.");
    } finally {
      setSubmittingJobId(null);
    }
  }

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    router.push(buildJobsHref({ ...filters, page: 1 }));
  }

  return (
    <AppShell>
      <section className="hero">
        <section className="panel stack">
          <div className="page-intro">
            <span className="section-label">Opportunity Marketplace</span>
            <h1 className="page-title">Find early-career roles built for growth.</h1>
            <p className="muted">
              Explore verified opportunities, compare role expectations, and focus on openings where your profile can stand out.
            </p>
          </div>
          <Feedback message={message} tone={tone} />
          <form className="form" onSubmit={handleSearch}>
            <div className="two-col">
              <label className="field">
                <span>Search Roles</span>
                <input
                  value={filters.search}
                  onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
                  placeholder="Software engineer, analyst, operations..."
                />
              </label>
              <label className="field">
                <span>Career Track</span>
                <select
                  value={filters.category}
                  onChange={(event) => setFilters((current) => ({ ...current, category: event.target.value }))}
                >
                  <option value="">All career tracks</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="two-col">
              <label className="field">
                <span>Preferred Location</span>
                <select
                  value={filters.location}
                  onChange={(event) => setFilters((current) => ({ ...current, location: event.target.value }))}
                >
                  <option value="">All locations</option>
                  {locations.map((location) => (
                    <option key={location} value={location}>
                      {location}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>Core Skills</span>
                <input
                  value={filters.skills}
                  onChange={(event) => setFilters((current) => ({ ...current, skills: event.target.value }))}
                  placeholder="React, SQL, Python"
                />
              </label>
            </div>
            <div className="button-row">
              <button className="btn primary" type="submit">
                Find Opportunities
              </button>
              <button className="btn ghost" type="button" onClick={() => router.push("/jobs")}>
                Clear Search
              </button>
            </div>
          </form>
        </section>

        <section className="hero-card">
          <span className="section-label">Market Snapshot</span>
          <div className="stats-grid compact-grid">
            <StatCard label="Live opportunities" value={pagination?.total ?? 0} hint="Fresh openings from verified employers" />
            <StatCard label="Hiring locations" value={locations.length} hint="On-site, hybrid, and remote options in one search" />
            <StatCard label="Career tracks" value={categories.length} hint="Structured categories to narrow your focus quickly" />
            <StatCard
              label="Profile match"
              value={user?.role === "fresher" ? "Enabled" : "Sign in"}
              hint={user?.role === "fresher" ? "See where your profile aligns with role expectations" : "Sign in as a candidate to unlock alignment previews"}
            />
          </div>
        </section>
      </section>

      {loading ? <div className="empty-state">Loading verified opportunities...</div> : null}
      {!loading && !jobs.length ? <div className="empty-state">No opportunities match your current search. Try broadening the filters.</div> : null}

      <section className="section">
        <div className="section-head">
          <div className="page-intro">
            <span className="section-label">Curated Opportunities</span>
            <h2>Compare the roles most worth your attention.</h2>
            <p className="muted">
              Review employer context, required skills, and hiring stages before you commit to an application.
            </p>
          </div>
        </div>

        <div className="jobs-grid">
          {jobs.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              action={
                <button
                  className="btn primary"
                  type="button"
                  disabled={submittingJobId === job.id}
                  onClick={() => void handleApply(job.id)}
                >
                  {submittingJobId === job.id ? "Submitting..." : "Apply Now"}
                </button>
              }
            />
          ))}
        </div>
      </section>

      {pagination ? (
        <section className="panel stack">
          <div className="row">
            <div className="meta">
              Page {pagination.page} of {pagination.total_pages} with {pagination.total} live opportunities available
            </div>
            <div className="button-row">
              <button
                className="btn ghost"
                type="button"
                disabled={!pagination.has_prev}
                onClick={() => router.push(buildJobsHref({ ...filters, page: Math.max(1, pagination.page - 1) }))}
              >
                Previous Page
              </button>
              <button
                className="btn ghost"
                type="button"
                disabled={!pagination.has_next}
                onClick={() => router.push(buildJobsHref({ ...filters, page: pagination.page + 1 }))}
              >
                Next Page
              </button>
            </div>
          </div>
        </section>
      ) : null}
    </AppShell>
  );
}
