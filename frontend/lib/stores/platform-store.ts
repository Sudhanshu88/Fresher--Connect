"use client";

import { type EntityState } from "@reduxjs/toolkit";
import { useMemo, useRef } from "react";

import {
  type AuthPayload,
  applyToJob,
  hydrateSession,
  loadAdminDashboard,
  loadCompanyDashboard,
  loadJobDetail,
  loadJobsDirectory,
  loadSavedJobs,
  loadUserDashboard,
  loginAdminUser,
  loginUser,
  logoutUser,
  markNotificationRead,
  saveJob,
  unsaveJob,
  updateCompanyApplication
} from "@/lib/state/platform-actions";
import { setUser } from "@/lib/state/session-slice";
import { useAppDispatch, useAppSelector } from "@/lib/state/store";
import type {
  AdminDashboard,
  Application,
  CompanyDashboard,
  Job,
  JobsDirectoryFilters,
  NotificationItem,
  SessionUser,
  UserDashboard
} from "@/lib/types";

type PlatformStoreFacade = {
  user: SessionUser | null;
  bootstrapped: boolean;
  userDashboard: UserDashboard | null;
  companyDashboard: CompanyDashboard | null;
  adminDashboard: AdminDashboard | null;
  notifications: NotificationItem[];
  notificationUnreadCount: number;
  candidateApplications: Application[];
  companyApplications: Application[];
  savedJobs: Job[];
  savedJobsLoaded: boolean;
  hydrateSession: () => Promise<void>;
  login: (payload: AuthPayload) => Promise<SessionUser>;
  loginAdmin: (payload: AuthPayload) => Promise<SessionUser>;
  logout: () => Promise<void>;
  loadUserDashboard: () => Promise<UserDashboard>;
  loadCompanyDashboard: () => Promise<CompanyDashboard>;
  loadAdminDashboard: () => Promise<AdminDashboard>;
  loadSavedJobs: () => Promise<void>;
  markNotificationRead: (notificationId: number) => Promise<void>;
  applyToJob: (job: Job) => Promise<Application>;
  saveJob: (job: Job) => Promise<void>;
  unsaveJob: (job: Job) => Promise<void>;
  updateCompanyApplication: (payload: {
    application: Application;
    status: string;
    interview_at: string;
    decision_reason: string;
  }) => Promise<Application>;
  loadJobsDirectory: (filters: JobsDirectoryFilters) => Promise<void>;
  loadJobDetail: (jobId: number | string) => Promise<Job>;
  setUser: (user: SessionUser | null) => void;
};

function orderedValues<T, Id extends string | number>(state: EntityState<T, Id>): T[] {
  return state.ids
    .map((id) => state.entities[id])
    .filter((value): value is T => Boolean(value));
}

export function usePlatformStore<T>(selector: (state: PlatformStoreFacade) => T): T {
  const dispatch = useAppDispatch();
  const session = useAppSelector((state) => state.session);
  const notificationsState = useAppSelector((state) => state.notifications);
  const applicationsState = useAppSelector((state) => state.applications);
  const jobsState = useAppSelector((state) => state.jobs);
  const workspacesState = useAppSelector((state) => state.workspaces);
  const optimisticIdRef = useRef(-1);

  const notifications = useMemo(
    () => orderedValues(notificationsState),
    [notificationsState]
  );
  const candidateApplications = useMemo(
    () => orderedValues(applicationsState.candidate),
    [applicationsState.candidate]
  );
  const companyApplications = useMemo(
    () => orderedValues(applicationsState.company),
    [applicationsState.company]
  );
  const recommendedJobs = useMemo(
    () => orderedValues(jobsState.recommended),
    [jobsState.recommended]
  );
  const savedJobs = useMemo(
    () => orderedValues(jobsState.saved),
    [jobsState.saved]
  );
  const postedJobs = useMemo(
    () => orderedValues(jobsState.posted),
    [jobsState.posted]
  );
  const moderatedJobs = useMemo(
    () => orderedValues(jobsState.moderated),
    [jobsState.moderated]
  );

  const userDashboard = useMemo<UserDashboard | null>(() => {
    if (!workspacesState.userDashboardMeta) {
      return null;
    }

    return {
      ...workspacesState.userDashboardMeta,
      jobs: recommendedJobs,
      saved_jobs: savedJobs,
      applications: candidateApplications,
      notifications,
      notification_unread_count: notificationsState.unreadCount
    };
  }, [
    candidateApplications,
    notifications,
    notificationsState.unreadCount,
    recommendedJobs,
    savedJobs,
    workspacesState.userDashboardMeta
  ]);

  const companyDashboard = useMemo<CompanyDashboard | null>(() => {
    if (!workspacesState.companyDashboardMeta) {
      return null;
    }

    return {
      ...workspacesState.companyDashboardMeta,
      posted_jobs: postedJobs,
      applications: companyApplications
    };
  }, [companyApplications, postedJobs, workspacesState.companyDashboardMeta]);

  const adminDashboard = useMemo<AdminDashboard | null>(() => {
    if (!workspacesState.adminDashboardMeta) {
      return null;
    }

    return {
      ...workspacesState.adminDashboardMeta,
      jobs: moderatedJobs
    };
  }, [moderatedJobs, workspacesState.adminDashboardMeta]);

  const actions = useMemo(
    () => ({
      hydrateSession: async () => {
        await dispatch(hydrateSession()).unwrap();
      },
      login: (payload: AuthPayload) => dispatch(loginUser(payload)).unwrap(),
      loginAdmin: (payload: AuthPayload) => dispatch(loginAdminUser(payload)).unwrap(),
      logout: async () => {
        await dispatch(logoutUser()).unwrap();
      },
      loadUserDashboard: () => dispatch(loadUserDashboard()).unwrap(),
      loadCompanyDashboard: () => dispatch(loadCompanyDashboard()).unwrap(),
      loadAdminDashboard: () => dispatch(loadAdminDashboard()).unwrap(),
      loadSavedJobs: async () => {
        await dispatch(loadSavedJobs()).unwrap();
      },
      markNotificationRead: async (notificationId: number) => {
        await dispatch(markNotificationRead({ notificationId })).unwrap();
      },
      applyToJob: async (job: Job) => {
        const optimisticId = optimisticIdRef.current;
        optimisticIdRef.current -= 1;
        const response = await dispatch(applyToJob({ job, optimisticId })).unwrap();
        return response.application;
      },
      saveJob: async (job: Job) => {
        await dispatch(saveJob({ job })).unwrap();
      },
      unsaveJob: async (job: Job) => {
        await dispatch(unsaveJob({ job })).unwrap();
      },
      updateCompanyApplication: async (payload: {
        application: Application;
        status: string;
        interview_at: string;
        decision_reason: string;
      }) => {
        const response = await dispatch(updateCompanyApplication(payload)).unwrap();
        return response.application;
      },
      loadJobsDirectory: async (filters: JobsDirectoryFilters) => {
        await dispatch(loadJobsDirectory(filters)).unwrap();
      },
      loadJobDetail: (jobId: number | string) => dispatch(loadJobDetail({ jobId })).unwrap(),
      setUser: (user: SessionUser | null) => {
        dispatch(setUser(user));
      }
    }),
    [dispatch]
  );

  const facade = useMemo(
    () =>
      ({
        user: session.user,
        bootstrapped: session.bootstrapped,
        userDashboard,
        companyDashboard,
        adminDashboard,
        notifications,
        notificationUnreadCount: notificationsState.unreadCount,
        candidateApplications,
        companyApplications,
        savedJobs,
        savedJobsLoaded: jobsState.savedLoaded,
        ...actions
      }) satisfies PlatformStoreFacade,
    [
      actions,
      adminDashboard,
      candidateApplications,
      companyApplications,
      companyDashboard,
      jobsState.savedLoaded,
      notifications,
      notificationsState.unreadCount,
      savedJobs,
      session.bootstrapped,
      session.user,
      userDashboard
    ]
  );

  return selector(facade);
}
