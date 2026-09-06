"use client";

import { useCallback, useEffect, useRef, useState, type PointerEvent } from "react";

import { useReducedMotion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

import { HOME_HERO_INTERVAL_MS, HOME_HERO_SLIDES } from "@/lib/homeHero";

function isControlTarget(target: EventTarget | null): boolean {
  return Boolean(
    target instanceof HTMLElement && target.closest("button, a[data-hero-control]"),
  );
}

export function Hero() {
  const slides = HOME_HERO_SLIDES;
  const total = slides.length;
  const [index, setIndex] = useState(0);
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const pointerStart = useRef<{ x: number; id: number } | null>(null);
  const swiped = useRef(false);
  const paused = useRef(false);
  const reduceMotion = useReducedMotion();

  const go = useCallback(
    (next: number) => {
      if (total === 0) {
        return;
      }
      setIndex(((next % total) + total) % total);
    },
    [total],
  );

  useEffect(() => {
    if (total < 2 || reduceMotion) {
      return;
    }
    const timer = window.setInterval(() => {
      if (paused.current || document.hidden) {
        return;
      }
      setIndex((current) => (current + 1) % total);
    }, HOME_HERO_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [reduceMotion, total]);

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (isControlTarget(event.target)) {
      return;
    }
    pointerStart.current = { x: event.clientX, id: event.pointerId };
    swiped.current = false;
    paused.current = true;
  };

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!pointerStart.current) {
      return;
    }
    const delta = event.clientX - pointerStart.current.x;
    if (!dragging && Math.abs(delta) > 12) {
      setDragging(true);
      event.currentTarget.setPointerCapture(event.pointerId);
    }
    if (Math.abs(delta) > 12) {
      setDragX(delta);
    }
  };

  const onPointerUp = (event: PointerEvent<HTMLDivElement>) => {
    if (!pointerStart.current) {
      return;
    }
    const delta = event.clientX - pointerStart.current.x;
    pointerStart.current = null;
    setDragging(false);
    setDragX(0);
    paused.current = false;
    if (Math.abs(delta) > 48) {
      swiped.current = true;
      go(delta < 0 ? index + 1 : index - 1);
    }
  };

  if (total === 0) {
    return null;
  }

  const offset = dragging ? dragX : 0;

  return (
    <section
      className="relative overflow-hidden bg-black"
      onMouseEnter={() => {
        paused.current = true;
      }}
      onMouseLeave={() => {
        paused.current = false;
      }}
    >
      <div
        className="relative mx-auto w-full max-w-[1600px]"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <div className="relative aspect-[3/4] w-full sm:aspect-[16/9] lg:aspect-[2/1]">
          <div
            className={`flex h-full ${dragging ? "" : "transition-transform duration-500 ease-out"}`}
            style={{ transform: `translateX(calc(${-index * 100}% + ${offset}px))` }}
          >
            {slides.map((slide) => (
              <Link
                key={slide.id}
                href={slide.href}
                className="relative h-full w-full shrink-0 bg-black"
                draggable={false}
                onClick={(event) => {
                  if (swiped.current) {
                    event.preventDefault();
                    swiped.current = false;
                  }
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={slide.src}
                  alt={slide.alt}
                  draggable={false}
                  className="h-full w-full object-cover object-center sm:object-contain"
                />
              </Link>
            ))}
          </div>

          {total > 1 ? (
            <>
              <button
                type="button"
                aria-label="Önceki görsel"
                onPointerDown={(event) => event.stopPropagation()}
                onClick={() => go(index - 1)}
                className="absolute left-3 top-1/2 z-20 flex h-12 w-12 -translate-y-1/2 items-center justify-center bg-ivory/90 text-charcoal"
              >
                <ChevronLeft size={20} strokeWidth={1.8} />
              </button>
              <button
                type="button"
                aria-label="Sonraki görsel"
                onPointerDown={(event) => event.stopPropagation()}
                onClick={() => go(index + 1)}
                className="absolute right-3 top-1/2 z-20 flex h-12 w-12 -translate-y-1/2 items-center justify-center bg-ivory/90 text-charcoal"
              >
                <ChevronRight size={20} strokeWidth={1.8} />
              </button>
              <div className="absolute inset-x-0 bottom-4 z-20 flex justify-center gap-2">
                {slides.map((slide, slideIndex) => (
                  <button
                    key={slide.id}
                    type="button"
                    aria-label={`Görsel ${slideIndex + 1}`}
                    aria-current={slideIndex === index}
                    onPointerDown={(event) => event.stopPropagation()}
                    onClick={() => go(slideIndex)}
                    className={`h-2 rounded-full transition-[width,background-color] ${
                      slideIndex === index ? "w-8 bg-ivory" : "w-2 bg-ivory/50"
                    }`}
                  />
                ))}
              </div>
            </>
          ) : null}
        </div>
      </div>
    </section>
  );
}
