"use client";

import { create } from "zustand";
import type { CartView } from "@/lib/cart";

interface CartUIState {
  open: boolean;
  cart: CartView | null;
  pending: boolean;
  openCart: () => void;
  closeCart: () => void;
  setCart: (cart: CartView | null) => void;
  setPending: (v: boolean) => void;
}

export const useCartUI = create<CartUIState>((set) => ({
  open: false,
  cart: null,
  pending: false,
  openCart: () => set({ open: true }),
  closeCart: () => set({ open: false }),
  setCart: (cart) => set({ cart }),
  setPending: (pending) => set({ pending }),
}));
