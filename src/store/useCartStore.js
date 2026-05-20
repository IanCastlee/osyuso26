import { create } from "zustand";
import fetchInstance from "../utils/fetchInstance";

const useCartStore = create((set, get) => ({
  cartCount: 0,
  loadingCount: false,
  lastFetchedAt: 0,

  setCartCount: (count) => {
    set({
      cartCount: Math.max(0, Number(count || 0)),
    });
  },

  incrementCart: () => {
    set((state) => ({
      cartCount: state.cartCount + 1,
    }));
  },

  decrementCart: () => {
    set((state) => ({
      cartCount: Math.max(0, state.cartCount - 1),
    }));
  },

  clearCartCount: () => {
    set({
      cartCount: 0,
      lastFetchedAt: 0,
    });
  },

  fetchCartCount: async ({ force = false } = {}) => {
    const state = get();
    const now = Date.now();

    if (!force && now - state.lastFetchedAt < 30000) {
      return state.cartCount;
    }

    try {
      set({ loadingCount: true });

      const res = await fetchInstance("cart/get-cart-count.php");
      const payload = res?.data || res;

      console.log("COUNT : ", res);

      const count = Number(payload?.cart_count || 0);

      set({
        cartCount: count,
        lastFetchedAt: Date.now(),
        loadingCount: false,
      });

      return count;
    } catch (err) {
      set({ loadingCount: false });

      if (err?.status !== 401) {
        console.error("Fetch cart count failed:", err);
      }

      return state.cartCount;
    }
  },
}));

export default useCartStore;
