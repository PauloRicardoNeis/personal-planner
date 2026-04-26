import type { Book, BookId, BookPatch } from '@planner/core';
import { BookCard } from './BookCard.js';

interface Props {
  books: Book[];
  onUpdate: (id: BookId, patch: BookPatch) => void;
  onArchive: (id: BookId) => void;
}

export function BookList({ books, onUpdate, onArchive }: Props) {
  if (books.length === 0) {
    return (
      <p style={{ color: 'var(--text-muted)', textAlign: 'center', marginTop: 24, fontSize: 14 }}>
        Nenhum livro encontrado.
      </p>
    );
  }

  return (
    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
      {books.map((book) => (
        <BookCard key={book.id} book={book} onUpdate={onUpdate} onArchive={onArchive} />
      ))}
    </ul>
  );
}
