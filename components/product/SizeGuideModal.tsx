"use client";

import { useEffect, useId } from "react";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { X } from "lucide-react";

const SIZE_ROWS = [
  { size: "S", chest: "88–92", waist: "72–76", length: "168–172" },
  { size: "M", chest: "92–96", waist: "76–80", length: "172–176" },
  { size: "L", chest: "96–100", waist: "80–84", length: "176–180" },
  { size: "XL", chest: "100–106", waist: "84–90", length: "180–184" },
  { size: "XXL", chest: "106–112", waist: "90–96", length: "184–188" },
] as const;

type SizeGuideModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function SizeGuideModal({ isOpen, onClose }: SizeGuideModalProps) {
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
          className="fixed inset-0 z-[60] flex items-center justify-center px-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduceMotion ? 0.12 : 0.24 }}
        >
          <button
            type="button"
            aria-label="Beden rehberini kapat"
            className="absolute inset-0 bg-black/20"
            onClick={onClose}
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 8 }}
            className="relative w-full max-w-lg border border-border bg-ivory p-8"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-12 tracking-label text-taupe">Guide</p>
                <h2 id={titleId} className="mt-2 font-heading text-32 text-black">
                  Beden Rehberi
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Kapat"
                className="flex h-8 w-8 items-center justify-center text-charcoal"
              >
                <X size={18} strokeWidth={1.4} />
              </button>
            </div>

            <p className="mt-4 text-14 text-taupe">
              Ölçüler santimetre cinsindendir. Demo tablo; vücut ölçünüze en yakın
              bedeni seçin.
            </p>

            <div className="mt-8 overflow-x-auto">
              <table className="w-full min-w-[320px] text-left text-14">
                <thead>
                  <tr className="border-b border-border text-12 tracking-label text-taupe">
                    <th className="py-3 font-normal">Beden</th>
                    <th className="py-3 font-normal">Göğüs</th>
                    <th className="py-3 font-normal">Bel</th>
                    <th className="py-3 font-normal">Boy</th>
                  </tr>
                </thead>
                <tbody>
                  {SIZE_ROWS.map((row) => (
                    <tr key={row.size} className="border-b border-border text-charcoal">
                      <td className="py-3">{row.size}</td>
                      <td className="py-3">{row.chest}</td>
                      <td className="py-3">{row.waist}</td>
                      <td className="py-3">{row.length}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
