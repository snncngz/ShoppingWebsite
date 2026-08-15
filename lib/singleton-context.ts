"use client";

import { createContext, type Context } from "react";

/**
 * Turbopack can evaluate the same client module in both the layout chunk and a
 * page chunk. createContext() then yields two objects, so a Provider in the
 * layout is invisible to hooks in the page. Reuse one Context via globalThis.
 */
export function getSingletonContext<T>(key: string, defaultValue: T): Context<T> {
  const store = globalThis as typeof globalThis &
    Record<string, Context<T> | undefined>;

  if (!store[key]) {
    store[key] = createContext(defaultValue);
  }

  return store[key];
}
