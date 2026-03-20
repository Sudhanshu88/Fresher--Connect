"use client";

import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

import {
  hydrateSession,
  loadAdminDashboard,
  loadCompanyDashboard,
  loadUserDashboard,
  loginAdminUser,
  loginUser,
  logoutUser
} from "@/lib/state/platform-actions";
import type { SessionUser } from "@/lib/types";

export type SessionState = {
  user: SessionUser | null;
  bootstrapped: boolean;
};

const initialState: SessionState = {
  user: null,
  bootstrapped: false
};

const sessionSlice = createSlice({
  name: "session",
  initialState,
  reducers: {
    setUser(state, action: PayloadAction<SessionUser | null>) {
      state.user = action.payload;
      state.bootstrapped = true;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(hydrateSession.fulfilled, (state, action) => {
        state.user = action.payload;
        state.bootstrapped = true;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.user = action.payload;
        state.bootstrapped = true;
      })
      .addCase(loginAdminUser.fulfilled, (state, action) => {
        state.user = action.payload;
        state.bootstrapped = true;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.bootstrapped = true;
      })
      .addCase(loadUserDashboard.fulfilled, (state, action) => {
        state.user = action.payload.user;
        state.bootstrapped = true;
      })
      .addCase(loadCompanyDashboard.fulfilled, (state, action) => {
        state.user = action.payload.user;
        state.bootstrapped = true;
      })
      .addCase(loadAdminDashboard.fulfilled, (state, action) => {
        state.user = action.payload.user;
        state.bootstrapped = true;
      });
  }
});

export const { setUser } = sessionSlice.actions;
export const sessionReducer = sessionSlice.reducer;
