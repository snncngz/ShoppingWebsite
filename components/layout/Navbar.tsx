"use client";

import { useEffect, useRef, useState } from "react";

import { motion, useReducedMotion } from "framer-motion";
import { Heart, Menu, Search, ShoppingBag, User } from "lucide-react";
import Link from "next/link";

import { MegaMenu } from "@/components/layout/MegaMenu";
import { MobileMenu } from "@/components/layout/MobileMenu";
import { SearchOverlay } from "@/components/search/SearchOverlay";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { BRAND_NAME } from "@/lib/constants";
import {
  desktopNavItems,
  megaMenus,
  type MegaMenuContent,
} from "@/lib/navigation";

const iconButtonClass =
  "relative flex h-11 w-11 items-center justify-center text-charcoal transition-colors hover:text-black";

export function Navbar() {
  const { itemCount } = useCart();
  const { count: wishlistCount } = useWishlist();
  const reduceMotion = useReducedMotion();
  const [scrolled, setScrolled] = useState(false);
  const [openMegaId, setOpenMegaId] = useState<MegaMenuContent["id"] | null>(
    null,
  );
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const closeTimer = useRef<number | null>(null);
  const headerRef = useRef<HTMLElement>(null);
  const megaOpenedAt = useRef(0);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 16);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 1024px)");
    const onChange = () => {
      if (media.matches) {
        setMobileOpen(false);
      } else {
        setOpenMegaId(null);
      }
    };

    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpenMegaId(null);
        setMobileOpen(false);
        setSearchOpen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      if (!headerRef.current?.contains(event.target as Node)) {
        setOpenMegaId(null);
      }
    };

    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  useEffect(() => {
    return () => {
      if (closeTimer.current) {
        window.clearTimeout(closeTimer.current);
      }
    };
  }, []);

  const cancelClose = () => {
    if (closeTimer.current) {
      window.clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  };

  const scheduleClose = () => {
    cancelClose();
    closeTimer.current = window.setTimeout(() => {
      setOpenMegaId(null);
    }, 140);
  };

  const openSearch = () => {
    setOpenMegaId(null);
    setMobileOpen(false);
    setSearchOpen(true);
  };

  const openMega = openMegaId ? megaMenus[openMegaId] : null;

  return (
    <>
      <header
        ref={headerRef}
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node)) {
            setOpenMegaId(null);
          }
        }}
        className={`sticky top-0 z-50 border-b border-border transition-[padding,background-color,box-shadow,backdrop-filter] duration-300 motion-reduce:transition-none ${
          scrolled
            ? "bg-ivory/85 shadow-sm backdrop-blur-md"
            : "bg-ivory"
        }`}
      >
        <div
          className={`mx-auto grid max-w-7xl grid-cols-[1fr_auto_1fr] items-center px-4 sm:px-6 lg:px-8 ${
            scrolled ? "py-2.5 lg:py-3" : "py-4 lg:py-6"
          }`}
        >
          <div className="flex items-center justify-start">
            <button
              type="button"
              className={`${iconButtonClass} lg:hidden`}
              aria-label="Menüyü aç"
              aria-expanded={mobileOpen}
              onClick={() => setMobileOpen(true)}
            >
              <Menu size={20} strokeWidth={1.4} />
            </button>
            <Link
              href="/"
              className="hidden font-heading text-24 tracking-[0.32em] text-black lg:inline-block"
            >
              {BRAND_NAME}
            </Link>
          </div>

          <Link
            href="/"
            className="font-heading text-24 tracking-[0.32em] text-black lg:hidden"
          >
            {BRAND_NAME}
          </Link>

          <nav
            className="hidden items-center justify-center gap-8 lg:flex"
            aria-label="Ana menü"
            onMouseLeave={scheduleClose}
            onMouseEnter={cancelClose}
          >
            {desktopNavItems.map((item) => {
              const mega = item.mega;
              const isActive = openMegaId === item.id;

              if (!mega) {
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    className="text-12 tracking-nav text-charcoal transition-colors hover:text-black"
                  >
                    {item.label}
                  </Link>
                );
              }

              return (
                <button
                  key={item.id}
                  type="button"
                  className={`text-12 tracking-nav transition-colors ${
                    isActive ? "text-black" : "text-charcoal hover:text-black"
                  }`}
                  aria-expanded={isActive}
                  aria-haspopup="menu"
                  onMouseEnter={() => {
                    cancelClose();
                    setOpenMegaId((current) => {
                      if (current !== mega.id) {
                        megaOpenedAt.current = Date.now();
                      }
                      return mega.id;
                    });
                  }}
                  onFocus={() => {
                    cancelClose();
                    setOpenMegaId(mega.id);
                  }}
                  onClick={() => {
                    cancelClose();
                    if (Date.now() - megaOpenedAt.current < 280) {
                      setOpenMegaId(mega.id);
                      return;
                    }
                    setOpenMegaId((current) =>
                      current === mega.id ? null : mega.id,
                    );
                  }}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          <div className="flex items-center justify-end gap-0.5 sm:gap-1">
            <button
              type="button"
              className={iconButtonClass}
              aria-label="Ara"
              aria-expanded={searchOpen}
              onClick={openSearch}
            >
              <Search size={18} strokeWidth={1.4} />
            </button>
            <Link
              href="/hesabim"
              className={`${iconButtonClass} hidden lg:flex`}
              aria-label="Hesabım"
            >
              <User size={18} strokeWidth={1.4} />
            </Link>
            <Link
              href="/favoriler"
              className={iconButtonClass}
              aria-label={
                wishlistCount > 0
                  ? `Favoriler, ${wishlistCount} ürün`
                  : "Favoriler"
              }
            >
              <Heart size={18} strokeWidth={1.4} />
              {wishlistCount > 0 ? (
                <motion.span
                  key={wishlistCount}
                  initial={reduceMotion ? false : { scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: reduceMotion ? 0 : 0.18 }}
                  className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-md bg-charcoal px-1 text-[10px] leading-none text-ivory"
                  aria-live="polite"
                >
                  {wishlistCount}
                </motion.span>
              ) : null}
            </Link>
            <Link
              href="/sepet"
              className={iconButtonClass}
              aria-label={itemCount > 0 ? `Sepet, ${itemCount} ürün` : "Sepet"}
            >
              <ShoppingBag size={18} strokeWidth={1.4} />
              {itemCount > 0 ? (
                <motion.span
                  key={itemCount}
                  initial={reduceMotion ? false : { scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: reduceMotion ? 0 : 0.18 }}
                  className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-md bg-charcoal px-1 text-[10px] leading-none text-ivory"
                  aria-live="polite"
                >
                  {itemCount}
                </motion.span>
              ) : null}
            </Link>
          </div>
        </div>

        <MegaMenu
          menu={openMega}
          isOpen={Boolean(openMega)}
          onMouseEnter={cancelClose}
          onMouseLeave={scheduleClose}
        />
      </header>

      <MobileMenu isOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
      <SearchOverlay isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
