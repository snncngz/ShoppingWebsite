"use client";

import { useEffect, useId, useRef } from "react";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { X } from "lucide-react";

import { orderAddresses } from "@/data/orders";
import { useCatalog } from "@/context/CatalogContext";
import { useFocusTrap } from "@/lib/use-focus-trap";
import { formatOrderDate, formatOrderNumber, ORDER_STATUS_LABELS } from "@/lib/orders";
import { formatPrice } from "@/lib/utils";
import type { Order } from "@/types";

type OrderDetailModalProps = {
  order: Order | null;
  onClose: () => void;
};

export function OrderDetailModal({ order, onClose }: OrderDetailModalProps) {
  const { getById } = useCatalog();
  const reduceMotion = useReducedMotion();
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const isOpen = Boolean(order);
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
      {order ? (
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
            className="relative max-h-[90dvh] w-full max-w-lg overflow-y-auto border border-border bg-ivory p-8"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-12 tracking-label text-taupe">Sipariş</p>
                <h2 id={titleId} className="mt-2 font-heading text-24 text-black">
                  {formatOrderNumber(order.id)}
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

            <dl className="mt-6 flex flex-col gap-2 text-14">
              <div className="flex justify-between gap-4">
                <dt className="text-taupe">Tarih</dt>
                <dd>{formatOrderDate(order.createdAt)}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-taupe">Durum</dt>
                <dd>{ORDER_STATUS_LABELS[order.status]}</dd>
              </div>
            </dl>

            <ul className="mt-8 flex flex-col gap-4 border-t border-border pt-6">
              {order.items.map((item) => {
                const product = getById(item.productId);
                if (!product) {
                  return null;
                }

                return (
                  <li key={item.id} className="flex gap-4">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="h-20 w-16 bg-off-white object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="font-heading text-18 text-black">{product.name}</p>
                      <p className="mt-1 text-12 text-taupe">
                        {item.color}
                        {item.color && item.size ? " · " : ""}
                        {item.size} · {item.quantity} adet
                      </p>
                      <p className="mt-1 text-14 text-charcoal">
                        {formatPrice(product.price)}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>

            <dl className="mt-8 flex flex-col gap-2 border-t border-border pt-6 text-14">
              <div className="flex justify-between">
                <dt className="text-taupe">Ara Toplam</dt>
                <dd>{formatPrice(order.subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-taupe">Kargo</dt>
                <dd>
                  {order.shipping === 0
                    ? "Ücretsiz Kargo"
                    : formatPrice(order.shipping)}
                </dd>
              </div>
              <div className="flex justify-between pt-2 text-16 text-black">
                <dt>Toplam</dt>
                <dd>{formatPrice(order.total)}</dd>
              </div>
            </dl>

            {orderAddresses[order.id] ? (
              <div className="mt-8 border-t border-border pt-6">
                <p className="text-12 tracking-label text-taupe">Teslimat Adresi</p>
                <p className="mt-3 text-14 text-charcoal">
                  {orderAddresses[order.id]}
                </p>
              </div>
            ) : null}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
