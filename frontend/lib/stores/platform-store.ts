"use client";

import { create } from "zustand";

import { apiRequest, writeAccessToken } from "@/lib/api";
import type { AdminDashboard, CompanyDashboard, SessionUser, UserDashboard } from "@/lib/types";

type PlatformStore = {
  user: SessionUser | null;
  userDashboard: UserDashboard | null;
  companyDashboard: CompanyDashboard | null;
  adminDashboard: AdminDashboard | null;
  bootstrapped: boolean;
  hydrateSession: () => Promise<void>;
  login: (payload: { email: string; password: string }) => Promise<SessionUser>;
  loginAdmin: (payload: { email: string; password: string }) => Promise<SessionUser>;
  logout: () => Promise<void>;
  loadUserDashboard: () => Promise<UserDashboard>;
  loadCompanyDashboard: () => Promise<CompanyDashboard>;
  loadAdminDashboard: () => Promise<AdminDashboard>;
  setUser: (user: SessionUser | null) => void;
};

type SessionResponse = {
  ok: boolean;
  user: SessionUser | null;
  access_token?: string;
};

export const usePlatformStore = create<PlatformStore>((set, get) => ({
  user: null,
  userDashboard: null,
  companyDashboard: null,
  adminDashboard: null,
  bootstrapped: false,
  async hydrateSession() {
    if (get().bootstrapped) {
      return;
    }
    try {
      const session = await apiRequest<SessionResponse>("/api/session");
      set({ user: session.user, bootstrapped: true });
    } catch (_error) {
      set({ user: null, bootstrapped: true });
    }
  },
  async login(payload) {
    const response = await apiRequest<SessionResponse & { access_token: string }>("/auth/login", {
      method: "POST",
      body: payload
    });
    writeAccessToken(response.access_token);
    set({ user: response.user, bootstrapped: true });
    return response.user as SessionUser;
  },
  async loginAdmin(payload) {
    const response = await apiRequest<SessionResponse & { access_token: string }>("/auth/admin/login", {
      method: "POST",
      body: payload
    });
    writeAccessToken(response.access_token);
    set({ user: response.user, bootstrapped: true });
    return response.user as SessionUser;
  },
  async logout() {
    try {
      await apiRequest("/api/auth/logout", { method: "POST" });
    } finally {
      writeAccessToken("");
      set({
        user: null,
        userDashboard: null,
        companyDashboard: null,
        adminDashboard: null,
        bootstrapped: true
      });
    }
  },
  async loadUserDashboard() {
    const dashboard = await apiRequest<UserDashboard>("/api/user/dashboard");
    set({ userDashboard: dashboard, user: dashboard.user });
    return dashboard;
  },
  async loadCompanyDashboard() {
    const dashboard = await apiRequest<CompanyDashboard>("/api/company/dashboard");
    set({ companyDashboard: dashboard, user: dashboard.user });
    return dashboard;
  },
  async loadAdminDashboard() {
    const dashboard = await apiRequest<AdminDashboard>("/api/admin/dashboard");
    set({ adminDashboard: dashboard, user: dashboard.user });
    return dashboard;
  },
  setUser(user) {
    set({ user });
  }
}));
