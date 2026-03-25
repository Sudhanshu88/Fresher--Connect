"use client";

const TOKEN_KEY = "fc_next_auth_token";
const API_BASE_KEY = "fc_next_api_base";
const FALLBACK_API_BASE = "http://13.201.31.227:5000";

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

function normalizeApiBase(value: string | null | undefined) {
  return String(value || "").trim().replace(/\/+$/, "");
}

function readConfiguredApiBase() {
  return normalizeApiBase(process.env.NEXT_PUBLIC_API_BASE);
}

function browserDefaultApiBase() {
  return normalizeApiBase(window.location.origin);
}

function coerceBrowserApiBase(value: string) {
  if (!value) {
    return browserDefaultApiBase();
  }

  if (window.location.protocol === "https:" && /^http:\/\//i.test(value)) {
    return browserDefaultApiBase();
  }

  return value;
}

export function resolveApiBase() {
  const configuredBase = readConfiguredApiBase();

  if (!isBrowser()) {
    return configuredBase || FALLBACK_API_BASE;
  }

  const params = new URLSearchParams(window.location.search);
  const queryBase = normalizeApiBase(params.get("api"));
  if (queryBase) {
    const nextBase = coerceBrowserApiBase(queryBase);
    window.sessionStorage.setItem(API_BASE_KEY, nextBase);
    return nextBase;
  }

  const stored = normalizeApiBase(window.sessionStorage.getItem(API_BASE_KEY));
  if (stored) {
    return coerceBrowserApiBase(stored);
  }

  if (configuredBase) {
    return coerceBrowserApiBase(configuredBase);
  }

  return browserDefaultApiBase();
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
