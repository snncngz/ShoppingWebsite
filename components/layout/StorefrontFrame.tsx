"use client";

import type { ReactNode } from "react";

import { usePathname } from "next/navigation";

import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";

export function StorefrontFrame({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/admin");

  if (isAdmin) {
    return <div className="flex min-h-0 min-w-0 flex-1 flex-col">{children}</div>;
  }

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col">
      <a
        href="#main-content"
        className="absolute left-4 top-4 z-[80] -translate-y-16 bg-ivory px-4 py-2 text-12 tracking-nav text-charcoal transition-transform focus:translate-y-0"
      >
        İçeriğe geç
      </a>
      <Navbar />
      <main id="main-content" className="min-w-0 flex-1">
        {children}
      </main>
      <Footer />
    </div>
  );
}
