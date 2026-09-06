"use client";

import { useRef, useState, type PointerEvent } from "react";

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
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const pointerStart = useRef<{ x: number; y: number } | null>(null);
  const gallery = images.length > 0 ? images : [];
  const hasMultiple = gallery.length > 1;
  const total = gallery.length;

  if (gallery.length === 0) {
    return <div className="aspect-[4/5] bg-off-white" />;
  }

  const show = (next: number) => {
    setActiveIndex(((next % total) + total) % total);
  };

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (!hasMultiple) {
      return;
    }
    pointerStart.current = { x: event.clientX, y: event.clientY };
    setDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!pointerStart.current) {
      return;
    }
    setDragX(event.clientX - pointerStart.current.x);
  };

  const endDrag = (event: PointerEvent<HTMLDivElement>) => {
    if (!pointerStart.current) {
      return;
    }
    const delta = event.clientX - pointerStart.current.x;
    pointerStart.current = null;
    setDragging(false);
    setDragX(0);
    if (Math.abs(delta) > 40) {
      show(delta < 0 ? activeIndex + 1 : activeIndex - 1);
    }
  };

  return (
    <div>
      <div
        className="relative overflow-hidden bg-off-white aspect-[4/5] touch-pan-y"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        <div
          className={`flex h-full ${dragging ? "" : "transition-transform duration-300 ease-out"}`}
          style={{
            transform: `translateX(calc(${-activeIndex * 100}% + ${dragging ? dragX : 0}px))`,
          }}
        >
          {gallery.map((image, imageIndex) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={`${image}-${imageIndex}`}
              src={image}
              alt={imageIndex === activeIndex ? name : ""}
              draggable={false}
              className="h-full w-full shrink-0 object-cover object-center"
            />
          ))}
        </div>
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
              className="absolute left-2 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center bg-ivory/90 text-charcoal sm:left-3 sm:h-11 sm:w-11"
            >
              <ChevronLeft size={18} strokeWidth={1.8} />
            </button>
            <button
              type="button"
              aria-label="Sonraki görsel"
              onClick={() => show(activeIndex + 1)}
              className="absolute right-2 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center bg-ivory/90 text-charcoal sm:right-3 sm:h-11 sm:w-11"
            >
              <ChevronRight size={18} strokeWidth={1.8} />
            </button>
          </>
        ) : null}
      </div>

      {hasMultiple ? (
        <>
          <ul className="mt-4 hidden gap-3 sm:flex">
            {gallery.map((image, imageIndex) => (
              <li key={`${image}-${imageIndex}`}>
                <button
                  type="button"
                  onClick={() => setActiveIndex(imageIndex)}
                  aria-label={`Görsel ${imageIndex + 1}`}
                  aria-current={imageIndex === activeIndex}
                  className={`block h-20 w-16 overflow-hidden border ${
                    imageIndex === activeIndex ? "border-charcoal" : "border-border"
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
            {gallery.map((image, imageIndex) => (
              <button
                key={`${image}-dot-${imageIndex}`}
                type="button"
                aria-label={`Görsel ${imageIndex + 1}`}
                aria-current={imageIndex === activeIndex}
                onClick={() => setActiveIndex(imageIndex)}
                className="flex h-11 w-11 items-center justify-center"
              >
                <span
                  className={`h-2 w-2 rounded-md ${
                    imageIndex === activeIndex ? "bg-charcoal" : "bg-border"
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
