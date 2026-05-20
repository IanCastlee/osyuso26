import { create } from "zustand";
import fetchInstance from "../utils/fetchInstance";

const useNotificationStore = create((set, get) => ({
  unreadCount: 0,
  loadingCount: false,
  lastFetchedAt: 0,

  setUnreadCount: (count) => {
    set({
      unreadCount: Math.max(0, Number(count || 0)),
    });
  },

  decrementUnread: () => {
    set((state) => ({
      unreadCount: Math.max(0, state.unreadCount - 1),
    }));
  },

  clearUnread: () => {
    set({
      unreadCount: 0,
    });
  },

  fetchUnreadCount: async ({ force = false } = {}) => {
    const state = get();
    const now = Date.now();

    if (!force && now - state.lastFetchedAt < 30000) {
      return state.unreadCount;
    }

    try {
      set({ loadingCount: true });

      const res = await fetchInstance("notification/get-unread-count.php");
      const payload = res?.data || res;

      const count = Number(payload?.unread_count || 0);

      set({
        unreadCount: count,
        lastFetchedAt: Date.now(),
        loadingCount: false,
      });

      return count;
    } catch (err) {
      set({ loadingCount: false });

      if (err?.status !== 401) {
        console.error("Fetch unread notification count failed:", err);
      }

      return state.unreadCount;
    }
  },
}));

export default useNotificationStore;
