"use client";

import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";

export function Hero() {
  const reduceMotion = useReducedMotion();

  return (
    <section className="relative min-h-[85vh] overflow-hidden bg-charcoal lg:min-h-[90vh]">
      <div className="absolute inset-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/placeholders/canta.svg"
          alt="VELORA sezon koleksiyonu, çanta detayı"
          className="h-full w-full origin-center scale-125 object-cover object-[center_28%]"
        />
        <div className="absolute inset-0 bg-black/40" />
      </div>

      <div className="relative mx-auto flex min-h-[85vh] max-w-7xl flex-col justify-end px-6 pb-16 pt-32 lg:min-h-[90vh] lg:px-8 lg:pb-24">
        <motion.div
          initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.85, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-xl"
        >
          <p className="text-12 tracking-label text-ivory/80">New Season</p>
          <h1 className="mt-4 font-heading text-48 leading-none text-ivory lg:text-64">
            TIMELESS STYLE.
          </h1>
          <p className="mt-6 max-w-md text-16 text-ivory/85">
            Özenle seçilmiş siluetler, parfüm ve aksesuar — her günün parçası
            olacak sakin bir lüks.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
            <Link
              href="/giyim"
              className="inline-flex h-12 items-center justify-center bg-ivory px-8 text-12 tracking-nav text-black transition-colors hover:bg-off-white"
            >
              Koleksiyonu Keşfet
            </Link>
            <Link
              href="/cok-satanlar"
              className="inline-flex h-12 items-center justify-center border border-ivory/70 px-8 text-12 tracking-nav text-ivory transition-colors hover:border-ivory hover:bg-ivory/10"
            >
              Çok Satanlar
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
