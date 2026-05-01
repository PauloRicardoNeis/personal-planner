import { describe, expect, it } from 'vitest';
import { parseOpenLibraryResponse } from './openLibrary.js';

describe('parseOpenLibraryResponse', () => {
  it('returns an empty list when docs is missing or not an array', () => {
    expect(parseOpenLibraryResponse({})).toEqual([]);
    expect(parseOpenLibraryResponse({ docs: 'not-array' })).toEqual([]);
    expect(parseOpenLibraryResponse(null)).toEqual([]);
  });

  it('filters out docs without a key or title', () => {
    expect(parseOpenLibraryResponse({
      docs: [
        { key: '/works/OL1W' },
        { title: 'Missing key' },
        { key: '/works/OL2W', title: 'Valid title' },
      ],
    })).toEqual([
      {
        title: 'Valid title',
        author: 'Desconhecido',
        openLibraryKey: '/works/OL2W',
      },
    ]);
  });

  it('maps optional author, cover and positive page count', () => {
    expect(parseOpenLibraryResponse({
      docs: [
        {
          key: '/works/OL1W',
          title: 'The Book',
          author_name: ['Author One', 'Author Two'],
          cover_i: 12345,
          number_of_pages_median: 320,
        },
      ],
    })).toEqual([
      {
        title: 'The Book',
        author: 'Author One',
        coverUrl: 'https://covers.openlibrary.org/b/id/12345-M.jpg',
        openLibraryKey: '/works/OL1W',
        totalPages: 320,
      },
    ]);
  });

  it('omits cover and page fields when they are not meaningful', () => {
    expect(parseOpenLibraryResponse({
      docs: [
        {
          key: '/works/OL1W',
          title: 'Sparse Book',
          author_name: [],
          cover_i: 0,
          number_of_pages_median: 0,
        },
      ],
    })).toEqual([
      {
        title: 'Sparse Book',
        author: 'Desconhecido',
        openLibraryKey: '/works/OL1W',
      },
    ]);
  });
});
