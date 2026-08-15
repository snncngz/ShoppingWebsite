"use client";

import type { ReactNode } from "react";

import { AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";
import { CatalogProvider } from "@/context/CatalogContext";
import { WishlistProvider } from "@/context/WishlistContext";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <CartProvider>
        <WishlistProvider>
          <CatalogProvider>{children}</CatalogProvider>
        </WishlistProvider>
      </CartProvider>
    </AuthProvider>
  );
}
