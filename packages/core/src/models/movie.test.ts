import { describe, expect, it } from 'vitest';
import {
  MovieArraySchema,
  MovieRatingSchema,
  MovieSchema,
  TmdbSearchResultArraySchema,
  TmdbSearchResultSchema,
} from './movie.js';

const movie = {
  id: 'movie-1',
  title: 'Arrival',
  year: 2016,
  posterUrl: 'https://example.com/poster.jpg',
  overview: 'Linguistics and time',
  tmdbId: 329865,
  status: 'watched',
  rating: 5,
  tags: ['sci-fi'],
  watchedAt: '2026-04-01T10:00:00.000Z',
  createdAt: '2026-04-01T10:00:00.000Z',
};

const tmdbResult = {
  tmdbId: 329865,
  title: 'Arrival',
  year: 2016,
  posterUrl: 'https://example.com/poster.jpg',
  overview: 'Movie result',
};

describe('movie schemas', () => {
  it('accepts movie ratings and complete movie payloads', () => {
    expect(MovieRatingSchema.parse(1)).toBe(1);
    expect(MovieRatingSchema.parse(5)).toBe(5);
    expect(MovieSchema.parse(movie)).toMatchObject({ title: 'Arrival', status: 'watched' });
    expect(MovieArraySchema.parse([movie])).toHaveLength(1);
  });

  it('accepts minimal watchlist and TMDB result payloads', () => {
    expect(MovieSchema.safeParse({
      id: 'movie-2',
      title: 'Dune',
      status: 'watchlist',
      tags: [],
      createdAt: '2026-04-01T10:00:00.000Z',
    }).success).toBe(true);
    expect(TmdbSearchResultSchema.parse(tmdbResult)).toMatchObject({ tmdbId: 329865 });
    expect(TmdbSearchResultArraySchema.parse([tmdbResult])).toHaveLength(1);
  });

  it('rejects invalid movie and TMDB fields', () => {
    expect(MovieRatingSchema.safeParse(6).success).toBe(false);
    expect(MovieSchema.safeParse({ ...movie, title: '' }).success).toBe(false);
    expect(MovieSchema.safeParse({ ...movie, year: 1887 }).success).toBe(false);
    expect(MovieSchema.safeParse({ ...movie, posterUrl: 'not-a-url' }).success).toBe(false);
    expect(MovieSchema.safeParse({ ...movie, tmdbId: 0 }).success).toBe(false);
    expect(MovieSchema.safeParse({ ...movie, status: 'queued' }).success).toBe(false);
    expect(MovieSchema.safeParse({ ...movie, watchedAt: '2026-04-01' }).success).toBe(false);
    expect(TmdbSearchResultSchema.safeParse({ ...tmdbResult, year: 3001 }).success).toBe(false);
  });
});
