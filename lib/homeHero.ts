/**
 * Homepage hero slides. Replace files in /public/home/hero to change the look.
 * Keep ids stable; only swap `src` / `alt` / `href`.
 */
export type HomeHeroSlide = {
  id: string;
  src: string;
  alt: string;
  href: string;
};

export const HOME_HERO_INTERVAL_MS = 4500;

export const HOME_HERO_SLIDES: HomeHeroSlide[] = [
  {
    id: "etiketin-yarisi",
    src: "/home/hero/01-etiketin-yarisi.jpg",
    alt: "Kampanya görseli",
    href: "/yeni-gelenler",
  },
  {
    id: "erken-kis",
    src: "/home/hero/02-erken-kis.jpg",
    alt: "Sezon görseli",
    href: "/cok-satanlar",
  },
  {
    id: "tek-beden",
    src: "/home/hero/03-tek-beden.jpg",
    alt: "Koleksiyon görseli",
    href: "/parfum",
  },
  {
    id: "yeni-gelenler",
    src: "/home/hero/04-yeni-gelenler.jpg",
    alt: "Yeni gelenler",
    href: "/yeni-gelenler",
  },
  {
    id: "look-bomber",
    src: "/home/hero/05-look-bomber.jpg",
    alt: "Look 1",
    href: "/tshirt",
  },
  {
    id: "look-pantolon",
    src: "/home/hero/06-look-pantolon.jpg",
    alt: "Look 2",
    href: "/pantolon",
  },
  {
    id: "look-esofman",
    src: "/home/hero/07-look-esofman.jpg",
    alt: "Look 3",
    href: "/esofman",
  },
  {
    id: "look-tisort",
    src: "/home/hero/08-look-tisort.jpg",
    alt: "Look 4",
    href: "/tshirt",
  },
];
