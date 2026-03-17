import type { UserRole } from "@/lib/types";

export function dashboardPath(role?: UserRole | string | null) {
  if (role === "admin") {
    return "/admin";
  }
  if (role === "company") {
    return "/company";
  }
  return "/user";
}

export function applicationPath(applicationId: number | string) {
  return `/applications/${encodeURIComponent(String(applicationId))}`;
}

export function jobPath(jobId: number | string) {
  return `/jobs/${encodeURIComponent(String(jobId))}`;
}
