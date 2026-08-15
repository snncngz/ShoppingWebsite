"use client";

import {
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useState,
  type ReactNode,
} from "react";

import { WISHLIST_STORAGE_KEY } from "@/lib/cart";
import { getSingletonContext } from "@/lib/singleton-context";

type WishlistState = {
  ids: string[];
};

type WishlistAction =
  | { type: "HYDRATE"; ids: string[] }
  | { type: "ADD"; productId: string }
  | { type: "REMOVE"; productId: string }
  | { type: "TOGGLE"; productId: string };

type WishlistContextValue = {
  ids: string[];
  count: number;
  hydrated: boolean;
  hasItem: (productId: string) => boolean;
  addItem: (productId: string) => void;
  removeItem: (productId: string) => void;
  toggleItem: (productId: string) => void;
};

const WishlistContext = getSingletonContext<WishlistContextValue | null>(
  "__VELORA_WISHLIST_CONTEXT__",
  null,
);

function wishlistReducer(
  state: WishlistState,
  action: WishlistAction,
): WishlistState {
  switch (action.type) {
    case "HYDRATE":
      return { ids: action.ids };
    case "ADD":
      if (state.ids.includes(action.productId)) {
        return state;
      }
      return { ids: [...state.ids, action.productId] };
    case "REMOVE":
      return { ids: state.ids.filter((id) => id !== action.productId) };
    case "TOGGLE":
      return state.ids.includes(action.productId)
        ? { ids: state.ids.filter((id) => id !== action.productId) }
        : { ids: [...state.ids, action.productId] };
    default:
      return state;
  }
}

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(wishlistReducer, { ids: [] });
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(WISHLIST_STORAGE_KEY);
      if (raw) {
        const parsed: unknown = JSON.parse(raw);
        const ids = Array.isArray(parsed)
          ? parsed
          : parsed &&
              typeof parsed === "object" &&
              Array.isArray((parsed as { ids?: unknown }).ids)
            ? (parsed as { ids: unknown[] }).ids
            : [];
        dispatch({
          type: "HYDRATE",
          ids: ids.filter((id): id is string => typeof id === "string"),
        });
      }
    } catch {
      // Ignore malformed storage.
    }

    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    window.localStorage.setItem(
      WISHLIST_STORAGE_KEY,
      JSON.stringify({ ids: state.ids }),
    );
  }, [hydrated, state.ids]);

  const value = useMemo<WishlistContextValue>(
    () => ({
      ids: state.ids,
      count: state.ids.length,
      hydrated,
      hasItem: (productId) => state.ids.includes(productId),
      addItem: (productId) => dispatch({ type: "ADD", productId }),
      removeItem: (productId) => dispatch({ type: "REMOVE", productId }),
      toggleItem: (productId) => dispatch({ type: "TOGGLE", productId }),
    }),
    [hydrated, state.ids],
  );

  return (
    <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>
  );
}

export function useWishlist(): WishlistContextValue {
  const context = useContext(WishlistContext);

  if (!context) {
    throw new Error("useWishlist must be used within WishlistProvider.");
  }

  return context;
}
