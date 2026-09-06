"use client";

import { useEffect, useRef, useState } from "react";

import { motion, useReducedMotion } from "framer-motion";
import { Heart, Menu, ShoppingBag, User } from "lucide-react";
import Link from "next/link";

import { CartDrawer } from "@/components/cart/CartDrawer";
import { MegaMenu } from "@/components/layout/MegaMenu";
import { MobileMenu } from "@/components/layout/MobileMenu";
import { HeaderSearch } from "@/components/search/HeaderSearch";
import { useCart } from "@/context/CartContext";
import { useCatalog } from "@/context/CatalogContext";
import { useWishlist } from "@/context/WishlistContext";
import { FREE_SHIPPING_THRESHOLD } from "@/lib/cart";
import { BRAND_NAME } from "@/lib/constants";
import { buildStorefrontNav } from "@/lib/catalog";
import { formatPrice } from "@/lib/utils";

const iconButtonClass =
  "relative flex h-11 w-11 items-center justify-center text-charcoal transition-colors hover:text-black";

export function Navbar() {
  const { itemCount } = useCart();
  const { count: wishlistCount } = useWishlist();
  const { categories } = useCatalog();
  const navItems = buildStorefrontNav(categories);
  const reduceMotion = useReducedMotion();
  const [scrolled, setScrolled] = useState(false);
  const [openMegaId, setOpenMegaId] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
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
        setCartOpen(false);
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

  const openCart = () => {
    setOpenMegaId(null);
    setMobileOpen(false);
    setCartOpen(true);
  };

  const openMega = navItems.find((item) => item.id === openMegaId)?.mega ?? null;
  const shippingCopy = `${formatPrice(FREE_SHIPPING_THRESHOLD)} ve üzeri alışverişlerde ücretsiz kargo`;

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
          scrolled ? "bg-ivory/85 shadow-sm backdrop-blur-md" : "bg-ivory"
        }`}
      >
        <div
          className={`mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 ${
            scrolled ? "py-2.5 lg:py-3" : "py-3 lg:py-5"
          }`}
        >
          <div className="grid grid-cols-[2.75rem_minmax(0,1fr)_auto] items-center gap-2 lg:grid-cols-[1fr_auto_1fr]">
            <div className="flex items-center">
              <button
                type="button"
                className={`${iconButtonClass} lg:hidden`}
                aria-label="Menüyü aç"
                aria-expanded={mobileOpen}
                onClick={() => setMobileOpen(true)}
              >
                <Menu size={20} strokeWidth={1.8} />
              </button>
            </div>

            <Link
              href="/"
              className="min-w-0 justify-self-center truncate text-center font-heading text-[22px] font-semibold tracking-[0.08em] text-black sm:text-24 sm:tracking-[0.16em] lg:text-32 lg:font-bold lg:tracking-[0.2em]"
            >
              {BRAND_NAME}
            </Link>

            <div className="flex items-center justify-end gap-0.5 sm:gap-1">
              <HeaderSearch className="hidden w-56 lg:block lg:w-64" />
              <Link href="/hesabim" className={iconButtonClass} aria-label="Hesabım">
                <User size={18} strokeWidth={1.8} />
              </Link>
              <Link
                href="/favoriler"
                className={`${iconButtonClass} hidden sm:flex`}
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
            <button
              type="button"
              className={iconButtonClass}
              aria-label={itemCount > 0 ? `Sepet, ${itemCount} ürün` : "Sepet"}
              onClick={openCart}
            >
              <ShoppingBag size={18} strokeWidth={1.4} />
              {itemCount > 0 ? (
                <motion.span
                  key={itemCount}
                  initial={reduceMotion ? false : { scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: reduceMotion ? 0 : 0.18 }}
                  className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-charcoal px-1 text-[10px] leading-none text-ivory"
                  aria-live="polite"
                >
                  {itemCount}
                </motion.span>
              ) : null}
            </button>
          </div>
          </div>
          <div className="pt-2 lg:hidden">
            <HeaderSearch />
          </div>
        </div>

        <nav
          className="hidden items-center justify-center gap-8 border-t border-border px-8 py-3 lg:flex"
          aria-label="Ana menü"
          onMouseLeave={scheduleClose}
          onMouseEnter={cancelClose}
        >
          {navItems.map((item) => {
            const mega = item.mega;
            const isActive = openMegaId === item.id;

            if (!mega) {
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className="text-14 font-semibold tracking-nav text-charcoal transition-colors hover:text-black"
                >
                  {item.label}
                </Link>
              );
            }

            return (
              <Link
                key={item.id}
                href={item.href}
                className={`text-14 font-semibold tracking-nav transition-colors ${
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
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <MegaMenu
          menu={openMega}
          isOpen={Boolean(openMega)}
          onMouseEnter={cancelClose}
          onMouseLeave={scheduleClose}
        />

        <div className="overflow-hidden bg-warm-beige/55 py-2">
          <p className="text-center text-12 tracking-label text-charcoal">
            {shippingCopy}
          </p>
        </div>
      </header>

      <MobileMenu isOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
      <CartDrawer isOpen={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  );
}
