"use client";

import { useEffect, type ReactNode } from "react";

import { useRouter } from "next/navigation";

import { AccountSkeleton } from "@/components/ui/Skeleton";
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
    return <AccountSkeleton />;
  }

  return children;
}
