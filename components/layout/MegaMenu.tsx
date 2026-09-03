"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import Link from "next/link";

import type { MegaMenuContent } from "@/lib/navigation";

type MegaMenuProps = {
  menu: MegaMenuContent | null;
  isOpen: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
};

export function MegaMenu({ menu, isOpen, onMouseEnter, onMouseLeave }: MegaMenuProps) {
  const reduceMotion = useReducedMotion();

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
          <div className="mx-auto grid max-w-6xl grid-cols-[1fr_280px] gap-16 px-8 py-12 xl:px-12">
            <ul className="flex flex-col justify-center gap-5">
              {menu.items.map((item) => (
                <li key={`${item.href}-${item.label}`}>
                  <Link
                    href={item.href}
                    role="menuitem"
                    className="font-heading text-24 text-black transition-colors duration-200 hover:text-accent"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>

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
