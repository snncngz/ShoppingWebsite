"use client";

import { useEffect, useId, useRef, useState } from "react";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { X } from "lucide-react";

import { useCart } from "@/context/CartContext";
import { useFocusTrap } from "@/lib/use-focus-trap";
import { getVariantConfig } from "@/lib/variants";
import type { Product } from "@/types";

type QuickAddModalProps = {
  product: Product;
  isOpen: boolean;
  onClose: () => void;
  onAdded: () => void;
};

export function QuickAddModal({
  product,
  isOpen,
  onClose,
  onAdded,
}: QuickAddModalProps) {
  const { addItem } = useCart();
  const reduceMotion = useReducedMotion();
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  useFocusTrap(isOpen, panelRef);
  const config = getVariantConfig(product);
  const [color, setColor] = useState<string | null>(
    config.colors.length === 1 ? config.colors[0] : null,
  );
  const [option, setOption] = useState<string | null>(
    config.options.length === 1 ? config.options[0] : null,
  );

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const next = getVariantConfig(product);
    setColor(next.colors.length === 1 ? next.colors[0] : null);
    setOption(next.options.length === 1 ? next.options[0] : null);
  }, [isOpen, product]);

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

  const needsColor = config.colors.length > 0;
  const needsOption = config.options.length > 0;
  const canAdd =
    (!needsColor || Boolean(color)) && (!needsOption || Boolean(option));

  const handleAdd = () => {
    if (!canAdd) {
      return;
    }

    addItem({
      productId: product.id,
      color: color ?? "",
      size: option ?? "",
      quantity: 1,
    });
    onAdded();
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center sm:px-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.24 }}
        >
          <button
            type="button"
            aria-label="Kapat"
            className="absolute inset-0 bg-black/20"
            onClick={onClose}
          />
          <motion.div
            ref={panelRef}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 12 }}
            className="relative w-full max-w-md border border-border bg-ivory p-8"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-12 tracking-label text-taupe">
                  {product.category}
                </p>
                <h2 id={titleId} className="mt-2 font-heading text-24 text-black">
                  {product.name}
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Kapat"
                className="flex h-11 w-11 items-center justify-center text-charcoal"
              >
                <X size={18} strokeWidth={1.4} />
              </button>
            </div>

            {needsColor ? (
              <fieldset className="mt-8">
                <legend className="text-12 tracking-label text-black">Renk</legend>
                <div className="mt-3 flex flex-wrap gap-2">
                  {config.colors.map((value) => {
                    const selected = color === value;
                    return (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setColor(value)}
                        aria-pressed={selected}
                        className={`h-12 px-4 text-12 tracking-nav ${
                          selected
                            ? "border border-charcoal bg-charcoal text-ivory"
                            : "border border-border text-charcoal hover:border-taupe"
                        }`}
                      >
                        {value}
                      </button>
                    );
                  })}
                </div>
              </fieldset>
            ) : null}

            {needsOption ? (
              <fieldset className="mt-6">
                <legend className="text-12 tracking-label text-black">
                  {config.optionLabel}
                </legend>
                <div className="mt-3 flex flex-wrap gap-2">
                  {config.options.map((value) => {
                    const selected = option === value;
                    return (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setOption(value)}
                        aria-pressed={selected}
                        className={`h-12 min-w-12 px-4 text-12 tracking-nav ${
                          selected
                            ? "border border-charcoal bg-charcoal text-ivory"
                            : "border border-border text-charcoal hover:border-taupe"
                        }`}
                      >
                        {value}
                      </button>
                    );
                  })}
                </div>
              </fieldset>
            ) : null}

            {!canAdd ? (
              <p className="mt-6 text-12 text-taupe">
                Sepete eklemek için {config.optionLabel.toLowerCase()}
                {needsColor ? " ve renk" : ""} seçin.
              </p>
            ) : null}

            <button
              type="button"
              onClick={handleAdd}
              disabled={!canAdd}
              className="mt-8 inline-flex h-12 w-full items-center justify-center bg-charcoal px-8 text-12 tracking-nav text-ivory transition-colors hover:bg-black disabled:cursor-not-allowed disabled:bg-taupe"
            >
              Sepete Ekle
            </button>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
