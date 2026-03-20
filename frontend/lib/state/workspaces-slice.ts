"use client";

import { createSlice } from "@reduxjs/toolkit";

import {
  loadAdminDashboard,
  loadCompanyDashboard,
  loadUserDashboard,
  updateCompanyApplication,
  loginAdminUser,
  loginUser,
  logoutUser
} from "@/lib/state/platform-actions";
import { setUser } from "@/lib/state/session-slice";
import type { AdminDashboard, CompanyDashboard, UserDashboard } from "@/lib/types";

export type UserDashboardMeta = Omit<
  UserDashboard,
  "jobs" | "saved_jobs" | "applications" | "notifications" | "notification_unread_count"
>;

export type CompanyDashboardMeta = Omit<CompanyDashboard, "posted_jobs" | "applications">;

export type AdminDashboardMeta = Omit<AdminDashboard, "jobs">;

export type WorkspacesState = {
  userDashboardMeta: UserDashboardMeta | null;
  companyDashboardMeta: CompanyDashboardMeta | null;
  adminDashboardMeta: AdminDashboardMeta | null;
};

const initialState: WorkspacesState = {
  userDashboardMeta: null,
  companyDashboardMeta: null,
  adminDashboardMeta: null
};

function clearWorkspaces(state: WorkspacesState) {
  state.userDashboardMeta = null;
  state.companyDashboardMeta = null;
  state.adminDashboardMeta = null;
}

const workspacesSlice = createSlice({
  name: "workspaces",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(loadUserDashboard.fulfilled, (state, action) => {
        const { jobs, saved_jobs, applications, notifications, notification_unread_count, ...meta } = action.payload;
        void jobs;
        void saved_jobs;
        void applications;
        void notifications;
        void notification_unread_count;
        state.userDashboardMeta = meta;
        state.companyDashboardMeta = null;
        state.adminDashboardMeta = null;
      })
      .addCase(loadCompanyDashboard.fulfilled, (state, action) => {
        const { posted_jobs, applications, ...meta } = action.payload;
        void posted_jobs;
        void applications;
        state.companyDashboardMeta = meta;
        state.userDashboardMeta = null;
        state.adminDashboardMeta = null;
      })
      .addCase(loadAdminDashboard.fulfilled, (state, action) => {
        const { jobs, ...meta } = action.payload;
        void jobs;
        state.adminDashboardMeta = meta;
        state.userDashboardMeta = null;
        state.companyDashboardMeta = null;
      })
      .addCase(updateCompanyApplication.pending, (state, action) => {
        if (!state.companyDashboardMeta) {
          return;
        }
        const previousStatus = action.meta.arg.application.status;
        const nextStatus = action.meta.arg.status;
        if (previousStatus === nextStatus) {
          return;
        }
        state.companyDashboardMeta.status_counts = {
          ...state.companyDashboardMeta.status_counts,
          [previousStatus]: Math.max(0, (state.companyDashboardMeta.status_counts[previousStatus] || 0) - 1),
          [nextStatus]: (state.companyDashboardMeta.status_counts[nextStatus] || 0) + 1
        };
      })
      .addCase(updateCompanyApplication.rejected, (state, action) => {
        if (!state.companyDashboardMeta) {
          return;
        }
        const previousStatus = action.meta.arg.application.status;
        const nextStatus = action.meta.arg.status;
        if (previousStatus === nextStatus) {
          return;
        }
        state.companyDashboardMeta.status_counts = {
          ...state.companyDashboardMeta.status_counts,
          [nextStatus]: Math.max(0, (state.companyDashboardMeta.status_counts[nextStatus] || 0) - 1),
          [previousStatus]: (state.companyDashboardMeta.status_counts[previousStatus] || 0) + 1
        };
      })
      .addCase(updateCompanyApplication.fulfilled, (state, action) => {
        if (!state.companyDashboardMeta) {
          return;
        }
        const returnedStatus = action.payload.application.status;
        state.companyDashboardMeta.status_counts = {
          ...state.companyDashboardMeta.status_counts,
          [returnedStatus]: state.companyDashboardMeta.status_counts[returnedStatus] || 0
        };
      })
      .addCase(loginUser.fulfilled, clearWorkspaces)
      .addCase(loginAdminUser.fulfilled, clearWorkspaces)
      .addCase(logoutUser.fulfilled, clearWorkspaces)
      .addCase(setUser, clearWorkspaces);
  }
});

export const workspacesReducer = workspacesSlice.reducer;
