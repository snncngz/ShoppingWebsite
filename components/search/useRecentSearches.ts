"use client";

import { useCallback, useEffect, useState } from "react";

import {
  addRecentSearch,
  parseRecentSearches,
  RECENT_SEARCHES_KEY,
} from "@/lib/search";

export function useRecentSearches() {
  const [terms, setTerms] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(RECENT_SEARCHES_KEY);
      setTerms(raw ? parseRecentSearches(JSON.parse(raw)) : []);
    } catch {
      setTerms([]);
    }

    setHydrated(true);
  }, []);

  const remember = useCallback((query: string) => {
    setTerms((current) => {
      const next = addRecentSearch(current, query);

      try {
        window.localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(next));
      } catch {
        // Ignore quota / private-mode failures.
      }

      return next;
    });
  }, []);

  return {
    terms: hydrated ? terms : [],
    remember,
  };
}
