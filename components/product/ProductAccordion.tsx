"use client";

import { useState } from "react";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronDown } from "lucide-react";

type AccordionItem = {
  id: string;
  title: string;
  body: string;
};

type ProductAccordionProps = {
  items: AccordionItem[];
};

export function ProductAccordion({ items }: ProductAccordionProps) {
  const [openId, setOpenId] = useState<string | null>(items[0]?.id ?? null);
  const reduceMotion = useReducedMotion();

  return (
    <div className="border-t border-border">
      {items.map((item) => {
        const isOpen = openId === item.id;

        return (
          <div key={item.id} className="border-b border-border">
            <button
              type="button"
              aria-expanded={isOpen}
              aria-controls={`${item.id}-panel`}
              id={`${item.id}-trigger`}
              onClick={() => setOpenId(isOpen ? null : item.id)}
              className="flex min-h-11 w-full items-center justify-between py-5 text-left"
            >
              <span className="text-12 tracking-label text-black">{item.title}</span>
              <motion.span
                animate={{ rotate: isOpen ? 180 : 0 }}
                transition={{ duration: reduceMotion ? 0 : 0.2 }}
                className="text-taupe"
              >
                <ChevronDown size={16} strokeWidth={1.4} />
              </motion.span>
            </button>
            <AnimatePresence initial={false}>
              {isOpen ? (
                <motion.div
                  id={`${item.id}-panel`}
                  role="region"
                  aria-labelledby={`${item.id}-trigger`}
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: reduceMotion ? 0 : 0.24 }}
                  className="overflow-hidden"
                >
                  <p className="pb-5 text-14 text-charcoal">{item.body}</p>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
