"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { Feedback } from "@/components/feedback";
import { JobCard } from "@/components/job-card";
import { StatCard } from "@/components/stat-card";
import { apiRequest } from "@/lib/api";
import { formatPercent } from "@/lib/format";
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

const defaultFilters = {
  search: "",
  category: "",
  location: "",
  skills: "",
  page: 1
};

export default function JobsPage() {
  const router = useRouter();
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
    void loadJobs(defaultFilters);
  }, []);

  async function loadJobs(nextFilters: typeof defaultFilters) {
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
      setMessage("Jobs could not be loaded from the backend.");
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
      setMessage("Only fresher accounts can apply to jobs.");
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
      setMessage("Application submitted. Track it from the candidate dashboard.");
    } catch (_error) {
      setTone("error");
      setMessage("Application failed. It may already exist or the backend may be unavailable.");
    } finally {
      setSubmittingJobId(null);
    }
  }

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void loadJobs({ ...filters, page: 1 });
  }

  return (
    <AppShell title="Job discovery moved into a typed, filterable React workspace." subtitle="Search, review details, and apply without leaving the product flow">
      <section className="hero">
        <section className="panel stack">
          <span className="section-label">Search and filters</span>
          <h2>Browse fresher-friendly roles with backend-powered filtering.</h2>
          <Feedback message={message} tone={tone} />
          <form className="form" onSubmit={handleSearch}>
            <div className="two-col">
              <label className="field">
                <span>Search</span>
                <input
                  value={filters.search}
                  onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
                  placeholder="Frontend, analyst, support..."
                />
              </label>
              <label className="field">
                <span>Category</span>
                <select
                  value={filters.category}
                  onChange={(event) => setFilters((current) => ({ ...current, category: event.target.value }))}
                >
                  <option value="">All categories</option>
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
                <span>Location</span>
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
                <span>Skills</span>
                <input
                  value={filters.skills}
                  onChange={(event) => setFilters((current) => ({ ...current, skills: event.target.value }))}
                  placeholder="React, SQL, Python"
                />
              </label>
            </div>
            <button className="btn primary" type="submit">
              Search jobs
            </button>
          </form>
        </section>

        <section className="hero-card stack">
          <span className="section-label">Overview</span>
          <div className="stats-grid compact-grid">
            <StatCard label="Available roles" value={pagination?.total ?? 0} hint="Live count from /api/jobs" />
            <StatCard label="Categories" value={categories.length} hint="Filterable backend categories" />
            <StatCard label="Workflow" value="Listing + details" hint="Typed route split across /jobs and /jobs/[id]" />
            <StatCard
              label="Match support"
              value={user?.role === "fresher" ? "Enabled" : "Guest"}
              hint={user?.role === "fresher" ? "Candidate match score is returned by backend job APIs" : "Sign in as fresher to see score"}
            />
          </div>
        </section>
      </section>

      {loading ? <div className="empty">Loading jobs...</div> : null}
      {!loading && !jobs.length ? <div className="empty">No jobs matched the current filters.</div> : null}

      <section className="card-grid">
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
                {submittingJobId === job.id ? "Applying..." : "Apply"}
              </button>
            }
          />
        ))}
      </section>

      {pagination ? (
        <section className="panel stack">
          <div className="row">
            <div className="meta">
              Page {pagination.page} of {pagination.total_pages} with {pagination.total} roles listed
            </div>
            <div className="button-row">
              <button
                className="btn secondary"
                type="button"
                disabled={!pagination.has_prev}
                onClick={() => void loadJobs({ ...filters, page: Math.max(1, pagination.page - 1) })}
              >
                Previous
              </button>
              <button
                className="btn secondary"
                type="button"
                disabled={!pagination.has_next}
                onClick={() => void loadJobs({ ...filters, page: pagination.page + 1 })}
              >
                Next
              </button>
            </div>
          </div>
          <div className="meta">
            Candidate match scores appear as percentages on the backend for fresher sessions; current first-card score preview is{" "}
            {jobs[0]?.match_score ? formatPercent(jobs[0].match_score) : "not available"}.
          </div>
        </section>
      ) : null}
    </AppShell>
  );
}
