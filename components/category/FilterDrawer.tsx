"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { X } from "lucide-react";

import { useFocusTrap } from "@/lib/use-focus-trap";

type FilterDrawerProps = {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
};

export function FilterDrawer({ isOpen, onClose, children }: FilterDrawerProps) {
  const reduceMotion = useReducedMotion();
  const titleId = useId();
  const panelRef = useRef<HTMLElement>(null);
  useFocusTrap(isOpen, panelRef);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen, onClose]);

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
            aria-label="Filtreleri kapat"
            className="absolute inset-0 bg-black/20"
            onClick={onClose}
          />

          <motion.aside
            ref={panelRef}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            initial={reduceMotion ? { opacity: 1 } : { x: "100%" }}
            animate={{ x: 0, opacity: 1 }}
            exit={reduceMotion ? { opacity: 0 } : { x: "100%" }}
            transition={{
              duration: reduceMotion ? 0 : 0.38,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="absolute inset-y-0 right-0 flex h-dvh w-full flex-col bg-ivory sm:max-w-md sm:border-l sm:border-border"
          >
            <div className="flex items-center justify-between border-b border-border px-6 py-5">
              <p id={titleId} className="text-12 tracking-label text-black">
                Filtrele
              </p>
              <button
                type="button"
                onClick={onClose}
                aria-label="Filtreleri kapat"
                className="flex h-11 w-11 items-center justify-center text-charcoal"
              >
                <X size={18} strokeWidth={1.4} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 pb-12">{children}</div>
          </motion.aside>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
