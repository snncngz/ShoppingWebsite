"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";

import { Search } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { useRecentSearches } from "@/components/search/useRecentSearches";
import { getAdminErrorMessage } from "@/lib/adminApi";
import { getSearchHref, normalizeSearchQuery, SEARCH_DEBOUNCE_MS } from "@/lib/search";
import { fetchStorefrontProductPage } from "@/lib/storefrontApi";
import type { Product } from "@/types";

type HeaderSearchProps = {
  className?: string;
};

export function HeaderSearch({ className = "" }: HeaderSearchProps) {
  const router = useRouter();
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const { remember } = useRecentSearches();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const trimmed = normalizeSearchQuery(query);

  useEffect(() => {
    if (!trimmed) {
      setResults([]);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    setLoading(true);

    const timer = window.setTimeout(() => {
      void fetchStorefrontProductPage({
        search: trimmed,
        limit: 6,
        sort: "newest",
      })
        .then((data) => {
          if (controller.signal.aborted) {
            return;
          }
          setResults(data.items);
          setLoading(false);
        })
        .catch((caught) => {
          if (controller.signal.aborted) {
            return;
          }
          setResults([]);
          setLoading(false);
          console.warn(getAdminErrorMessage(caught));
        });
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [trimmed]);

  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  const goToSearch = (term = trimmed) => {
    if (!term) {
      return;
    }
    remember(term);
    setOpen(false);
    router.push(getSearchHref(term));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    goToSearch();
  };

  const showPanel = open && trimmed.length > 0;

  return (
    <div ref={rootRef} className={`relative min-w-0 ${className}`}>
      <form onSubmit={handleSubmit}>
        <label htmlFor={inputId} className="sr-only">
          Ara
        </label>
        <div className="flex h-10 items-center gap-2 rounded-full border border-border bg-off-white px-3">
          <Search size={16} strokeWidth={1.8} className="shrink-0 text-charcoal" />
          <input
            ref={inputRef}
            id={inputId}
            type="search"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            placeholder="Ara"
            autoComplete="off"
            className="min-w-0 flex-1 bg-transparent text-14 text-charcoal outline-none placeholder:text-taupe [&::-webkit-search-cancel-button]:hidden [&::-webkit-search-decoration]:hidden"
          />
        </div>
      </form>

      {showPanel ? (
        <div className="absolute left-0 right-0 z-[60] mt-2 max-h-[70vh] overflow-y-auto border border-border bg-ivory p-3 shadow-md lg:left-auto lg:w-80">
          {loading ? (
            <p className="px-2 py-3 text-12 tracking-label text-taupe">Yükleniyor</p>
          ) : results.length === 0 ? (
            <p className="px-2 py-3 text-14 text-taupe">Sonuç yok</p>
          ) : (
            <ul className="flex flex-col gap-1">
              {results.map((product) => (
                <li key={product.id}>
                  <Link
                    href={`/urun/${product.slug}`}
                    onClick={() => {
                      remember(trimmed);
                      setOpen(false);
                    }}
                    className="flex items-center gap-3 px-2 py-2 text-14 text-charcoal hover:bg-off-white"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={product.images[0]}
                      alt=""
                      className="h-12 w-10 shrink-0 object-cover"
                    />
                    <span className="min-w-0 truncate font-heading text-16 font-semibold text-black">
                      {product.name}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
