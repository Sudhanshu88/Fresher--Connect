"use client";

import { createAsyncThunk } from "@reduxjs/toolkit";

import { apiRequest, writeAccessToken } from "@/lib/api";
import type {
  AdminDashboard,
  Application,
  CompanyDashboard,
  Job,
  JobsDirectoryFilters,
  JobsDirectoryResponse,
  NotificationsResponse,
  SavedJobsResponse,
  SessionUser,
  UserDashboard
} from "@/lib/types";

type SessionResponse = {
  ok: boolean;
  user: SessionUser | null;
  access_token?: string;
};

export type AuthPayload = {
  email: string;
  password: string;
};

function requireSessionUser(user: SessionUser | null): SessionUser {
  if (!user) {
    throw new Error("Authenticated user missing from session response.");
  }
  return user;
}

export const hydrateSession = createAsyncThunk<SessionUser | null>(
  "session/hydrateSession",
  async () => {
    try {
      const session = await apiRequest<SessionResponse>("/api/session");
      return session.user;
    } catch (_error) {
      return null;
    }
  }
);

export const loginUser = createAsyncThunk<SessionUser, AuthPayload>(
  "session/loginUser",
  async (payload) => {
    const response = await apiRequest<SessionResponse & { access_token: string }>("/auth/login", {
      method: "POST",
      body: payload
    });
    writeAccessToken(response.access_token);
    return requireSessionUser(response.user);
  }
);

export const loginAdminUser = createAsyncThunk<SessionUser, AuthPayload>(
  "session/loginAdminUser",
  async (payload) => {
    const response = await apiRequest<SessionResponse & { access_token: string }>("/auth/admin/login", {
      method: "POST",
      body: payload
    });
    writeAccessToken(response.access_token);
    return requireSessionUser(response.user);
  }
);

export const logoutUser = createAsyncThunk("session/logoutUser", async () => {
  try {
    await apiRequest("/api/auth/logout", { method: "POST" });
  } catch (_error) {
    // The local session should still be cleared if the backend logout request fails.
  } finally {
    writeAccessToken("");
  }
});

export const loadUserDashboard = createAsyncThunk<UserDashboard>(
  "workspaces/loadUserDashboard",
  async () => apiRequest<UserDashboard>("/api/user/dashboard")
);

export const loadCompanyDashboard = createAsyncThunk<CompanyDashboard>(
  "workspaces/loadCompanyDashboard",
  async () => apiRequest<CompanyDashboard>("/api/company/dashboard")
);

export const loadAdminDashboard = createAsyncThunk<AdminDashboard>(
  "workspaces/loadAdminDashboard",
  async () => apiRequest<AdminDashboard>("/api/admin/dashboard")
);

export const loadSavedJobs = createAsyncThunk<SavedJobsResponse>(
  "jobs/loadSavedJobs",
  async () => apiRequest<SavedJobsResponse>("/api/saved-jobs")
);

export type MarkNotificationReadPayload = {
  notificationId: number;
};

export const markNotificationRead = createAsyncThunk<NotificationsResponse, MarkNotificationReadPayload>(
  "notifications/markNotificationRead",
  async ({ notificationId }) =>
    apiRequest<NotificationsResponse>(`/api/notifications/${notificationId}/read`, {
      method: "PATCH"
    })
);

export type ApplyToJobPayload = {
  job: Job;
  optimisticId: number;
};

export const applyToJob = createAsyncThunk<{ application: Application; optimisticId: number }, ApplyToJobPayload>(
  "applications/applyToJob",
  async ({ job, optimisticId }) => {
    const response = await apiRequest<{ ok: boolean; application: Application }>("/api/applications", {
      method: "POST",
      body: { job_id: job.id }
    });
    return { application: response.application, optimisticId };
  }
);

export type SaveJobPayload = {
  job: Job;
};

export const saveJob = createAsyncThunk<{ job: Job }, SaveJobPayload>(
  "jobs/saveJob",
  async ({ job }) => {
    await apiRequest("/api/saved-jobs", {
      method: "POST",
      body: { job_id: job.id }
    });
    return { job };
  }
);

export const unsaveJob = createAsyncThunk<{ jobId: number }, SaveJobPayload>(
  "jobs/unsaveJob",
  async ({ job }) => {
    await apiRequest(`/api/saved-jobs/${job.id}`, {
      method: "DELETE"
    });
    return { jobId: job.id };
  }
);

export type UpdateCompanyApplicationPayload = {
  application: Application;
  status: string;
  interview_at: string;
  decision_reason: string;
};

export const updateCompanyApplication = createAsyncThunk<
  { application: Application },
  UpdateCompanyApplicationPayload
>(
  "applications/updateCompanyApplication",
  async ({ application, status, interview_at, decision_reason }) => {
    const response = await apiRequest<{ ok: boolean; application: Application }>(
      `/api/company/applications/${application.id}`,
      {
        method: "PATCH",
        body: {
          status,
          interview_at: interview_at ? new Date(interview_at).toISOString() : "",
          decision_reason
        }
      }
    );
    return { application: response.application };
  }
);

function buildJobsDirectoryQuery(filters: JobsDirectoryFilters) {
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
  params.set("page", String(filters.page));
  params.set("page_size", String(filters.page_size || 9));
  return params.toString();
}

export const jobsDirectoryKey = (filters: JobsDirectoryFilters) => buildJobsDirectoryQuery(filters);

export const loadJobsDirectory = createAsyncThunk<
  { key: string; filters: JobsDirectoryFilters; response: JobsDirectoryResponse },
  JobsDirectoryFilters
>("jobDirectory/loadJobsDirectory", async (filters) => {
  const query = buildJobsDirectoryQuery(filters);
  const response = await apiRequest<JobsDirectoryResponse>(`/api/jobs?${query}`);
  return { key: query, filters, response };
});

export const loadJobDetail = createAsyncThunk<Job, { jobId: number | string }>(
  "jobDirectory/loadJobDetail",
  async ({ jobId }) => {
    const response = await apiRequest<{ ok: boolean; job: Job }>(`/api/jobs/${jobId}`);
    return response.job;
  }
);
