"use client";

import { useCallback, useEffect, useRef, useState, type PointerEvent } from "react";

import { useReducedMotion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

import { HOME_HERO_INTERVAL_MS, HOME_HERO_SLIDES } from "@/lib/homeHero";

export function Hero() {
  const slides = HOME_HERO_SLIDES;
  const total = slides.length;
  const [index, setIndex] = useState(0);
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const pointerStart = useRef<{ x: number; y: number } | null>(null);
  const paused = useRef(false);
  const reduceMotion = useReducedMotion();

  const go = useCallback(
    (next: number) => {
      if (total === 0) {
        return;
      }
      setIndex((current) => (next + total) % total);
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
    pointerStart.current = { x: event.clientX, y: event.clientY };
    setDragging(true);
    paused.current = true;
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!pointerStart.current) {
      return;
    }
    setDragX(event.clientX - pointerStart.current.x);
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
        className="relative aspect-[3/4] w-full touch-pan-y sm:aspect-[16/9] lg:aspect-[21/9]"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <div
          className={`flex h-full ${dragging ? "" : "transition-transform duration-500 ease-out"}`}
          style={{ transform: `translateX(calc(${-index * 100}% + ${offset}px))` }}
        >
          {slides.map((slide) => (
            <Link
              key={slide.id}
              href={slide.href}
              className="relative h-full w-full shrink-0"
              draggable={false}
              onClick={(event) => {
                if (Math.abs(offset) > 12) {
                  event.preventDefault();
                }
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={slide.src}
                alt={slide.alt}
                draggable={false}
                className="h-full w-full object-cover object-center"
              />
            </Link>
          ))}
        </div>

        {total > 1 ? (
          <>
            <button
              type="button"
              aria-label="Önceki görsel"
              onClick={() => go(index - 1)}
              className="absolute left-3 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center bg-ivory/85 text-charcoal"
            >
              <ChevronLeft size={18} strokeWidth={1.8} />
            </button>
            <button
              type="button"
              aria-label="Sonraki görsel"
              onClick={() => go(index + 1)}
              className="absolute right-3 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center bg-ivory/85 text-charcoal"
            >
              <ChevronRight size={18} strokeWidth={1.8} />
            </button>
            <div className="absolute inset-x-0 bottom-4 z-10 flex justify-center gap-2">
              {slides.map((slide, slideIndex) => (
                <button
                  key={slide.id}
                  type="button"
                  aria-label={`Görsel ${slideIndex + 1}`}
                  aria-current={slideIndex === index}
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
    </section>
  );
}
