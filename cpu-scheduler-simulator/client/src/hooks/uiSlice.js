import { createSlice } from "@reduxjs/toolkit";

const uiSlice = createSlice({
  name: "ui",
  initialState: {
    activeTab: "dashboard",
    sidebarOpen: true,
    theme: "dark",
    notifications: [],
  },
  reducers: {
    setActiveTab(state, { payload }) {
      state.activeTab = payload;
    },
    toggleSidebar(state) {
      state.sidebarOpen = !state.sidebarOpen;
    },
    toggleTheme(state) {
      state.theme = state.theme === "dark" ? "light" : "dark";
    },
    addNotification(state, { payload }) {
      state.notifications.push({ id: Date.now(), ...payload });
    },
    removeNotification(state, { payload: id }) {
      state.notifications = state.notifications.filter((n) => n.id !== id);
    },
  },
});

export const {
  setActiveTab,
  toggleSidebar,
  toggleTheme,
  addNotification,
  removeNotification,
} = uiSlice.actions;
export default uiSlice.reducer;
