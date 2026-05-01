import { describe, expect, it } from 'vitest';
import {
  BookArraySchema,
  BookSchema,
  BookStatusSchema,
  ReadingGoalArraySchema,
  ReadingGoalSchema,
} from './book.js';

const book = {
  id: 'book-1',
  title: 'Clean Architecture',
  author: 'Robert C. Martin',
  genre: 'Software',
  totalPages: 432,
  coverUrl: 'https://example.com/cover.jpg',
  openLibraryKey: '/works/OL123W',
  status: 'reading',
  pagesRead: 120,
  rating: 4,
  notes: 'Useful',
  startedAt: '2026-04-01',
  finishedAt: '2026-04-20',
  createdAt: '2026-04-01T10:00:00.000Z',
  archivedAt: '2026-04-21T10:00:00.000Z',
};

describe('book schemas', () => {
  it('accepts valid book statuses and reading goals', () => {
    expect(BookStatusSchema.parse('want_to_read')).toBe('want_to_read');
    expect(BookStatusSchema.parse('abandoned')).toBe('abandoned');
    expect(ReadingGoalSchema.parse({ year: 2026, target: 24 })).toEqual({ year: 2026, target: 24 });
    expect(ReadingGoalArraySchema.parse([{ year: 2026, target: 12 }])).toHaveLength(1);
  });

  it('accepts complete and array book payloads', () => {
    expect(BookSchema.parse(book)).toMatchObject({
      id: 'book-1',
      title: 'Clean Architecture',
      status: 'reading',
      pagesRead: 120,
    });
    expect(BookArraySchema.parse([book])).toHaveLength(1);
  });

  it('accepts a minimal valid book', () => {
    expect(BookSchema.safeParse({
      id: 'book-2',
      title: 'Dune',
      author: 'Frank Herbert',
      status: 'want_to_read',
      pagesRead: 0,
      createdAt: '2026-04-01T10:00:00.000Z',
    }).success).toBe(true);
  });

  it('rejects invalid book fields', () => {
    expect(BookSchema.safeParse({ ...book, title: '' }).success).toBe(false);
    expect(BookSchema.safeParse({ ...book, totalPages: 0 }).success).toBe(false);
    expect(BookSchema.safeParse({ ...book, coverUrl: 'not-a-url' }).success).toBe(false);
    expect(BookSchema.safeParse({ ...book, rating: 6 }).success).toBe(false);
    expect(BookSchema.safeParse({ ...book, startedAt: '04/01/2026' }).success).toBe(false);
    expect(ReadingGoalSchema.safeParse({ year: 1999, target: 1 }).success).toBe(false);
    expect(ReadingGoalSchema.safeParse({ year: 2026, target: 0 }).success).toBe(false);
  });
});
