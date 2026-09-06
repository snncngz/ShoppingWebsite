"use client";

import { useEffect, useId, useRef } from "react";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { CreditCard, Minus, Plus, Trash2, X } from "lucide-react";
import Link from "next/link";

import { useCart } from "@/context/CartContext";
import { useCatalog } from "@/context/CatalogContext";
import { displayPricing, toPricedProduct } from "@/lib/pricing";
import { useFocusTrap } from "@/lib/use-focus-trap";
import { formatPrice } from "@/lib/utils";

type CartDrawerProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
  const reduceMotion = useReducedMotion();
  const titleId = useId();
  const panelRef = useRef<HTMLElement>(null);
  useFocusTrap(isOpen, panelRef);
  const { items, incrementItem, decrementItem, removeItem, itemCount } = useCart();
  const { getById } = useCatalog();

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

  const lines = items
    .map((item) => {
      const product = getById(item.productId);
      return product ? { item, product } : null;
    })
    .filter((line): line is NonNullable<typeof line> => Boolean(line));

  const total = lines.reduce((sum, line) => {
    const unit = displayPricing(toPricedProduct(line.product), line.item.size).price;
    return sum + unit * line.item.quantity;
  }, 0);

  return (
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          className="fixed inset-0 z-[70]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.24 }}
        >
          <button
            type="button"
            aria-label="Sepeti kapat"
            className="absolute inset-0 bg-black/35"
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
              duration: reduceMotion ? 0 : 0.36,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="absolute inset-y-0 right-0 flex h-dvh w-full max-w-md flex-col bg-ivory shadow-xl"
          >
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <h2 id={titleId} className="font-heading text-24 text-black">
                Sepetim ({itemCount})
              </h2>
              <button
                type="button"
                aria-label="Kapat"
                onClick={onClose}
                className="flex h-11 w-11 items-center justify-center text-charcoal"
              >
                <X size={22} strokeWidth={1.4} />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto">
              {lines.length === 0 ? (
                <p className="px-5 py-16 text-center text-14 text-taupe">
                  Sepetiniz boş.
                </p>
              ) : (
                <ul>
                  {lines.map(({ item, product }) => {
                    const pricing = displayPricing(
                      toPricedProduct(product),
                      item.size,
                    );
                    const current = pricing.discountPercent
                      ? pricing.price
                      : pricing.listPrice;
                    const compareAt = pricing.discountPercent
                      ? pricing.listPrice
                      : pricing.oldPrice && pricing.oldPrice > current
                        ? pricing.oldPrice
                        : undefined;

                    return (
                      <li
                        key={item.id}
                        className="flex gap-3 border-b border-border px-5 py-4"
                      >
                        <Link
                          href={`/urun/${product.slug}`}
                          onClick={onClose}
                          className="h-24 w-20 shrink-0 overflow-hidden bg-off-white"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={product.images[0]}
                            alt={product.name}
                            className="h-full w-full object-cover"
                          />
                        </Link>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <Link
                              href={`/urun/${product.slug}`}
                              onClick={onClose}
                              className="min-w-0"
                            >
                              <p className="truncate text-14 font-medium text-black">
                                {product.name}
                              </p>
                              <p className="mt-1 text-12 text-taupe">
                                {item.color ? `COLOR ${item.color}` : ""}
                                {item.color && item.size ? " · " : ""}
                                {item.size ? `SIZE ${item.size}` : ""}
                              </p>
                            </Link>
                            <button
                              type="button"
                              aria-label="Kaldır"
                              onClick={() => removeItem(item.id)}
                              className="flex h-9 w-9 items-center justify-center text-taupe hover:text-black"
                            >
                              <Trash2 size={16} strokeWidth={1.4} />
                            </button>
                          </div>
                          <div className="mt-3 flex items-end justify-between gap-3">
                            <div className="inline-flex items-center gap-3 text-14 text-charcoal">
                              <button
                                type="button"
                                aria-label="Azalt"
                                onClick={() => decrementItem(item.id)}
                              >
                                <Minus size={14} strokeWidth={1.4} />
                              </button>
                              <span>{item.quantity}</span>
                              <button
                                type="button"
                                aria-label="Artır"
                                onClick={() => incrementItem(item.id)}
                              >
                                <Plus size={14} strokeWidth={1.4} />
                              </button>
                            </div>
                            <div className="text-right">
                              {compareAt ? (
                                <p className="text-12 text-taupe line-through">
                                  {formatPrice(compareAt * item.quantity)}
                                </p>
                              ) : null}
                              <p className="text-14 text-black">
                                {formatPrice(current * item.quantity)}
                              </p>
                              <Link
                                href={`/urun/${product.slug}`}
                                onClick={onClose}
                                className="text-12 text-taupe underline underline-offset-4"
                              >
                                Düzenle
                              </Link>
                            </div>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            <div className="border-t border-border">
              <Link
                href="/checkout"
                onClick={onClose}
                className="mx-5 mt-4 inline-flex h-12 w-[calc(100%-2.5rem)] items-center justify-center gap-2 border border-charcoal bg-ivory text-12 tracking-nav text-black"
              >
                <CreditCard size={16} strokeWidth={1.4} />
                Ödeme adımına git
              </Link>
              <div className="mt-4 flex items-center justify-between bg-charcoal px-5 py-4 text-ivory">
                <p className="text-14">
                  Toplam{" "}
                  <span className="font-medium">{formatPrice(total)}</span>
                </p>
                <Link
                  href="/sepet"
                  onClick={onClose}
                  className="text-12 tracking-nav"
                >
                  Sepete git →
                </Link>
              </div>
            </div>
          </motion.aside>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
