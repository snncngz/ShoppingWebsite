"use client";

import { useState, type FormEvent, type ReactNode } from "react";

import { LayoutDashboard, LogOut, Package, Store, Tag, Truck } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { logoutRequest } from "@/lib/authApi";
import { BRAND_NAME } from "@/lib/constants";

const links = [
  { href: "/admin", label: "Panel", icon: LayoutDashboard },
  { href: "/admin/urunler", label: "Ürünler", icon: Package },
  { href: "/admin/kategoriler", label: "Kategoriler", icon: Tag },
  { href: "/admin/siparisler", label: "Siparişler", icon: Truck },
] as const;

export function AdminShell({
  email,
  children,
}: {
  email: string;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [pending, setPending] = useState(false);

  const handleLogout = async () => {
    setPending(true);
    try {
      await logoutRequest();
    } finally {
      router.replace("/admin/giris");
      router.refresh();
    }
  };

  return (
    <div className="flex min-h-screen bg-ivory">
      <aside className="hidden w-64 shrink-0 border-r border-border bg-off-white lg:flex lg:flex-col">
        <div className="border-b border-border px-6 py-6">
          <p className="font-heading text-18 tracking-[0.24em] text-black">
            {BRAND_NAME}
          </p>
          <p className="mt-2 text-12 tracking-label text-taupe">Admin</p>
        </div>
        <nav className="flex flex-1 flex-col gap-1 px-4 py-6" aria-label="Admin">
          {links.map((link) => {
            const active =
              link.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(link.href);
            const Icon = link.icon;

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`inline-flex min-h-11 items-center gap-3 px-3 text-14 ${
                  active ? "bg-charcoal text-ivory" : "text-charcoal hover:bg-warm-beige/40"
                }`}
              >
                <Icon size={16} strokeWidth={1.4} />
                {link.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-border px-4 py-6">
          <p className="truncate px-3 text-12 text-taupe">{email}</p>
          <Link
            href="/"
            className="mt-3 inline-flex min-h-11 w-full items-center gap-3 px-3 text-14 text-charcoal hover:bg-warm-beige/40"
          >
            <Store size={16} strokeWidth={1.4} />
            Mağazaya dön
          </Link>
          <button
            type="button"
            disabled={pending}
            onClick={() => {
              void handleLogout();
            }}
            className="inline-flex min-h-11 w-full items-center gap-3 px-3 text-14 text-charcoal hover:bg-warm-beige/40"
          >
            <LogOut size={16} strokeWidth={1.4} />
            Çıkış
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between gap-4 border-b border-border px-4 py-4 lg:px-8">
          <nav className="flex gap-2 overflow-x-auto lg:hidden" aria-label="Admin">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="inline-flex h-11 shrink-0 items-center px-3 text-12 tracking-nav text-charcoal"
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="hidden lg:block">
            <p className="text-12 tracking-label text-taupe">Yönetim</p>
          </div>
          <div className="flex items-center gap-2 lg:hidden">
            <Link
              href="/"
              className="inline-flex h-11 items-center px-3 text-12 tracking-nav text-charcoal"
            >
              Mağaza
            </Link>
            <button
              type="button"
              disabled={pending}
              onClick={() => {
                void handleLogout();
              }}
              className="inline-flex h-11 items-center px-3 text-12 tracking-nav text-charcoal"
            >
              Çıkış
            </button>
          </div>
        </header>
        <div className="min-w-0 flex-1 px-4 py-8 lg:px-8">{children}</div>
      </div>
    </div>
  );
}
