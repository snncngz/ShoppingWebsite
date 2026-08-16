"use client";

import {
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { useAuth } from "@/context/AuthContext";
import { WISHLIST_STORAGE_KEY, readGuestWishlistIds } from "@/lib/cart";
import { getSingletonContext } from "@/lib/singleton-context";
import {
  addWishlistItem as addWishlistItemApi,
  deleteWishlistItem as deleteWishlistItemApi,
  fetchWishlist,
  mergeWishlist,
} from "@/lib/shopApi";
import type { WishlistDto } from "@/types/api";

type WishlistState = {
  ids: string[];
  itemIds: Record<string, string>;
};

type WishlistAction =
  | { type: "HYDRATE"; ids: string[]; itemIds?: Record<string, string> }
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
      return { ids: action.ids, itemIds: action.itemIds ?? {} };
    case "ADD":
      if (state.ids.includes(action.productId)) {
        return state;
      }
      return { ...state, ids: [...state.ids, action.productId] };
    case "REMOVE": {
      const { [action.productId]: _removed, ...itemIds } = state.itemIds;
      return {
        ids: state.ids.filter((id) => id !== action.productId),
        itemIds,
      };
    }
    case "TOGGLE":
      return state.ids.includes(action.productId)
        ? wishlistReducer(state, { type: "REMOVE", productId: action.productId })
        : wishlistReducer(state, { type: "ADD", productId: action.productId });
    default:
      return state;
  }
}

function fromWishlist(wishlist: WishlistDto): WishlistState {
  return {
    ids: wishlist.items.map((item) => item.productId),
    itemIds: Object.fromEntries(
      wishlist.items.map((item) => [item.productId, item.id]),
    ),
  };
}

export function WishlistProvider({ children }: { children: ReactNode }) {
  const { isLoggedIn, isLoading: authLoading } = useAuth();
  const [state, dispatch] = useReducer(wishlistReducer, { ids: [], itemIds: {} });
  const [hydrated, setHydrated] = useState(false);
  const modeRef = useRef<"guest" | "user" | null>(null);

  useEffect(() => {
    if (authLoading) {
      return;
    }

    let cancelled = false;

    async function syncSession() {
      if (isLoggedIn) {
        const guestIds = readGuestWishlistIds(
          window.localStorage.getItem(WISHLIST_STORAGE_KEY),
        );

        try {
          if (guestIds.length > 0) {
            await mergeWishlist(guestIds);
          }
          window.localStorage.removeItem(WISHLIST_STORAGE_KEY);
          const wishlist = await fetchWishlist();
          if (!cancelled) {
            dispatch({ type: "HYDRATE", ...fromWishlist(wishlist) });
          }
        } catch {
          if (!cancelled) {
            dispatch({ type: "HYDRATE", ids: [], itemIds: {} });
          }
        }

        if (!cancelled) {
          modeRef.current = "user";
          setHydrated(true);
        }
        return;
      }

      if (modeRef.current === "user") {
        dispatch({ type: "HYDRATE", ids: [], itemIds: {} });
        window.localStorage.removeItem(WISHLIST_STORAGE_KEY);
      } else {
        dispatch({
          type: "HYDRATE",
          ids: readGuestWishlistIds(
            window.localStorage.getItem(WISHLIST_STORAGE_KEY),
          ),
        });
      }

      modeRef.current = "guest";
      setHydrated(true);
    }

    void syncSession();

    return () => {
      cancelled = true;
    };
  }, [authLoading, isLoggedIn]);

  useEffect(() => {
    if (!hydrated || authLoading || isLoggedIn) {
      return;
    }

    window.localStorage.setItem(
      WISHLIST_STORAGE_KEY,
      JSON.stringify({ ids: state.ids }),
    );
  }, [authLoading, hydrated, isLoggedIn, state.ids]);

  const value = useMemo<WishlistContextValue>(
    () => ({
      ids: state.ids,
      count: state.ids.length,
      hydrated,
      hasItem: (productId) => state.ids.includes(productId),
      addItem: (productId) => {
        if (!isLoggedIn) {
          dispatch({ type: "ADD", productId });
          return;
        }

        void addWishlistItemApi(productId)
          .then((wishlist) =>
            dispatch({ type: "HYDRATE", ...fromWishlist(wishlist) }),
          )
          .catch(() => undefined);
      },
      removeItem: (productId) => {
        if (!isLoggedIn) {
          dispatch({ type: "REMOVE", productId });
          return;
        }

        const itemId = state.itemIds[productId];
        if (!itemId) {
          return;
        }

        void deleteWishlistItemApi(itemId)
          .then((wishlist) =>
            dispatch({ type: "HYDRATE", ...fromWishlist(wishlist) }),
          )
          .catch(() => undefined);
      },
      toggleItem: (productId) => {
        if (!isLoggedIn) {
          dispatch({ type: "TOGGLE", productId });
          return;
        }

        if (state.ids.includes(productId)) {
          const itemId = state.itemIds[productId];
          if (!itemId) {
            return;
          }

          void deleteWishlistItemApi(itemId)
            .then((wishlist) =>
              dispatch({ type: "HYDRATE", ...fromWishlist(wishlist) }),
            )
            .catch(() => undefined);
          return;
        }

        void addWishlistItemApi(productId)
          .then((wishlist) =>
            dispatch({ type: "HYDRATE", ...fromWishlist(wishlist) }),
          )
          .catch(() => undefined);
      },
    }),
    [hydrated, isLoggedIn, state.ids, state.itemIds],
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
