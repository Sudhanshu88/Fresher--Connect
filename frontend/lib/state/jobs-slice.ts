"use client";

import { createEntityAdapter, createSlice } from "@reduxjs/toolkit";

import {
  loadSavedJobs,
  loadAdminDashboard,
  loadCompanyDashboard,
  loadUserDashboard,
  saveJob,
  unsaveJob,
  loginAdminUser,
  loginUser,
  logoutUser
} from "@/lib/state/platform-actions";
import { setUser } from "@/lib/state/session-slice";
import type { Job } from "@/lib/types";

const jobsAdapter = createEntityAdapter<Job>({
  sortComparer: (left, right) => {
    const leftTime = left.created_at || left.posted_date || "";
    const rightTime = right.created_at || right.posted_date || "";
    return rightTime.localeCompare(leftTime);
  }
});

type JobCollectionState = ReturnType<typeof jobsAdapter.getInitialState>;

export type JobsState = {
  recommended: JobCollectionState;
  saved: JobCollectionState;
  posted: JobCollectionState;
  moderated: JobCollectionState;
  savedLoaded: boolean;
  pendingSavedMutations: Record<string, { mode: "save" | "remove"; job: Job; existed: boolean }>;
};

const initialState: JobsState = {
  recommended: jobsAdapter.getInitialState(),
  saved: jobsAdapter.getInitialState(),
  posted: jobsAdapter.getInitialState(),
  moderated: jobsAdapter.getInitialState(),
  savedLoaded: false,
  pendingSavedMutations: {}
};

function clearCollection(state: JobCollectionState) {
  jobsAdapter.removeAll(state);
}

function clearJobs(state: JobsState) {
  clearCollection(state.recommended);
  clearCollection(state.saved);
  clearCollection(state.posted);
  clearCollection(state.moderated);
  state.savedLoaded = false;
  state.pendingSavedMutations = {};
}

const jobsSlice = createSlice({
  name: "jobs",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(loadUserDashboard.fulfilled, (state, action) => {
        jobsAdapter.setAll(state.recommended, action.payload.jobs);
        jobsAdapter.setAll(state.saved, action.payload.saved_jobs);
        state.savedLoaded = true;
        clearCollection(state.posted);
        clearCollection(state.moderated);
      })
      .addCase(loadSavedJobs.fulfilled, (state, action) => {
        jobsAdapter.setAll(state.saved, action.payload.saved_jobs);
        state.savedLoaded = true;
      })
      .addCase(loadCompanyDashboard.fulfilled, (state, action) => {
        jobsAdapter.setAll(state.posted, action.payload.posted_jobs);
        clearCollection(state.recommended);
        clearCollection(state.saved);
        clearCollection(state.moderated);
        state.savedLoaded = false;
      })
      .addCase(loadAdminDashboard.fulfilled, (state, action) => {
        jobsAdapter.setAll(state.moderated, action.payload.jobs);
        clearCollection(state.recommended);
        clearCollection(state.saved);
        clearCollection(state.posted);
        state.savedLoaded = false;
      })
      .addCase(saveJob.pending, (state, action) => {
        const existed = Boolean(state.saved.entities[action.meta.arg.job.id]);
        state.pendingSavedMutations[action.meta.requestId] = {
          mode: "save",
          job: action.meta.arg.job,
          existed
        };
        if (!existed) {
          jobsAdapter.addOne(state.saved, action.meta.arg.job);
        }
        state.savedLoaded = true;
      })
      .addCase(saveJob.fulfilled, (state, action) => {
        jobsAdapter.upsertOne(state.saved, action.payload.job);
        delete state.pendingSavedMutations[action.meta.requestId];
      })
      .addCase(saveJob.rejected, (state, action) => {
        const pending = state.pendingSavedMutations[action.meta.requestId];
        if (pending && !pending.existed) {
          jobsAdapter.removeOne(state.saved, pending.job.id);
        }
        delete state.pendingSavedMutations[action.meta.requestId];
      })
      .addCase(unsaveJob.pending, (state, action) => {
        const existing = state.saved.entities[action.meta.arg.job.id];
        state.pendingSavedMutations[action.meta.requestId] = {
          mode: "remove",
          job: existing || action.meta.arg.job,
          existed: Boolean(existing)
        };
        jobsAdapter.removeOne(state.saved, action.meta.arg.job.id);
      })
      .addCase(unsaveJob.fulfilled, (state, action) => {
        jobsAdapter.removeOne(state.saved, action.payload.jobId);
        delete state.pendingSavedMutations[action.meta.requestId];
      })
      .addCase(unsaveJob.rejected, (state, action) => {
        const pending = state.pendingSavedMutations[action.meta.requestId];
        if (pending?.existed) {
          jobsAdapter.addOne(state.saved, pending.job);
        }
        delete state.pendingSavedMutations[action.meta.requestId];
      })
      .addCase(loginUser.fulfilled, clearJobs)
      .addCase(loginAdminUser.fulfilled, clearJobs)
      .addCase(logoutUser.fulfilled, clearJobs)
      .addCase(setUser, clearJobs);
  }
});

export const jobsReducer = jobsSlice.reducer;
