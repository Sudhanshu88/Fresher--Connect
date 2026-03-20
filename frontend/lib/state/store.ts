"use client";

import { configureStore } from "@reduxjs/toolkit";
import { useDispatch, useSelector, useStore } from "react-redux";

import { applicationsReducer } from "@/lib/state/applications-slice";
import { jobDirectoryReducer } from "@/lib/state/job-directory-slice";
import { jobsReducer } from "@/lib/state/jobs-slice";
import { notificationsReducer } from "@/lib/state/notifications-slice";
import { sessionReducer } from "@/lib/state/session-slice";
import { workspacesReducer } from "@/lib/state/workspaces-slice";

export function makeStore() {
  return configureStore({
    reducer: {
      session: sessionReducer,
      notifications: notificationsReducer,
      applications: applicationsReducer,
      jobDirectory: jobDirectoryReducer,
      jobs: jobsReducer,
      workspaces: workspacesReducer
    }
  });
}

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];

export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();
export const useAppStore = useStore.withTypes<AppStore>();
