import Link from "next/link";

export function BrandStory() {
  return (
    <section className="bg-off-white px-6 py-24 lg:px-8 lg:py-32">
      <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-2 lg:gap-24">
        <div className="max-w-lg lg:order-1">
          <p className="text-12 tracking-label text-taupe">Maison</p>
          <h2 className="mt-3 font-heading text-32 text-black lg:text-48">
            Detaylarda Saklı Bir Tarz
          </h2>
          <p className="mt-6 text-16 text-charcoal">
            Lucien Perrin, giyim, parfüm ve aksesuarı aynı sessiz lüks dilinde
            birleştiren modern bir butik. Her parça günlük ritüelin bir parçası
            olacak kadar sade; koleksiyonda yerini dolduracak kadar özenli.
          </p>
          <p className="mt-4 text-16 text-charcoal">
            Form, doku ve koku aynı hizada durduğunda tarz yüksek sesle
            konuşmak zorunda kalmaz.
          </p>
          <Link
            href="/hakkimizda"
            className="mt-8 inline-flex h-12 items-center justify-center border border-charcoal px-8 text-12 tracking-nav text-charcoal transition-colors hover:bg-charcoal hover:text-ivory"
          >
            Hakkımızda
          </Link>
        </div>

        <div className="relative aspect-[4/5] overflow-hidden bg-ivory lg:order-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/placeholders/pantolon.svg"
            alt="Lucien Perrin pantolon silueti"
            className="h-full w-full object-cover object-top lg:scale-105 lg:object-[center_12%]"
          />
        </div>
      </div>
    </section>
  );
}
