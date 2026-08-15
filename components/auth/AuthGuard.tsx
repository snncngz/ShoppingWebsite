"use client";

import { useEffect, type ReactNode } from "react";

import { useRouter } from "next/navigation";

import { useAuth } from "@/context/AuthContext";

type AuthGuardProps = {
  children: ReactNode;
};

export function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const { isLoading, isLoggedIn } = useAuth();

  useEffect(() => {
    if (!isLoading && !isLoggedIn) {
      router.replace("/giris");
    }
  }, [isLoading, isLoggedIn, router]);

  if (isLoading || !isLoggedIn) {
    return (
      <section className="bg-ivory px-6 py-24 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <p className="text-12 tracking-label text-taupe">Hesap</p>
        </div>
      </section>
    );
  }

  return children;
}
