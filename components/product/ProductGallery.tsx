"use client";

import { useState } from "react";

import { ChevronLeft, ChevronRight } from "lucide-react";

type ProductGalleryProps = {
  images: string[];
  name: string;
  discountPercent?: number;
};

export function ProductGallery({
  images,
  name,
  discountPercent,
}: ProductGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const gallery = images.length > 0 ? images : [];
  const active = gallery[activeIndex] ?? gallery[0];
  const hasMultiple = gallery.length > 1;

  if (!active) {
    return <div className="aspect-[4/5] bg-off-white" />;
  }

  const show = (index: number) => {
    const total = gallery.length;
    setActiveIndex((index + total) % total);
  };

  return (
    <div>
      <div className="relative overflow-hidden bg-off-white aspect-[4/5]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={active}
          alt={name}
          className="h-full w-full object-cover object-center"
        />
        {discountPercent ? (
          <span className="pointer-events-none absolute left-3 top-3 z-10 bg-accent px-2 py-1 text-12 tracking-label text-ivory">
            İndirim %{discountPercent}
          </span>
        ) : null}

        {hasMultiple ? (
          <>
            <button
              type="button"
              aria-label="Önceki görsel"
              onClick={() => show(activeIndex - 1)}
              className="absolute left-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center bg-ivory/90 text-charcoal"
            >
              <ChevronLeft size={16} strokeWidth={1.4} />
            </button>
            <button
              type="button"
              aria-label="Sonraki görsel"
              onClick={() => show(activeIndex + 1)}
              className="absolute right-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center bg-ivory/90 text-charcoal"
            >
              <ChevronRight size={16} strokeWidth={1.4} />
            </button>
          </>
        ) : null}
      </div>

      {hasMultiple ? (
        <>
          <ul className="mt-4 hidden gap-3 sm:flex">
            {gallery.map((image, index) => (
              <li key={`${image}-${index}`}>
                <button
                  type="button"
                  onClick={() => setActiveIndex(index)}
                  aria-label={`Görsel ${index + 1}`}
                  aria-current={index === activeIndex}
                  className={`block h-20 w-16 overflow-hidden border ${
                    index === activeIndex ? "border-charcoal" : "border-border"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={image}
                    alt=""
                    aria-hidden
                    className="h-full w-full object-cover"
                  />
                </button>
              </li>
            ))}
          </ul>

          <div className="mt-4 flex justify-center gap-2 sm:hidden">
            {gallery.map((image, index) => (
              <button
                key={`${image}-dot-${index}`}
                type="button"
                aria-label={`Görsel ${index + 1}`}
                aria-current={index === activeIndex}
                onClick={() => setActiveIndex(index)}
                className="flex h-11 w-11 items-center justify-center"
              >
                <span
                  className={`h-2 w-2 rounded-md ${
                    index === activeIndex ? "bg-charcoal" : "bg-border"
                  }`}
                />
              </button>
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
