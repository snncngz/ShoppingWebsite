"use client";

import { ArrowUpRight } from "lucide-react";
import Link from "next/link";

import { useCatalog } from "@/context/CatalogContext";
import { getVisibleCategories, isStorefrontHrefVisible } from "@/lib/catalog";

const categories = [
  {
    name: "Parfüm",
    href: "/parfum",
    image: "/placeholders/parfum.svg",
    imageClass: "object-center",
    frameClass: "aspect-[3/4]",
    offsetClass: "",
  },
  {
    name: "T-Shirt",
    href: "/tshirt",
    image: "/placeholders/tshirt.svg",
    imageClass: "object-[center_38%]",
    frameClass: "aspect-[4/5]",
    offsetClass: "lg:mt-12",
  },
  {
    name: "Pantolon",
    href: "/pantolon",
    image: "/placeholders/pantolon.svg",
    imageClass: "object-top",
    frameClass: "aspect-[3/4]",
    offsetClass: "",
  },
  {
    name: "Aksesuar",
    href: "/aksesuar",
    image: "/placeholders/aksesuar.svg",
    imageClass: "object-center",
    frameClass: "aspect-[4/5]",
    offsetClass: "lg:mt-12",
  },
] as const;

export function CategoryGrid() {
  const { store } = useCatalog();
  const featured = categories
    .filter((category) => isStorefrontHrefVisible(category.href, store))
    .map((category) => {
      const match = getVisibleCategories(store).find(
        (item) => item.href === category.href,
      );
      return {
        ...category,
        name: match?.title ?? category.name,
      };
    });
  const extras = getVisibleCategories(store)
    .filter((category) => category.origin === "new")
    .map((category, index) => ({
      name: category.title,
      href: category.href,
      image: category.image,
      imageClass: "object-center",
      frameClass: "aspect-[4/5]",
      offsetClass: index % 2 === 1 ? "lg:mt-12" : "",
    }));
  const cards = [...featured, ...extras];

  if (cards.length === 0) {
    return null;
  }

  return (
    <section className="bg-ivory px-6 py-24 lg:px-8 lg:py-32">
      <div className="mx-auto max-w-7xl">
        <p className="text-12 tracking-label text-taupe">Shop</p>
        <h2 className="mt-3 font-heading text-32 text-black lg:text-48">
          Kategoriye Göre
        </h2>

        <ul className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:mt-16 lg:grid-cols-4 lg:gap-8">
          {cards.map((category) => (
            <li key={category.href} className={category.offsetClass}>
              <Link href={category.href} className="group block">
                <div
                  className={`relative overflow-hidden bg-off-white ${category.frameClass}`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={category.image}
                    alt={`${category.name} kategorisi`}
                    className={`h-full w-full ${category.imageClass} object-cover transition-transform duration-700 ease-out group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100`}
                  />
                  <div className="absolute inset-0 bg-black/15 transition-colors duration-500 group-hover:bg-black/35" />
                  <div className="absolute inset-x-0 bottom-0 flex items-end justify-between px-6 py-6">
                    <span className="translate-y-0 font-heading text-24 text-ivory transition-transform duration-500 group-hover:-translate-y-1">
                      {category.name}
                    </span>
                    <ArrowUpRight
                      size={18}
                      strokeWidth={1.4}
                      className="text-ivory opacity-0 transition-all duration-500 group-hover:opacity-100"
                    />
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
