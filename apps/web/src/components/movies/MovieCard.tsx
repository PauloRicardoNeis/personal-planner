import { useState } from 'react';
import type { Movie, Result } from '@planner/core';

type Feedback =
  | { kind: 'error'; message: string }
  | null;

type Props = {
  movie: Movie;
  onUpdateMovie: (
    id: Movie['id'],
    patch: Partial<Pick<Movie, 'status' | 'rating' | 'tags'>>,
  ) => Promise<Result<Movie>>;
  onDeleteMovie: (id: Movie['id']) => Promise<Result<void>>;
};

export function MovieCard({ movie, onUpdateMovie, onDeleteMovie }: Props) {
  const [tagInput, setTagInput] = useState('');
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [busyAction, setBusyAction] = useState<'none' | 'status' | 'tag' | 'delete'>('none');

  async function handleUpdate(
    patch: Partial<Pick<Movie, 'status' | 'rating' | 'tags'>>,
    action: 'status' | 'tag',
  ) {
    setBusyAction(action);
    setFeedback(null);

    const result = await onUpdateMovie(movie.id, patch);
    setBusyAction('none');

    if (!result.ok) {
      setFeedback({ kind: 'error', message: result.error });
    }
  }

  async function handleDelete() {
    setBusyAction('delete');
    setFeedback(null);

    const result = await onDeleteMovie(movie.id);
    setBusyAction('none');

    if (!result.ok) {
      setFeedback({ kind: 'error', message: result.error });
    }
  }

  async function handleAddTag() {
    const newTags = tagInput
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean);

    if (newTags.length === 0) {
      return;
    }

    await handleUpdate({ tags: [...movie.tags, ...newTags] }, 'tag');
    setTagInput('');
  }

  async function handleRemoveTag(tag: string) {
    await handleUpdate({ tags: movie.tags.filter((currentTag) => currentTag !== tag) }, 'tag');
  }

  return (
    <article style={cardStyle}>
      <div style={mediaRowStyle}>
        {movie.posterUrl ? (
          <img src={movie.posterUrl} alt={`Poster de ${movie.title}`} style={posterStyle} />
        ) : (
          <div style={posterFallbackStyle}>
            <span style={posterFallbackTextStyle}>{movie.title.slice(0, 1).toUpperCase()}</span>
          </div>
        )}

        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={headerRowStyle}>
            <div style={{ minWidth: 0 }}>
              <h3 style={titleStyle}>{movie.title}</h3>
              <p style={metaStyle}>
                {movie.year ? `${movie.year} · ` : ''}
                {movie.status === 'watched' ? 'Assistido' : 'Na watchlist'}
                {movie.watchedAt ? ` · ${formatDateTime(movie.watchedAt)}` : ''}
              </p>
            </div>

            <span style={sourceBadgeStyle}>
              {movie.tmdbId ? 'TMDB' : 'Manual'}
            </span>
          </div>

          {movie.overview && <p style={overviewStyle}>{movie.overview}</p>}
        </div>
      </div>

      <div style={tagsWrapStyle}>
        {movie.tags.length === 0 && <span style={emptyTagStyle}>Sem tags</span>}
        {movie.tags.map((tag) => (
          <button
            key={tag}
            type="button"
            onClick={() => void handleRemoveTag(tag)}
            disabled={busyAction !== 'none'}
            style={tagChipStyle}
            title="Remover tag"
          >
            {tag} ×
          </button>
        ))}
      </div>

      <div style={tagEditorStyle}>
        <input
          type="text"
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              void handleAddTag();
            }
          }}
          placeholder="Adicionar tags livres"
          style={inputStyle}
        />
        <button
          type="button"
          onClick={() => void handleAddTag()}
          disabled={busyAction !== 'none'}
          style={secondaryButtonStyle}
        >
          Salvar tags
        </button>
      </div>

      <div style={ratingBlockStyle}>
        <span style={labelStyle}>
          {movie.status === 'watched' ? 'Sua nota' : 'Marcar assistido com nota'}
        </span>
        <StarRating
          rating={movie.rating}
          onSelect={(rating) => void handleUpdate({ status: 'watched', rating }, 'status')}
          disabled={busyAction !== 'none'}
        />
      </div>

      <div style={actionsStyle}>
        {movie.status === 'watchlist' ? (
          <button
            type="button"
            onClick={() => void handleUpdate({ status: 'watched' }, 'status')}
            disabled={busyAction !== 'none'}
            style={buttonStyle}
          >
            Marcar assistido
          </button>
        ) : (
          <button
            type="button"
            onClick={() => void handleUpdate({ status: 'watchlist' }, 'status')}
            disabled={busyAction !== 'none'}
            style={secondaryButtonStyle}
          >
            Voltar para watchlist
          </button>
        )}

        <button
          type="button"
          onClick={() => void handleDelete()}
          disabled={busyAction !== 'none'}
          style={dangerButtonStyle}
        >
          Excluir
        </button>
      </div>

      {feedback && <p style={errorStyle}>{feedback.message}</p>}
    </article>
  );
}

function StarRating({
  rating,
  onSelect,
  disabled,
}: {
  rating?: Movie['rating'];
  onSelect: (rating: 1 | 2 | 3 | 4 | 5) => void;
  disabled?: boolean;
}) {
  return (
    <div style={starsStyle}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onSelect(star as 1 | 2 | 3 | 4 | 5)}
          disabled={disabled}
          style={{
            ...starButtonStyle,
            color: rating !== undefined && star <= rating ? '#f0b429' : 'var(--text-muted)',
            opacity: disabled ? 0.6 : 1,
          }}
          aria-label={`Dar nota ${star}`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

function formatDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
  }).format(date);
}

const cardStyle: React.CSSProperties = {
  padding: '18px',
  borderRadius: 'var(--radius-lg)',
  border: '1px solid var(--border)',
  background: 'var(--bg-card)',
  boxShadow: 'var(--shadow-card)',
  display: 'flex',
  flexDirection: 'column',
  gap: 14,
};

const mediaRowStyle: React.CSSProperties = {
  display: 'flex',
  gap: 14,
  alignItems: 'flex-start',
};

const posterStyle: React.CSSProperties = {
  width: 96,
  height: 144,
  borderRadius: 'var(--radius-md)',
  objectFit: 'cover',
  background: 'var(--bg-check)',
  flexShrink: 0,
};

const posterFallbackStyle: React.CSSProperties = {
  ...posterStyle,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'linear-gradient(135deg, var(--accent-soft), var(--bg-check))',
};

const posterFallbackTextStyle: React.CSSProperties = {
  fontSize: 28,
  fontWeight: 700,
  color: 'var(--accent)',
};

const headerRowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 10,
  alignItems: 'flex-start',
};

const titleStyle: React.CSSProperties = {
  margin: 0,
  color: 'var(--text)',
  fontSize: 16,
  lineHeight: 1.25,
};

const metaStyle: React.CSSProperties = {
  margin: '4px 0 0',
  color: 'var(--text-muted)',
  fontSize: 12.5,
};

const sourceBadgeStyle: React.CSSProperties = {
  padding: '4px 8px',
  borderRadius: 999,
  background: 'var(--accent-soft)',
  color: 'var(--accent)',
  fontSize: 11,
  fontWeight: 700,
  flexShrink: 0,
};

const overviewStyle: React.CSSProperties = {
  margin: '10px 0 0',
  color: 'var(--text-muted)',
  fontSize: 13,
  lineHeight: 1.5,
};

const tagsWrapStyle: React.CSSProperties = {
  display: 'flex',
  gap: 8,
  flexWrap: 'wrap',
};

const emptyTagStyle: React.CSSProperties = {
  color: 'var(--text-muted)',
  fontSize: 12,
};

const tagChipStyle: React.CSSProperties = {
  padding: '5px 10px',
  borderRadius: 999,
  border: '1px solid var(--border)',
  background: 'var(--bg)',
  color: 'var(--text)',
  fontSize: 12,
  cursor: 'pointer',
};

const tagEditorStyle: React.CSSProperties = {
  display: 'flex',
  gap: 8,
  flexWrap: 'wrap',
};

const inputStyle: React.CSSProperties = {
  flex: 1,
  minWidth: 180,
  padding: '9px 12px',
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--border-input)',
  background: 'var(--bg-input)',
  color: 'var(--text)',
  fontSize: 13,
  outline: 'none',
};

const ratingBlockStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
};

const labelStyle: React.CSSProperties = {
  color: 'var(--text-muted)',
  fontSize: 12,
  fontWeight: 600,
};

const starsStyle: React.CSSProperties = {
  display: 'flex',
  gap: 4,
};

const starButtonStyle: React.CSSProperties = {
  border: 'none',
  background: 'transparent',
  cursor: 'pointer',
  fontSize: 24,
  padding: 0,
  lineHeight: 1,
};

const actionsStyle: React.CSSProperties = {
  display: 'flex',
  gap: 10,
  flexWrap: 'wrap',
  justifyContent: 'space-between',
};

const buttonStyle: React.CSSProperties = {
  padding: '10px 14px',
  borderRadius: 'var(--radius-md)',
  border: 'none',
  background: 'var(--btn-bg)',
  color: 'var(--btn-text)',
  cursor: 'pointer',
  fontSize: 13,
  fontWeight: 600,
};

const secondaryButtonStyle: React.CSSProperties = {
  padding: '10px 14px',
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--border)',
  background: 'transparent',
  color: 'var(--text)',
  cursor: 'pointer',
  fontSize: 13,
  fontWeight: 600,
};

const dangerButtonStyle: React.CSSProperties = {
  ...secondaryButtonStyle,
  color: 'var(--priority-high-text)',
  border: '1px solid color-mix(in srgb, var(--priority-high-text) 24%, var(--border))',
};

const errorStyle: React.CSSProperties = {
  margin: 0,
  color: 'var(--priority-high-text)',
  fontSize: 12.5,
};
