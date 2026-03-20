"use client";

const TOKEN_KEY = "fc_next_auth_token";
const API_BASE_KEY = "fc_next_api_base";

export class ApiError extends Error {
  status: number;
  payload: unknown;

  constructor(message: string, status: number, payload: unknown) {
    super(message);
    this.status = status;
    this.payload = payload;
  }
}

type ApiRequestInit = Omit<RequestInit, "body"> & {
  body?: BodyInit | Record<string, unknown> | null;
};

function isBrowser() {
  return typeof window !== "undefined";
}

export function resolveApiBase() {
  if (!isBrowser()) {
    return process.env.NEXT_PUBLIC_API_BASE || "https://fresher-connect-2.onrender.com";
  }

  const params = new URLSearchParams(window.location.search);
  const queryBase = params.get("api")?.trim();
  if (queryBase) {
    window.sessionStorage.setItem(API_BASE_KEY, queryBase.replace(/\/+$/, ""));
    return queryBase.replace(/\/+$/, "");
  }

  const stored = window.sessionStorage.getItem(API_BASE_KEY)?.trim();
  if (stored) {
    return stored.replace(/\/+$/, "");
  }

  return (process.env.NEXT_PUBLIC_API_BASE || "https://fresher-connect-2.onrender.com").replace(/\/+$/, "");
}

export function readAccessToken() {
  if (!isBrowser()) {
    return "";
  }
  return window.sessionStorage.getItem(TOKEN_KEY) || "";
}

export function writeAccessToken(token: string) {
  if (!isBrowser()) {
    return;
  }
  if (token) {
    window.sessionStorage.setItem(TOKEN_KEY, token);
  } else {
    window.sessionStorage.removeItem(TOKEN_KEY);
  }
}

async function parseResponse(response: Response) {
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return response.json();
  }
  return response.text();
}

export async function apiRequest<T>(path: string, init?: ApiRequestInit) {
  const headers = new Headers(init?.headers || {});
  const token = readAccessToken();
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  let body = init?.body;
  if (body && !(body instanceof FormData) && typeof body === "object" && !(body instanceof URLSearchParams)) {
    headers.set("Content-Type", "application/json");
    body = JSON.stringify(body);
  }

  const response = await fetch(`${resolveApiBase()}${path}`, {
    ...init,
    headers,
    body: body as BodyInit | null | undefined,
    cache: "no-store"
  });

  const payload = await parseResponse(response);
  if (!response.ok) {
    const message =
      typeof payload === "object" && payload !== null && "error" in payload
        ? String((payload as { error?: string }).error || "Request failed")
        : "Request failed";
    throw new ApiError(message, response.status, payload);
  }

  return payload as T;
}
