import { useState, useEffect, useCallback } from 'react';
import type { Book, BookInput, BookPatch, BookId, ReadingGoal } from '@planner/core';
import { adapter } from '../adapter.js';

type State =
  | { status: 'loading' }
  | { status: 'ok'; books: Book[]; readingGoals: ReadingGoal[] }
  | { status: 'error'; message: string };

export function useBooks() {
  const [state, setState] = useState<State>({ status: 'loading' });

  const load = useCallback(async () => {
    const [booksResult, goalsResult] = await Promise.all([
      adapter.getBooks(),
      adapter.getReadingGoals(),
    ]);
    if (booksResult.ok && goalsResult.ok) {
      setState({
        status: 'ok',
        books: booksResult.data.filter((b) => !b.archivedAt),
        readingGoals: goalsResult.data,
      });
    } else {
      setState({ status: 'error', message: (!booksResult.ok ? booksResult.error : '') || (!goalsResult.ok ? goalsResult.error : '') });
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const createBook = useCallback(async (input: BookInput) => {
    await adapter.createBook(input);
    void load();
  }, [load]);

  const updateBook = useCallback(async (id: BookId, patch: BookPatch) => {
    await adapter.updateBook(id, patch);
    void load();
  }, [load]);

  const archiveBook = useCallback(async (id: BookId) => {
    await adapter.archiveBook(id);
    void load();
  }, [load]);

  const setReadingGoal = useCallback(async (year: number, target: number) => {
    await adapter.setReadingGoal(year, target);
    void load();
  }, [load]);

  return { state, createBook, updateBook, archiveBook, setReadingGoal };
}
