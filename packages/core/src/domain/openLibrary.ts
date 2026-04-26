// ── Open Library search result parsing ────────────────────────────────────────

export interface OpenLibrarySearchResult {
  title: string;
  author: string;
  coverUrl?: string;
  openLibraryKey: string;
  totalPages?: number;
}

interface OpenLibraryDoc {
  key?: string;
  title?: string;
  author_name?: string[];
  cover_i?: number;
  number_of_pages_median?: number;
}

interface OpenLibraryResponse {
  docs?: OpenLibraryDoc[];
}

/**
 * Parses the raw JSON response from Open Library's search API into a
 * clean array of search results. Pure function — no network calls.
 *
 * Endpoint: https://openlibrary.org/search.json?q={query}&limit=5
 */
export function parseOpenLibraryResponse(json: unknown): OpenLibrarySearchResult[] {
  const data = json as OpenLibraryResponse;
  if (!data?.docs || !Array.isArray(data.docs)) return [];

  return data.docs
    .filter((doc): doc is OpenLibraryDoc & { key: string; title: string } =>
      typeof doc.key === 'string' && typeof doc.title === 'string'
    )
    .map((doc) => {
      const result: OpenLibrarySearchResult = {
        title: doc.title,
        author: doc.author_name?.[0] ?? 'Desconhecido',
        openLibraryKey: doc.key,
      };
      if (doc.cover_i) {
        result.coverUrl = `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg`;
      }
      if (doc.number_of_pages_median && doc.number_of_pages_median > 0) {
        result.totalPages = doc.number_of_pages_median;
      }
      return result;
    });
}
