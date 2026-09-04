import Link from "next/link";

import { BRAND_MEDIA } from "@/lib/brandMedia";

const featured = [
  {
    href: "/parfum",
    label: "Alışverişe Başla",
    kicker: "Boutique",
    image: BRAND_MEDIA.shopStart,
    alt: "Havuz kenarında Lucien Perrin parfüm şişesi",
    frame: "lg:col-span-7 aspect-[4/5] sm:aspect-[16/10] lg:aspect-[5/4]",
  },
  {
    href: "/yeni-gelenler",
    label: "Koleksiyonu Keşfet",
    kicker: "Just In",
    image: BRAND_MEDIA.collection,
    alt: "Kıyıda Lucien Perrin extrait şişesi",
    frame: "lg:col-span-5 aspect-[4/5] lg:aspect-auto lg:h-full lg:min-h-[28rem]",
  },
] as const;

const trails = [
  {
    href: "/parfum/womens",
    label: "Kadın Kokuları",
    kicker: "Women’s",
    image: BRAND_MEDIA.women,
    alt: "Lucien Perrin kadın extrait portresi",
  },
  {
    href: "/parfum/mens",
    label: "Erkek Kokuları",
    kicker: "Men’s",
    image: BRAND_MEDIA.men,
    alt: "Lucien Perrin erkek extrait portresi",
  },
  {
    href: "/cok-satanlar",
    label: "Çok Satanlar",
    kicker: "Bestsellers",
    image: BRAND_MEDIA.stillLife,
    alt: "Kumda Lucien Perrin extrait şişesi",
  },
] as const;

export function HomeShopPaths() {
  return (
    <section className="bg-ivory px-6 py-24 lg:px-8 lg:py-32">
      <div className="mx-auto max-w-7xl">
        <p className="text-12 tracking-label text-taupe">Parfüm</p>
        <h2 className="mt-3 max-w-2xl font-heading text-32 text-black lg:text-48">
          Koleksiyona gir
        </h2>
        <p className="mt-4 max-w-xl text-16 text-charcoal">
          Maison’un extrait’leri. Cilde yakın imzalar, günün ritüeline sakin bir
          iz.
        </p>

        <div className="mt-12 grid items-stretch gap-4 lg:mt-16 lg:grid-cols-12 lg:gap-6">
          {featured.map((path) => (
            <PathCard
              key={path.href}
              href={path.href}
              label={path.label}
              kicker={path.kicker}
              image={path.image}
              alt={path.alt}
              className={path.frame}
            />
          ))}
        </div>

        <ul className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3 lg:mt-6 lg:gap-6">
          {trails.map((path) => (
            <li key={path.href}>
              <PathCard
                href={path.href}
                label={path.label}
                kicker={path.kicker}
                image={path.image}
                alt={path.alt}
                className="aspect-[4/5]"
              />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function PathCard({
  href,
  label,
  kicker,
  image,
  alt,
  className,
}: {
  href: string;
  label: string;
  kicker: string;
  image: string;
  alt: string;
  className: string;
}) {
  return (
    <Link href={href} className={`group relative block overflow-hidden bg-charcoal ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={image}
        alt={alt}
        className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent transition-colors duration-500 group-hover:from-black/80" />
      <div className="absolute inset-x-0 bottom-0 p-6 lg:p-8">
        <p className="text-12 tracking-label text-ivory/70">{kicker}</p>
        <p className="mt-2 font-heading text-24 text-ivory lg:text-32">{label}</p>
      </div>
    </Link>
  );
}
