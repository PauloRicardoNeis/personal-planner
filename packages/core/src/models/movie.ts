import { z } from 'zod';
import { ISODateTimeSchema, type ISODateTime, type MovieId } from './shared.js';

export type MovieRating = 1 | 2 | 3 | 4 | 5;

export interface Movie {
  id: MovieId;
  title: string;
  year?: number;
  posterUrl?: string;
  overview?: string;
  tmdbId?: number;
  status: 'watchlist' | 'watched';
  rating?: MovieRating;
  tags: string[];
  watchedAt?: ISODateTime;
  createdAt: ISODateTime;
}

export type MovieInput = {
  title: string;
  year?: number;
  posterUrl?: string;
  overview?: string;
  tmdbId?: number;
  tags?: string[];
};

export interface TmdbSearchResult {
  tmdbId: number;
  title: string;
  year?: number;
  posterUrl?: string;
  overview?: string;
}

export const MovieRatingSchema = z.union([
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4),
  z.literal(5),
]);

export const MovieSchema = z.object({
  id: z.string(),
  title: z.string().min(1),
  year: z.number().int().min(1888).max(3000).optional(),
  posterUrl: z.string().url().optional(),
  overview: z.string().optional(),
  tmdbId: z.number().int().positive().optional(),
  status: z.enum(['watchlist', 'watched']),
  rating: MovieRatingSchema.optional(),
  tags: z.array(z.string()),
  watchedAt: ISODateTimeSchema.optional(),
  createdAt: ISODateTimeSchema,
});

export const MovieArraySchema = z.array(MovieSchema);

export const TmdbSearchResultSchema = z.object({
  tmdbId: z.number().int().positive(),
  title: z.string().min(1),
  year: z.number().int().min(1888).max(3000).optional(),
  posterUrl: z.string().url().optional(),
  overview: z.string().optional(),
});

export const TmdbSearchResultArraySchema = z.array(TmdbSearchResultSchema);
