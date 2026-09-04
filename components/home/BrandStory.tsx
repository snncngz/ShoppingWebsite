import Link from "next/link";

import { BRAND_MEDIA } from "@/lib/brandMedia";

export function BrandStory() {
  return (
    <section className="bg-off-white px-6 py-24 lg:px-8 lg:py-32">
      <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-2 lg:gap-24">
        <div className="max-w-lg lg:order-1">
          <p className="text-12 tracking-label text-taupe">Maison</p>
          <h2 className="mt-3 font-heading text-32 text-black lg:text-48">
            Sessiz bir imza
          </h2>
          <p className="mt-6 text-16 text-charcoal">
            Lucien Perrin, parfümü günlük bir ritüel olarak ele alır. Her
            extrait ölçülü, kalıcı ve cilde yakın — yüksek sesle konuşmak
            zorunda kalmayan bir lüks.
          </p>
          <p className="mt-4 text-16 text-charcoal">
            Odun, amber, çiçek ve misk aynı hizada durduğunda koku bir aksesuar
            değil, tarzın kendisi olur.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/parfum"
              className="inline-flex h-12 items-center justify-center bg-charcoal px-8 text-12 tracking-nav text-ivory transition-colors hover:bg-black"
            >
              Alışverişe Başla
            </Link>
            <Link
              href="/hakkimizda"
              className="inline-flex h-12 items-center justify-center border border-charcoal px-8 text-12 tracking-nav text-charcoal transition-colors hover:bg-charcoal hover:text-ivory"
            >
              Hakkımızda
            </Link>
          </div>
        </div>

        <div className="relative aspect-[4/5] overflow-hidden bg-ivory lg:order-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={BRAND_MEDIA.story}
            alt="Kum ve odun üzerinde Lucien Perrin extrait"
            className="h-full w-full object-cover"
          />
        </div>
      </div>
    </section>
  );
}
