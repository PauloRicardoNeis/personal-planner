import { z } from 'zod';
import { ISODateSchema, ISODateTimeSchema, type BookId, type ISODate, type ISODateTime } from './shared.js';

export type { BookId };

// ── Types ────────────────────────────────────────────────────────────────────

export type BookStatus = 'want_to_read' | 'reading' | 'read' | 'abandoned';

export interface Book {
  id: BookId;
  title: string;
  author: string;
  genre?: string;
  totalPages?: number;
  coverUrl?: string;
  openLibraryKey?: string;
  status: BookStatus;
  pagesRead: number;
  rating?: number;
  notes?: string;
  startedAt?: ISODate;
  finishedAt?: ISODate;
  createdAt: ISODateTime;
  archivedAt?: ISODateTime;
}

export interface BookInput {
  title: string;
  author: string;
  genre?: string;
  totalPages?: number;
  coverUrl?: string;
  openLibraryKey?: string;
}

export type BookPatch = Partial<BookInput & {
  status: BookStatus;
  pagesRead: number;
  rating: number;
  notes: string;
  startedAt: ISODate;
  finishedAt: ISODate;
}>;

export interface ReadingGoal {
  year: number;
  target: number;
}

// ── Zod schemas ──────────────────────────────────────────────────────────────

export const BookStatusSchema = z.enum(['want_to_read', 'reading', 'read', 'abandoned']);

export const BookSchema = z.object({
  id: z.string(),
  title: z.string().min(1),
  author: z.string().min(1),
  genre: z.string().optional(),
  totalPages: z.number().int().positive().optional(),
  coverUrl: z.string().url().optional(),
  openLibraryKey: z.string().optional(),
  status: BookStatusSchema,
  pagesRead: z.number().int().nonnegative(),
  rating: z.number().int().min(1).max(5).optional(),
  notes: z.string().optional(),
  startedAt: ISODateSchema.optional(),
  finishedAt: ISODateSchema.optional(),
  createdAt: ISODateTimeSchema,
  archivedAt: ISODateTimeSchema.optional(),
});

export const BookArraySchema = z.array(BookSchema);

export const ReadingGoalSchema = z.object({
  year: z.number().int().min(2000).max(2100),
  target: z.number().int().positive(),
});

export const ReadingGoalArraySchema = z.array(ReadingGoalSchema);
