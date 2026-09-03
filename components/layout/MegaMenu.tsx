"use client";

import { useEffect, useState } from "react";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import Link from "next/link";

import type { MegaMenuContent, NavLink } from "@/lib/navigation";

type MegaMenuProps = {
  menu: MegaMenuContent | null;
  isOpen: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
};

function MegaLinkList({ items }: { items: NavLink[] }) {
  const [activeHref, setActiveHref] = useState<string | null>(null);
  const active = items.find((item) => item.href === activeHref);
  const nested = active?.children ?? [];

  return (
    <div className="flex min-w-0 gap-16">
      <ul className="flex flex-col justify-center gap-5">
        {items.map((item) => {
          const hasChildren = Boolean(item.children?.length);
          const isActive = activeHref === item.href && hasChildren;

          return (
            <li
              key={`${item.href}-${item.label}`}
              onMouseEnter={() => setActiveHref(item.href)}
              onFocus={() => setActiveHref(item.href)}
            >
              <Link
                href={item.href}
                role="menuitem"
                aria-haspopup={hasChildren ? "menu" : undefined}
                aria-expanded={hasChildren ? isActive : undefined}
                className={`inline-flex items-center gap-2 font-heading text-24 transition-colors duration-200 ${
                  isActive ? "text-accent" : "text-black hover:text-accent"
                }`}
              >
                {item.label}
                {hasChildren ? (
                  <ChevronRight size={16} strokeWidth={1.4} className="text-taupe" />
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>
      {nested.length > 0 ? (
        <MegaLinkList key={activeHref} items={nested} />
      ) : null}
    </div>
  );
}

export function MegaMenu({ menu, isOpen, onMouseEnter, onMouseLeave }: MegaMenuProps) {
  const reduceMotion = useReducedMotion();
  const [menuKey, setMenuKey] = useState(menu?.id ?? "closed");

  useEffect(() => {
    setMenuKey(menu?.id ?? "closed");
  }, [menu?.id]);

  return (
    <AnimatePresence>
      {isOpen && menu ? (
        <motion.div
          key={menu.id}
          role="menu"
          aria-label={`${menu.label} menüsü`}
          initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -8 }}
          transition={{ duration: reduceMotion ? 0 : 0.28, ease: [0.22, 1, 0.36, 1] }}
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
          className="absolute inset-x-0 top-full z-40 hidden border-b border-border bg-ivory/95 shadow-sm backdrop-blur-md lg:block"
        >
          <div className="mx-auto grid max-w-6xl grid-cols-[minmax(0,1fr)_280px] gap-16 px-8 py-12 xl:px-12">
            <MegaLinkList key={menuKey} items={menu.items} />

            <div className="relative overflow-hidden rounded-sm border border-border bg-off-white">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={menu.image.src}
                alt={menu.image.alt}
                className="h-64 w-full object-cover"
              />
              <p className="absolute bottom-4 left-0 right-0 text-center text-12 tracking-label text-taupe">
                {menu.image.caption}
              </p>
            </div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
