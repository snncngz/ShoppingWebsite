import Link from "next/link";

import { BRAND_MEDIA } from "@/lib/brandMedia";

export function EditorialBanner() {
  return (
    <section className="relative min-h-[55vh] overflow-hidden bg-charcoal lg:min-h-[70vh]">
      <div className="absolute inset-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={BRAND_MEDIA.editorial}
          alt="Gün batımında Lucien Perrin extrait"
          className="h-full w-full object-cover object-[center_35%]"
        />
        <div className="absolute inset-0 bg-black/45" />
      </div>

      <div className="relative mx-auto flex min-h-[55vh] max-w-7xl flex-col items-start justify-center px-6 py-24 lg:min-h-[70vh] lg:px-8">
        <p className="text-12 tracking-label text-ivory/75">Signature</p>
        <h2 className="mt-4 max-w-xl font-heading text-48 text-ivory lg:text-64">
          Find Your Signature
        </h2>
        <p className="mt-6 max-w-lg text-16 text-ivory/85">
          Bir extrait, tek bir jest. Ciltte kalan, bağırgan olmayan bir imza.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/parfum"
            className="inline-flex h-12 items-center justify-center bg-ivory px-8 text-12 tracking-nav text-black transition-colors hover:bg-off-white"
          >
            Alışverişe Başla
          </Link>
          <Link
            href="/parfum"
            className="inline-flex h-12 items-center justify-center border border-ivory/70 px-8 text-12 tracking-nav text-ivory transition-colors hover:border-ivory hover:bg-ivory/10"
          >
            Tüm Parfümler
          </Link>
        </div>
      </div>
    </section>
  );
}
