import Link from "next/link";

import { BRAND_MEDIA } from "@/lib/brandMedia";

export function Hero() {
  return (
    <section className="relative min-h-[85vh] overflow-hidden bg-black lg:min-h-[92vh]">
      <div className="absolute inset-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={BRAND_MEDIA.hero}
          alt="Lucien Perrin Precious Extrait şişeleri, duman ve altın ışık"
          className="h-full w-full object-cover object-[78%_center] sm:object-[70%_center] lg:object-[62%_center]"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/70 to-black/15 lg:via-black/55 lg:to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/25" />
      </div>

      <div className="relative mx-auto flex min-h-[85vh] max-w-7xl flex-col justify-end px-6 pb-16 pt-32 lg:min-h-[92vh] lg:justify-center lg:px-8 lg:pb-24 lg:pt-28">
        <div className="max-w-xl">
          <p className="text-12 tracking-label text-ivory/75">Parfüm özü</p>
          <h1 className="mt-4 font-heading text-48 leading-none text-ivory lg:text-64">
            Zamansız koku.
          </h1>
          <p className="mt-6 max-w-md text-16 text-ivory/85">
            Özenle harmanlanmış extrait’ler — cilde yakın, her günün parçası
            olacak sakin bir lüks.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
            <Link
              href="/parfum"
              className="inline-flex h-12 items-center justify-center bg-ivory px-8 text-12 tracking-nav text-black transition-colors hover:bg-off-white"
            >
              Alışverişe Başla
            </Link>
            <Link
              href="/yeni-gelenler"
              className="inline-flex h-12 items-center justify-center border border-ivory/70 px-8 text-12 tracking-nav text-ivory transition-colors hover:border-ivory hover:bg-ivory/10"
            >
              Koleksiyonu Keşfet
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
