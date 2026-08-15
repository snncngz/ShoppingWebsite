"use client";

import { useEffect, useId } from "react";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { X } from "lucide-react";

import { SearchPanel } from "@/components/search/SearchPanel";

type SearchOverlayProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function SearchOverlay({ isOpen, onClose }: SearchOverlayProps) {
  const reduceMotion = useReducedMotion();
  const titleId = useId();

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
          className="fixed inset-0 z-[70] bg-ivory"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{
            duration: reduceMotion ? 0.12 : 0.28,
            ease: [0.22, 1, 0.36, 1],
          }}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
        >
          <motion.div
            className="mx-auto flex h-dvh max-w-3xl flex-col px-6 lg:px-8"
            initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 8 }}
            transition={{
              duration: reduceMotion ? 0.12 : 0.32,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            <div className="flex items-center justify-between py-5">
              <p
                id={titleId}
                className="text-12 tracking-label text-taupe"
              >
                Arama
              </p>
              <button
                type="button"
                onClick={onClose}
                aria-label="Aramayı kapat"
                className="flex h-10 w-10 items-center justify-center text-charcoal transition-colors hover:text-black"
              >
                <X size={20} strokeWidth={1.4} />
              </button>
            </div>
            <SearchPanel
              variant="overlay"
              autoFocus
              onClose={onClose}
            />
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
