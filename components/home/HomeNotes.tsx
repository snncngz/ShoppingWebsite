import Link from "next/link";

import { BRAND_MEDIA } from "@/lib/brandMedia";

export function HomeNotes() {
  return (
    <section className="bg-off-white px-6 py-24 lg:px-8 lg:py-28">
      <div className="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-2 lg:gap-16">
        <div className="grid grid-cols-2 gap-4">
          <div className="aspect-[3/4] overflow-hidden bg-ivory">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={BRAND_MEDIA.portrait}
              alt="Lucien Perrin extrait, kadın portresi"
              className="h-full w-full object-cover"
            />
          </div>
          <div className="mt-10 aspect-[3/4] overflow-hidden bg-ivory">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={BRAND_MEDIA.citrus}
              alt="Turunçgiller arasında Lucien Perrin extrait şişesi"
              className="h-full w-full object-cover"
            />
          </div>
        </div>

        <div className="max-w-lg">
          <p className="text-12 tracking-label text-taupe">Notalar</p>
          <h2 className="mt-3 font-heading text-32 text-black lg:text-48">
            Ciltte kalan bir iz
          </h2>
          <p className="mt-6 text-16 text-charcoal">
            Üst notada ışık, kalpte derinlik, dipte amber ve odun. Her şişe aynı
            sessiz dilde konuşur.
          </p>
          <Link
            href="/parfum"
            className="mt-8 inline-flex h-12 items-center justify-center border border-charcoal px-8 text-12 tracking-nav text-charcoal transition-colors hover:bg-charcoal hover:text-ivory"
          >
            Koleksiyonu Keşfet
          </Link>
        </div>
      </div>
    </section>
  );
}
