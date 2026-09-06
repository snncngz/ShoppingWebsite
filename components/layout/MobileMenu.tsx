"use client";

import { useEffect, useId, useRef, useState } from "react";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronDown, X } from "lucide-react";
import Link from "next/link";

import { useCatalog } from "@/context/CatalogContext";
import { BRAND_NAME } from "@/lib/constants";
import { buildStorefrontNav } from "@/lib/catalog";
import { mobileUtilityLinks, type NavLink } from "@/lib/navigation";
import { useFocusTrap } from "@/lib/use-focus-trap";

type MobileMenuProps = {
  isOpen: boolean;
  onClose: () => void;
};

function MobileNavTree({
  items,
  onClose,
}: {
  items: NavLink[];
  onClose: () => void;
}) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const reduceMotion = useReducedMotion();

  return (
    <ul className="flex flex-col gap-3">
      {items.map((item) => {
        const key = `${item.href}-${item.label}`;
        const hasChildren = Boolean(item.children?.length);
        const isOpen = expanded === key;

        return (
          <li key={key}>
            <div className="flex items-center gap-2">
              <Link
                href={item.href}
                onClick={onClose}
                className="min-w-0 flex-1 text-16 text-charcoal transition-colors hover:text-accent"
              >
                {item.label}
              </Link>
              {hasChildren ? (
                <button
                  type="button"
                  aria-label={`${item.label} alt kategorileri`}
                  aria-expanded={isOpen}
                  onClick={() =>
                    setExpanded((current) => (current === key ? null : key))
                  }
                  className="flex h-11 w-11 items-center justify-center text-taupe"
                >
                  <motion.span
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: reduceMotion ? 0 : 0.22 }}
                  >
                    <ChevronDown size={16} strokeWidth={1.4} />
                  </motion.span>
                </button>
              ) : null}
            </div>
            {hasChildren && isOpen && item.children ? (
              <div className="mt-3 border-l border-border pl-4">
                <MobileNavTree items={item.children} onClose={onClose} />
              </div>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}

export function MobileMenu({ isOpen, onClose }: MobileMenuProps) {
  const { categories } = useCatalog();
  const [expanded, setExpanded] = useState<string | null>(null);
  const navItems = buildStorefrontNav(categories);
  const sections = navItems.filter((item) => item.mega);
  const extraCategories = navItems.filter((item) => !item.mega);
  const reduceMotion = useReducedMotion();
  const titleId = useId();
  const panelRef = useRef<HTMLElement>(null);
  useFocusTrap(isOpen, panelRef);

  useEffect(() => {
    if (!isOpen) {
      setExpanded(null);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          className="fixed inset-0 z-[60] lg:hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.28 }}
        >
          <button
            type="button"
            aria-label="Menüyü kapat"
            className="absolute inset-0 bg-black/20"
            onClick={onClose}
          />

          <motion.aside
            ref={panelRef}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            initial={reduceMotion ? { opacity: 1 } : { x: "-100%" }}
            animate={{ x: 0, opacity: 1 }}
            exit={reduceMotion ? { opacity: 0 } : { x: "-100%" }}
            transition={{
              duration: reduceMotion ? 0 : 0.38,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="absolute inset-y-0 left-0 flex h-dvh w-full flex-col bg-ivory sm:max-w-md sm:border-r sm:border-border"
          >
            <div className="flex items-center justify-between px-6 py-5">
              <button
                type="button"
                onClick={onClose}
                aria-label="Menüyü kapat"
                className="flex h-11 w-11 items-center justify-center text-charcoal"
              >
                <X size={20} strokeWidth={1.4} />
              </button>
              <p
                id={titleId}
                className="font-heading text-24 font-semibold tracking-[0.08em] text-black"
              >
                {BRAND_NAME}
              </p>
              <span className="h-11 w-11" aria-hidden="true" />
            </div>

            <nav className="flex-1 overflow-y-auto px-6 pb-8 pt-4">
              <ul className="flex flex-col">
                {sections.map((section) => {
                  const isExpanded = expanded === section.id;
                  const panelId = `${section.id}-panel`;

                  return (
                    <li key={section.id} className="border-b border-border">
                      <div className="flex items-center justify-between gap-2 py-5">
                        <Link
                          href={section.href}
                          onClick={onClose}
                className="min-w-0 flex-1 py-1 font-heading text-32 font-semibold tracking-[0.06em] text-black"
                        >
                          {section.label}
                        </Link>
                        <button
                          type="button"
                          aria-label={`${section.label} alt kategorileri`}
                          aria-expanded={isExpanded}
                          aria-controls={panelId}
                          onClick={() =>
                            setExpanded((current) =>
                              current === section.id ? null : section.id,
                            )
                          }
                          className="flex h-11 w-11 items-center justify-center text-taupe"
                        >
                          <motion.span
                            animate={{ rotate: isExpanded ? 180 : 0 }}
                            transition={{ duration: reduceMotion ? 0 : 0.22 }}
                          >
                            <ChevronDown size={20} strokeWidth={1.4} />
                          </motion.span>
                        </button>
                      </div>

                      <AnimatePresence initial={false}>
                        {isExpanded ? (
                          <motion.div
                            id={panelId}
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: reduceMotion ? 0 : 0.28 }}
                            className="overflow-hidden"
                          >
                            <div className="pb-6 pl-1">
                              <MobileNavTree
                                items={section.mega?.items ?? []}
                                onClose={onClose}
                              />
                            </div>
                          </motion.div>
                        ) : null}
                      </AnimatePresence>
                    </li>
                  );
                })}
                {extraCategories.map((item) => (
                  <li key={item.href} className="border-b border-border">
                    <Link
                      href={item.href}
                      onClick={onClose}
                      className="flex w-full items-center py-5 font-heading text-32 font-semibold tracking-[0.06em] text-black"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            <div className="border-t border-border px-6 py-8">
              <ul className="flex flex-col gap-4">
                {mobileUtilityLinks.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      onClick={onClose}
                      className="text-12 tracking-nav text-taupe transition-colors hover:text-black"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </motion.aside>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
