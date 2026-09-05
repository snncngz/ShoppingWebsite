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
import {
  CART_STORAGE_KEY,
  getCartLineKey,
  getCartQuantity,
  readGuestCartItems,
} from "@/lib/cart";
import { applyCartVariant, toFrontendCartItem } from "@/lib/mappers/cart";
import { getSingletonContext } from "@/lib/singleton-context";
import {
  addCartItem as addCartItemApi,
  clearRemoteCart,
  deleteCartItem as deleteCartItemApi,
  fetchCart,
  mergeCart,
  updateCartItem as updateCartItemApi,
} from "@/lib/shopApi";
import type { CartDto } from "@/types/api";
import type { CartItem } from "@/types";

type CartState = {
  items: CartItem[];
};

type CartAction =
  | { type: "HYDRATE"; items: CartItem[] }
  | {
      type: "ADD";
      productId: string;
      color: string;
      size: string;
      quantity: number;
    }
  | { type: "REMOVE"; id: string }
  | { type: "SET_QUANTITY"; id: string; quantity: number }
  | { type: "INCREMENT"; id: string }
  | { type: "DECREMENT"; id: string }
  | { type: "UPDATE_VARIANT"; id: string; color: string; size: string }
  | { type: "CLEAR" };

type CartContextValue = {
  items: CartItem[];
  itemCount: number;
  hydrated: boolean;
  addItem: (input: {
    productId: string;
    color: string;
    size: string;
    quantity?: number;
  }) => void;
  removeItem: (id: string) => void;
  incrementItem: (id: string) => void;
  decrementItem: (id: string) => void;
  setItemQuantity: (id: string, quantity: number) => void;
  updateItemVariant: (id: string, color: string, size: string) => void;
  clearCart: () => void;
};

const CartContext = getSingletonContext<CartContextValue | null>(
  "__VELORA_CART_CONTEXT__",
  null,
);

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "HYDRATE":
      return { items: action.items };
    case "ADD": {
      const id = getCartLineKey(action.productId, action.color, action.size);
      const existing = state.items.find((item) => item.id === id);

      if (existing) {
        return {
          items: state.items.map((item) =>
            item.id === id
              ? { ...item, quantity: item.quantity + action.quantity }
              : item,
          ),
        };
      }

      return {
        items: [
          ...state.items,
          {
            id,
            productId: action.productId,
            quantity: action.quantity,
            color: action.color,
            size: action.size,
          },
        ],
      };
    }
    case "REMOVE":
      return { items: state.items.filter((item) => item.id !== action.id) };
    case "SET_QUANTITY": {
      if (action.quantity <= 0) {
        return { items: state.items.filter((item) => item.id !== action.id) };
      }

      return {
        items: state.items.map((item) =>
          item.id === action.id ? { ...item, quantity: action.quantity } : item,
        ),
      };
    }
    case "INCREMENT":
      return {
        items: state.items.map((item) =>
          item.id === action.id ? { ...item, quantity: item.quantity + 1 } : item,
        ),
      };
    case "DECREMENT":
      return {
        items: state.items
          .map((item) =>
            item.id === action.id
              ? { ...item, quantity: item.quantity - 1 }
              : item,
          )
          .filter((item) => item.quantity > 0),
      };
    case "UPDATE_VARIANT": {
      const current = state.items.find((item) => item.id === action.id);
      if (!current) {
        return state;
      }

      const nextId = getCartLineKey(current.productId, action.color, action.size);
      if (nextId === current.id) {
        return {
          items: state.items.map((item) =>
            item.id === current.id
              ? { ...item, color: action.color, size: action.size }
              : item,
          ),
        };
      }

      const duplicate = state.items.find((item) => item.id === nextId);

      if (duplicate) {
        return {
          items: state.items
            .filter((item) => item.id !== current.id)
            .map((item) =>
              item.id === nextId
                ? { ...item, quantity: item.quantity + current.quantity }
                : item,
            ),
        };
      }

      return {
        items: state.items.map((item) =>
          item.id === current.id
            ? {
                ...item,
                id: nextId,
                color: action.color,
                size: action.size,
              }
            : item,
        ),
      };
    }
    case "CLEAR":
      return { items: [] };
    default:
      return state;
  }
}

function mapCart(cart: CartDto, productId?: string, color?: string, size?: string): CartItem[] {
  const items = cart.items.map(toFrontendCartItem);
  if (!productId || color === undefined || size === undefined) {
    return items;
  }

  return applyCartVariant(items, productId, color, size);
}

export function CartProvider({ children }: { children: ReactNode }) {
  const { isLoggedIn, isLoading: authLoading } = useAuth();
  const [state, dispatch] = useReducer(cartReducer, { items: [] });
  const [hydrated, setHydrated] = useState(false);
  const modeRef = useRef<"guest" | "user" | null>(null);

  useEffect(() => {
    if (authLoading) {
      return;
    }

    let cancelled = false;

    async function syncSession() {
      if (isLoggedIn) {
        const guestItems = readGuestCartItems(
          window.localStorage.getItem(CART_STORAGE_KEY),
        );

        try {
          if (guestItems.length > 0) {
            await mergeCart(guestItems);
          }
          window.localStorage.removeItem(CART_STORAGE_KEY);
          const cart = await fetchCart();
          if (!cancelled) {
            dispatch({ type: "HYDRATE", items: mapCart(cart) });
          }
        } catch {
          if (!cancelled) {
            dispatch({ type: "HYDRATE", items: [] });
          }
        }

        if (!cancelled) {
          modeRef.current = "user";
          setHydrated(true);
        }
        return;
      }

      if (modeRef.current === "user") {
        dispatch({ type: "CLEAR" });
        window.localStorage.removeItem(CART_STORAGE_KEY);
      } else {
        dispatch({
          type: "HYDRATE",
          items: readGuestCartItems(window.localStorage.getItem(CART_STORAGE_KEY)),
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
      CART_STORAGE_KEY,
      JSON.stringify({ items: state.items }),
    );
  }, [authLoading, hydrated, isLoggedIn, state.items]);

  const value = useMemo<CartContextValue>(
    () => ({
      items: state.items,
      itemCount: getCartQuantity(state.items),
      hydrated,
      addItem: ({ productId, color, size, quantity = 1 }) => {
        if (!isLoggedIn) {
          dispatch({ type: "ADD", productId, color, size, quantity });
          return;
        }

        void addCartItemApi({ productId, quantity, size })
          .then((cart) => {
            dispatch({
              type: "HYDRATE",
              items: mapCart(cart, productId, color, size),
            });
          })
          .catch(() => undefined);
      },
      removeItem: (id) => {
        if (!isLoggedIn) {
          dispatch({ type: "REMOVE", id });
          return;
        }

        void deleteCartItemApi(id)
          .then((cart) => dispatch({ type: "HYDRATE", items: mapCart(cart) }))
          .catch(() => undefined);
      },
      incrementItem: (id) => {
        if (!isLoggedIn) {
          dispatch({ type: "INCREMENT", id });
          return;
        }

        const item = state.items.find((entry) => entry.id === id);
        if (!item) {
          return;
        }

        void updateCartItemApi(id, item.quantity + 1)
          .then((cart) => dispatch({ type: "HYDRATE", items: mapCart(cart) }))
          .catch(() => undefined);
      },
      decrementItem: (id) => {
        const item = state.items.find((entry) => entry.id === id);
        if (!item) {
          return;
        }

        if (!isLoggedIn) {
          dispatch({ type: "DECREMENT", id });
          return;
        }

        if (item.quantity <= 1) {
          void deleteCartItemApi(id)
            .then((cart) => dispatch({ type: "HYDRATE", items: mapCart(cart) }))
            .catch(() => undefined);
          return;
        }

        void updateCartItemApi(id, item.quantity - 1)
          .then((cart) => dispatch({ type: "HYDRATE", items: mapCart(cart) }))
          .catch(() => undefined);
      },
      setItemQuantity: (id, quantity) => {
        if (!isLoggedIn) {
          dispatch({ type: "SET_QUANTITY", id, quantity });
          return;
        }

        if (quantity <= 0) {
          void deleteCartItemApi(id)
            .then((cart) => dispatch({ type: "HYDRATE", items: mapCart(cart) }))
            .catch(() => undefined);
          return;
        }

        void updateCartItemApi(id, quantity)
          .then((cart) => dispatch({ type: "HYDRATE", items: mapCart(cart) }))
          .catch(() => undefined);
      },
      updateItemVariant: (id, color, size) => {
        dispatch({ type: "UPDATE_VARIANT", id, color, size });
      },
      clearCart: () => {
        if (!isLoggedIn) {
          dispatch({ type: "CLEAR" });
          return;
        }

        void clearRemoteCart()
          .then((cart) => dispatch({ type: "HYDRATE", items: mapCart(cart) }))
          .catch(() => undefined);
      },
    }),
    [hydrated, isLoggedIn, state.items],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error("useCart must be used within CartProvider.");
  }

  return context;
}
