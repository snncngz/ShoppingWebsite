import Link from "next/link";

export function EditorialBanner() {
  return (
    <section className="relative min-h-[50vh] overflow-hidden bg-charcoal lg:min-h-[60vh]">
      <div className="absolute inset-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/placeholders/kemer.svg"
          alt=""
          className="h-full w-full origin-[center_48%] scale-150 object-cover object-[center_48%]"
        />
        <div className="absolute inset-0 bg-black/45" />
      </div>

      <div className="relative mx-auto flex min-h-[50vh] max-w-7xl flex-col items-start justify-center px-6 py-24 lg:min-h-[60vh] lg:px-8">
        <p className="text-12 tracking-label text-ivory/75">Signature</p>
        <h2 className="mt-4 max-w-xl font-heading text-48 text-ivory lg:text-64">
          Find Your Signature
        </h2>
        <p className="mt-6 max-w-lg text-16 text-ivory/85">
          Discover pieces designed to become part of your everyday identity.
        </p>
        <Link
          href="/giyim"
          className="mt-8 inline-flex h-12 items-center justify-center bg-ivory px-8 text-12 tracking-nav text-black transition-colors hover:bg-off-white"
        >
          Keşfet
        </Link>
      </div>
    </section>
  );
}
