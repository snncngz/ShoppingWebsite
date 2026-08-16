"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";

import { useRouter } from "next/navigation";

import { RecentSearches } from "@/components/search/RecentSearches";
import { SearchResults } from "@/components/search/SearchResults";
import { useRecentSearches } from "@/components/search/useRecentSearches";
import { useCatalog } from "@/context/CatalogContext";
import { getAdminErrorMessage } from "@/lib/adminApi";
import {
  getSearchHref,
  normalizeSearchQuery,
  POPULAR_SEARCHES,
  SEARCH_DEBOUNCE_MS,
} from "@/lib/search";
import { fetchStorefrontProductPage } from "@/lib/storefrontApi";
import type { Product } from "@/types";

type SearchPanelProps = {
  initialQuery?: string;
  variant: "overlay" | "page";
  autoFocus?: boolean;
  onClose?: () => void;
};

export function SearchPanel({
  initialQuery = "",
  variant,
  autoFocus = false,
  onClose,
}: SearchPanelProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const { terms, remember } = useRecentSearches();
  const { categories } = useCatalog();
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const trimmed = normalizeSearchQuery(query);
  const popularSearches = POPULAR_SEARCHES.filter((term) => {
    const needle = term.toLocaleLowerCase("tr-TR");
    const match = categories.find(
      (category) =>
        category.name.toLocaleLowerCase("tr-TR") === needle ||
        category.title.toLocaleLowerCase("tr-TR") === needle,
    );
    return !match?.hidden;
  });

  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  useEffect(() => {
    if (!autoFocus) {
      return;
    }

    inputRef.current?.focus();
  }, [autoFocus]);

  useEffect(() => {
    if (!trimmed) {
      setResults([]);
      setLoading(false);
      setError("");
      return;
    }

    const controller = new AbortController();
    setLoading(true);
    setError("");

    const timer = window.setTimeout(() => {
      void fetchStorefrontProductPage({
        search: trimmed,
        limit: variant === "overlay" ? 8 : 20,
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
          setError(getAdminErrorMessage(caught));
          setLoading(false);
        });
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [trimmed, variant]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!trimmed) {
      return;
    }

    remember(trimmed);
    router.push(getSearchHref(trimmed));
    onClose?.();
  };

  const handleResultClick = () => {
    if (!trimmed) {
      return;
    }

    remember(trimmed);
    onClose?.();
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <form onSubmit={handleSubmit}>
        <label htmlFor={`velora-search-${variant}`} className="sr-only">
          Arama
        </label>
        <input
          ref={inputRef}
          id={`velora-search-${variant}`}
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Ne arıyorsunuz?"
          autoComplete="off"
          className="w-full appearance-none border-b border-border bg-transparent py-4 font-heading text-32 text-black outline-none placeholder:text-taupe lg:text-48 [&::-webkit-search-cancel-button]:hidden [&::-webkit-search-decoration]:hidden"
        />
      </form>

      <div className="min-h-0 flex-1 overflow-y-auto py-8">
        {trimmed ? (
          <SearchResults
            products={results}
            loading={loading}
            error={error}
            variant={variant === "overlay" ? "compact" : "default"}
            onResultClick={handleResultClick}
          />
        ) : (
          <div className="flex flex-col gap-12">
            <section>
              <p className="text-12 tracking-label text-taupe">
                Popüler Aramalar
              </p>
              <ul className="mt-4 flex flex-col gap-3">
                {popularSearches.map((term) => (
                  <li key={term}>
                    <button
                      type="button"
                      onClick={() => setQuery(term)}
                      className="min-h-11 text-left text-16 text-charcoal transition-colors hover:text-black"
                    >
                      {term}
                    </button>
                  </li>
                ))}
              </ul>
            </section>
            <RecentSearches terms={terms} onSelect={setQuery} />
          </div>
        )}
      </div>
    </div>
  );
}
