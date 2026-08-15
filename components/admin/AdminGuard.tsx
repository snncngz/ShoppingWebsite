"use client";

import { useEffect, useState, type ReactNode } from "react";

import { usePathname, useRouter } from "next/navigation";

import { AdminShell } from "@/components/admin/AdminShell";
import { isAdminLoggedIn } from "@/lib/adminStore";

export function AdminGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!isAdminLoggedIn()) {
      router.replace("/admin/giris");
      return;
    }

    setReady(true);
  }, [router]);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ivory">
        <p className="text-12 tracking-label text-taupe">Yükleniyor</p>
      </div>
    );
  }

  return children;
}

export function AdminFrame({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  if (pathname === "/admin/giris") {
    return children;
  }

  return (
    <AdminGuard>
      <AdminShell>{children}</AdminShell>
    </AdminGuard>
  );
}
