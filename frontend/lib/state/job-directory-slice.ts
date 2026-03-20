"use client";

import { createEntityAdapter, createSlice } from "@reduxjs/toolkit";

import {
  jobsDirectoryKey,
  loadJobDetail,
  loadJobsDirectory,
  loginAdminUser,
  loginUser,
  logoutUser
} from "@/lib/state/platform-actions";
import { setUser } from "@/lib/state/session-slice";
import type { Job, JobsDirectoryFilters, Pagination } from "@/lib/types";

const jobDirectoryAdapter = createEntityAdapter<Job>({
  sortComparer: (left, right) => {
    const leftTime = left.created_at || left.posted_date || "";
    const rightTime = right.created_at || right.posted_date || "";
    return rightTime.localeCompare(leftTime);
  }
});

type QueryEntry = {
  ids: number[];
  categories: string[];
  locations: string[];
  pagination: Pagination | null;
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
  filters: JobsDirectoryFilters;
};

type DetailEntry = {
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
};

export type JobDirectoryState = ReturnType<
  typeof jobDirectoryAdapter.getInitialState<{
    queries: Record<string, QueryEntry>;
    details: Record<number, DetailEntry>;
  }>
>;

const initialState: JobDirectoryState = jobDirectoryAdapter.getInitialState({
  queries: {},
  details: {}
});

function clearJobDirectory(state: JobDirectoryState) {
  jobDirectoryAdapter.removeAll(state);
  state.queries = {};
  state.details = {};
}

const jobDirectorySlice = createSlice({
  name: "jobDirectory",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(loadJobsDirectory.pending, (state, action) => {
        const key = jobsDirectoryKey(action.meta.arg);
        state.queries[key] = {
          ids: state.queries[key]?.ids || [],
          categories: state.queries[key]?.categories || [],
          locations: state.queries[key]?.locations || [],
          pagination: state.queries[key]?.pagination || null,
          status: "loading",
          error: null,
          filters: action.meta.arg
        };
      })
      .addCase(loadJobsDirectory.fulfilled, (state, action) => {
        jobDirectoryAdapter.upsertMany(state, action.payload.response.jobs);
        state.queries[action.payload.key] = {
          ids: action.payload.response.jobs.map((job) => job.id),
          categories: action.payload.response.filters.categories || action.payload.response.categories || [],
          locations: action.payload.response.filters.locations || [],
          pagination: action.payload.response.pagination,
          status: "succeeded",
          error: null,
          filters: action.payload.filters
        };
      })
      .addCase(loadJobsDirectory.rejected, (state, action) => {
        const key = jobsDirectoryKey(action.meta.arg);
        state.queries[key] = {
          ids: state.queries[key]?.ids || [],
          categories: state.queries[key]?.categories || [],
          locations: state.queries[key]?.locations || [],
          pagination: state.queries[key]?.pagination || null,
          status: "failed",
          error: action.error.message || "Jobs could not be loaded.",
          filters: action.meta.arg
        };
      })
      .addCase(loadJobDetail.pending, (state, action) => {
        state.details[Number(action.meta.arg.jobId)] = {
          status: "loading",
          error: null
        };
      })
      .addCase(loadJobDetail.fulfilled, (state, action) => {
        jobDirectoryAdapter.upsertOne(state, action.payload);
        state.details[action.payload.id] = {
          status: "succeeded",
          error: null
        };
      })
      .addCase(loadJobDetail.rejected, (state, action) => {
        state.details[Number(action.meta.arg.jobId)] = {
          status: "failed",
          error: action.error.message || "Job detail could not be loaded."
        };
      })
      .addCase(loginUser.fulfilled, clearJobDirectory)
      .addCase(loginAdminUser.fulfilled, clearJobDirectory)
      .addCase(logoutUser.fulfilled, clearJobDirectory)
      .addCase(setUser, clearJobDirectory);
  }
});

export const jobDirectoryReducer = jobDirectorySlice.reducer;
