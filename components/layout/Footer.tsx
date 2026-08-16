"use client";

import { Camera, CirclePlay, Globe } from "lucide-react";
import Link from "next/link";

import { useCatalog } from "@/context/CatalogContext";
import { filterNavLinks } from "@/lib/catalog";
import { BRAND_NAME } from "@/lib/constants";
import { footerColumns } from "@/lib/navigation";

const socialLinks = [
  { label: "Instagram", href: "#", icon: Camera },
  { label: "Facebook", href: "#", icon: Globe },
  { label: "YouTube", href: "#", icon: CirclePlay },
] as const;

export function Footer() {
  const { store } = useCatalog();
  return (
    <footer className="mt-auto border-t border-border bg-off-white">
      <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8 lg:py-24">
        <div className="grid gap-12 lg:grid-cols-[1.2fr_2fr] lg:gap-16">
          <div className="max-w-sm">
            <p className="font-heading text-32 tracking-[0.18em] text-black">
              {BRAND_NAME}
            </p>
            <p className="mt-4 text-14 text-taupe">
              Sakin lüks. Özenle seçilmiş siluetler ve zamansız butik parçalar.
            </p>

            <div className="mt-8">
              <label
                htmlFor="newsletter-email"
                className="text-12 tracking-label text-charcoal"
              >
                Newsletter
              </label>
              <div className="mt-3 flex gap-2">
                <input
                  id="newsletter-email"
                  type="email"
                  name="email"
                  placeholder="E-posta adresiniz"
                  autoComplete="email"
                  className="h-11 w-full rounded-sm border border-border bg-ivory px-3 text-14 text-charcoal outline-none placeholder:text-taupe focus:border-taupe"
                />
                <button
                  type="button"
                  className="h-11 shrink-0 rounded-sm bg-charcoal px-5 text-12 tracking-nav text-ivory transition-colors hover:bg-black"
                >
                  Abone Ol
                </button>
              </div>
            </div>

            <ul className="mt-8 flex items-center gap-4">
              {socialLinks.map((social) => (
                <li key={social.label}>
                  <a
                    href={social.href}
                    aria-label={social.label}
                    className="flex h-11 w-11 items-center justify-center text-charcoal transition-colors hover:text-black"
                  >
                    <social.icon size={18} strokeWidth={1.4} />
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="grid grid-cols-2 gap-10 sm:grid-cols-4">
            {footerColumns.map((column) => (
              <div key={column.title}>
                <p className="text-12 tracking-label text-black">{column.title}</p>
                <ul className="mt-5 flex flex-col gap-3">
                  {(column.title === "Shop"
                    ? filterNavLinks(column.links, store)
                    : column.links
                  ).map((link) => (
                    <li key={`${link.href}-${link.label}`}>
                      <Link
                        href={link.href}
                        className="text-14 text-taupe transition-colors hover:text-charcoal"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-16 flex flex-col gap-2 border-t border-border pt-8 text-12 text-taupe sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} {BRAND_NAME}</p>
          <p className="tracking-nav">Est. Boutique</p>
        </div>
      </div>
    </footer>
  );
}
