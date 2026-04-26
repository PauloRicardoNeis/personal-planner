import { useState, useEffect, useRef } from 'react';
import { parseOpenLibraryResponse, type OpenLibrarySearchResult } from '@planner/core';

export function useBookSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<OpenLibrarySearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const timer = setTimeout(async () => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(trimmed)}&limit=6`;
        const res = await fetch(url, { signal: controller.signal });
        const json: unknown = await res.json();
        setResults(parseOpenLibraryResponse(json));
      } catch (e) {
        if (e instanceof DOMException && e.name === 'AbortError') return;
        setResults([]);
      } finally {
        if (!controller.signal.aborted) setIsSearching(false);
      }
    }, 400);

    return () => {
      clearTimeout(timer);
      abortRef.current?.abort();
    };
  }, [query]);

  return { query, setQuery, results, isSearching };
}
