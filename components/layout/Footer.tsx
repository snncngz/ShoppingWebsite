"use client";

import Link from "next/link";

import { NewsletterSubscribeForm } from "@/components/newsletter/SubscribeForm";
import { useCatalog } from "@/context/CatalogContext";
import { buildStorefrontNav } from "@/lib/catalog";
import { BRAND_NAME } from "@/lib/constants";
import { footerColumns } from "@/lib/navigation";

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden fill="none" stroke="currentColor" strokeWidth="1.4">
      <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.2" cy="6.8" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  );
}

function TikTokIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden fill="currentColor">
      <path d="M14.2 3h2.2c.2 1.9 1.5 3.5 3.4 4.1v2.3c-1.2 0-2.3-.4-3.2-1v6.6c0 3.3-2.7 6-6 6s-6-2.7-6-6 2.7-6 6-6c.3 0 .6 0 .9.1v2.4c-.3-.1-.6-.1-.9-.1-2 0-3.6 1.6-3.6 3.6s1.6 3.6 3.6 3.6 3.6-1.6 3.6-3.6V3z" />
    </svg>
  );
}

const socialLinks = [
  {
    label: "Instagram",
    href: "https://www.instagram.com/lucienperrintr/",
    icon: InstagramIcon,
  },
  {
    label: "TikTok",
    href: "https://www.tiktok.com/@lucienperrintr",
    icon: TikTokIcon,
  },
] as const;

export function Footer() {
  const { categories } = useCatalog();
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
              <p className="text-12 tracking-label text-charcoal">
                Yeniliklerden İlk Siz Haberdar Olun!
              </p>
              <p className="mt-2 text-14 text-taupe">
                Özel promosyonlar, kişiye özel indirimler ve son yenilikler ile ilgili
                bilgi alabilmek için e-posta listemize kaydolun.
              </p>
              <div className="mt-3">
                <NewsletterSubscribeForm inputId="newsletter-email" />
              </div>
            </div>

            <ul className="mt-8 flex items-center gap-4">
              {socialLinks.map((social) => (
                <li key={social.label}>
                  <a
                    href={social.href}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={social.label}
                    className="flex h-11 w-11 items-center justify-center text-charcoal transition-colors hover:text-black"
                  >
                    <social.icon />
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
                  {(column.title === "Mağaza"
                    ? [
                        ...buildStorefrontNav(categories)
                          .filter((item) => !["yeni-gelenler", "cok-satanlar"].includes(item.id))
                          .map((item) => ({ label: item.label, href: item.href })),
                        { label: "Yeni Gelenler", href: "/yeni-gelenler" },
                        { label: "Çok Satanlar", href: "/cok-satanlar" },
                      ]
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
          <p className="tracking-nav">Butik</p>
        </div>
      </div>
    </footer>
  );
}
