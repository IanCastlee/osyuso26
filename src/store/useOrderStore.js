import { create } from "zustand";
import fetchInstance from "../utils/fetchInstance";

const useOrderStore = create((set, get) => ({
  orderCount: 0,
  loadingCount: false,
  lastFetchedAt: 0,

  setOrderCount: (count) => {
    set({
      orderCount: Math.max(0, Number(count || 0)),
    });
  },

  decrementOrder: () => {
    set((state) => ({
      orderCount: Math.max(0, state.orderCount - 1),
    }));
  },

  clearOrderCount: () => {
    set({
      orderCount: 0,
      lastFetchedAt: 0,
    });
  },

  fetchOrderCount: async ({ force = false } = {}) => {
    const state = get();
    const now = Date.now();

    if (!force && now - state.lastFetchedAt < 30000) {
      return state.orderCount;
    }

    try {
      set({ loadingCount: true });

      const res = await fetchInstance("order/get-order-count.php");
      const payload = res?.data || res;

      const count = Number(payload?.order_count || 0);

      set({
        orderCount: count,
        lastFetchedAt: Date.now(),
        loadingCount: false,
      });

      return count;
    } catch (err) {
      set({ loadingCount: false });

      if (err?.status !== 401) {
        console.error("Fetch order count failed:", err);
      }

      return state.orderCount;
    }
  },
}));

export default useOrderStore;
