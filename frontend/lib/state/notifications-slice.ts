"use client";

import { createEntityAdapter, createSlice } from "@reduxjs/toolkit";

import {
  loadAdminDashboard,
  loadCompanyDashboard,
  loadUserDashboard,
  markNotificationRead,
  loginAdminUser,
  loginUser,
  logoutUser
} from "@/lib/state/platform-actions";
import { setUser } from "@/lib/state/session-slice";
import type { NotificationItem } from "@/lib/types";

const notificationsAdapter = createEntityAdapter<NotificationItem>({
  sortComparer: (left, right) => {
    const leftTime = left.created_at ? new Date(left.created_at).getTime() : 0;
    const rightTime = right.created_at ? new Date(right.created_at).getTime() : 0;
    return rightTime - leftTime;
  }
});

export type NotificationsState = ReturnType<
  typeof notificationsAdapter.getInitialState<{
    unreadCount: number;
    pendingReadRequests: Record<string, { notificationId: number; wasRead: boolean }>;
  }>
>;

const initialState: NotificationsState = notificationsAdapter.getInitialState({
  unreadCount: 0,
  pendingReadRequests: {}
});

function clearNotifications(state: NotificationsState) {
  notificationsAdapter.removeAll(state);
  state.unreadCount = 0;
  state.pendingReadRequests = {};
}

const notificationsSlice = createSlice({
  name: "notifications",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(loadUserDashboard.fulfilled, (state, action) => {
        notificationsAdapter.setAll(state, action.payload.notifications);
        state.unreadCount = action.payload.notification_unread_count;
      })
      .addCase(markNotificationRead.pending, (state, action) => {
        const notification = state.entities[action.meta.arg.notificationId];
        const wasRead = Boolean(notification?.is_read);
        state.pendingReadRequests[action.meta.requestId] = {
          notificationId: action.meta.arg.notificationId,
          wasRead
        };
        if (notification && !notification.is_read) {
          notification.is_read = true;
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
      })
      .addCase(markNotificationRead.fulfilled, (state, action) => {
        notificationsAdapter.setAll(state, action.payload.notifications);
        state.unreadCount = action.payload.unread_count;
        delete state.pendingReadRequests[action.meta.requestId];
      })
      .addCase(markNotificationRead.rejected, (state, action) => {
        const pending = state.pendingReadRequests[action.meta.requestId];
        if (pending) {
          const notification = state.entities[pending.notificationId];
          if (notification) {
            notification.is_read = pending.wasRead;
          }
          if (!pending.wasRead) {
            state.unreadCount += 1;
          }
          delete state.pendingReadRequests[action.meta.requestId];
        }
      })
      .addCase(loadCompanyDashboard.fulfilled, clearNotifications)
      .addCase(loadAdminDashboard.fulfilled, clearNotifications)
      .addCase(loginUser.fulfilled, clearNotifications)
      .addCase(loginAdminUser.fulfilled, clearNotifications)
      .addCase(logoutUser.fulfilled, clearNotifications)
      .addCase(setUser, clearNotifications);
  }
});

export const notificationsReducer = notificationsSlice.reducer;
