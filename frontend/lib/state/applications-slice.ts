"use client";

import { createEntityAdapter, createSlice } from "@reduxjs/toolkit";

import {
  applyToJob,
  loadAdminDashboard,
  loadCompanyDashboard,
  loadUserDashboard,
  updateCompanyApplication,
  loginAdminUser,
  loginUser,
  logoutUser
} from "@/lib/state/platform-actions";
import { setUser } from "@/lib/state/session-slice";
import type { Application } from "@/lib/types";

const applicationsAdapter = createEntityAdapter<Application>({
  sortComparer: (left, right) => {
    const leftTime = left.applied_at ? new Date(left.applied_at).getTime() : 0;
    const rightTime = right.applied_at ? new Date(right.applied_at).getTime() : 0;
    return rightTime - leftTime;
  }
});

type CandidateApplicationsState = ReturnType<
  typeof applicationsAdapter.getInitialState<{ pendingCreates: Record<string, number> }>
>;

type CompanyApplicationsState = ReturnType<
  typeof applicationsAdapter.getInitialState<{ pendingUpdates: Record<string, Application> }>
>;

export type ApplicationsState = {
  candidate: CandidateApplicationsState;
  company: CompanyApplicationsState;
};

const initialState: ApplicationsState = {
  candidate: applicationsAdapter.getInitialState({
    pendingCreates: {}
  }),
  company: applicationsAdapter.getInitialState({
    pendingUpdates: {}
  })
};

function clearCandidateCollection(state: CandidateApplicationsState) {
  applicationsAdapter.removeAll(state);
  state.pendingCreates = {};
}

function clearCompanyCollection(state: CompanyApplicationsState) {
  applicationsAdapter.removeAll(state);
  state.pendingUpdates = {};
}

function clearApplications(state: ApplicationsState) {
  clearCandidateCollection(state.candidate);
  clearCompanyCollection(state.company);
}

const applicationsSlice = createSlice({
  name: "applications",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(loadUserDashboard.fulfilled, (state, action) => {
        applicationsAdapter.setAll(state.candidate, action.payload.applications);
        state.candidate.pendingCreates = {};
        clearCompanyCollection(state.company);
      })
      .addCase(loadCompanyDashboard.fulfilled, (state, action) => {
        applicationsAdapter.setAll(state.company, action.payload.applications);
        state.company.pendingUpdates = {};
        clearCandidateCollection(state.candidate);
      })
      .addCase(applyToJob.pending, (state, action) => {
        const now = new Date().toISOString();
        const optimisticApplication: Application = {
          id: action.meta.arg.optimisticId,
          application_id: action.meta.arg.optimisticId,
          status: "applied",
          applied_at: now,
          updated_at: now,
          decision_reason: "",
          interview_at: null,
          job: action.meta.arg.job
        };
        applicationsAdapter.addOne(state.candidate, optimisticApplication);
        state.candidate.pendingCreates[action.meta.requestId] = action.meta.arg.optimisticId;
      })
      .addCase(applyToJob.fulfilled, (state, action) => {
        const optimisticId = state.candidate.pendingCreates[action.meta.requestId];
        if (optimisticId !== undefined) {
          applicationsAdapter.removeOne(state.candidate, optimisticId);
          delete state.candidate.pendingCreates[action.meta.requestId];
        }
        applicationsAdapter.upsertOne(state.candidate, action.payload.application);
      })
      .addCase(applyToJob.rejected, (state, action) => {
        const optimisticId = state.candidate.pendingCreates[action.meta.requestId];
        if (optimisticId !== undefined) {
          applicationsAdapter.removeOne(state.candidate, optimisticId);
          delete state.candidate.pendingCreates[action.meta.requestId];
        }
      })
      .addCase(updateCompanyApplication.pending, (state, action) => {
        const current = state.company.entities[action.meta.arg.application.id];
        if (current) {
          state.company.pendingUpdates[action.meta.requestId] = { ...current };
        }
        applicationsAdapter.upsertOne(state.company, {
          ...action.meta.arg.application,
          status: action.meta.arg.status,
          interview_at: action.meta.arg.interview_at || null,
          decision_reason: action.meta.arg.decision_reason
        });
      })
      .addCase(updateCompanyApplication.fulfilled, (state, action) => {
        delete state.company.pendingUpdates[action.meta.requestId];
        applicationsAdapter.upsertOne(state.company, action.payload.application);
      })
      .addCase(updateCompanyApplication.rejected, (state, action) => {
        const previous = state.company.pendingUpdates[action.meta.requestId];
        if (previous) {
          applicationsAdapter.upsertOne(state.company, previous);
          delete state.company.pendingUpdates[action.meta.requestId];
        }
      })
      .addCase(loadAdminDashboard.fulfilled, clearApplications)
      .addCase(loginUser.fulfilled, clearApplications)
      .addCase(loginAdminUser.fulfilled, clearApplications)
      .addCase(logoutUser.fulfilled, clearApplications)
      .addCase(setUser, clearApplications);
  }
});

export const applicationsReducer = applicationsSlice.reducer;
