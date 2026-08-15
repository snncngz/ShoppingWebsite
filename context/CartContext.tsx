"use client";

import {
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useState,
  type ReactNode,
} from "react";

import {
  CART_STORAGE_KEY,
  getCartLineKey,
  getCartQuantity,
  isCartItem,
} from "@/lib/cart";
import { getSingletonContext } from "@/lib/singleton-context";
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
        return state;
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

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, { items: [] });
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(CART_STORAGE_KEY);
      if (raw) {
        const parsed: unknown = JSON.parse(raw);
        const items = Array.isArray(parsed)
          ? parsed
          : parsed &&
              typeof parsed === "object" &&
              Array.isArray((parsed as { items?: unknown }).items)
            ? (parsed as { items: unknown[] }).items
            : [];
        dispatch({ type: "HYDRATE", items: items.filter(isCartItem) });
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
      CART_STORAGE_KEY,
      JSON.stringify({ items: state.items }),
    );
  }, [hydrated, state.items]);

  const value = useMemo<CartContextValue>(
    () => ({
      items: state.items,
      itemCount: getCartQuantity(state.items),
      hydrated,
      addItem: ({ productId, color, size, quantity = 1 }) => {
        dispatch({
          type: "ADD",
          productId,
          color,
          size,
          quantity,
        });
      },
      removeItem: (id) => dispatch({ type: "REMOVE", id }),
      incrementItem: (id) => dispatch({ type: "INCREMENT", id }),
      decrementItem: (id) => dispatch({ type: "DECREMENT", id }),
      setItemQuantity: (id, quantity) =>
        dispatch({ type: "SET_QUANTITY", id, quantity }),
      updateItemVariant: (id, color, size) =>
        dispatch({ type: "UPDATE_VARIANT", id, color, size }),
      clearCart: () => dispatch({ type: "CLEAR" }),
    }),
    [hydrated, state.items],
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
