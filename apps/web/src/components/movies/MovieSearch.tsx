import { useEffect, useState } from 'react';
import type { Movie, MovieInput, Result, TmdbSearchResult } from '@planner/core';

type Feedback =
  | { kind: 'success'; message: string }
  | { kind: 'error'; message: string }
  | null;

type Props = {
  canSearch: boolean;
  onSearch: (query: string) => Promise<Result<TmdbSearchResult[]>>;
  onAddTmdbMovie: (movie: TmdbSearchResult) => Promise<Result<Movie>>;
  onAddManualMovie: (input: MovieInput) => Promise<Result<Movie>>;
};

export function MovieSearch({
  canSearch,
  onSearch,
  onAddTmdbMovie,
  onAddManualMovie,
}: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<TmdbSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [manualOpen, setManualOpen] = useState(false);
  const [manualTitle, setManualTitle] = useState('');
  const [manualYear, setManualYear] = useState('');
  const [manualPosterUrl, setManualPosterUrl] = useState('');
  const [manualOverview, setManualOverview] = useState('');
  const [manualTags, setManualTags] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    if (!canSearch) {
      setResults([]);
      setError(null);
      setIsSearching(false);
      return;
    }

    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setError(null);
      setIsSearching(false);
      return;
    }

    let cancelled = false;
    const timeoutId = window.setTimeout(async () => {
      setIsSearching(true);
      const result = await onSearch(trimmed);
      if (cancelled) return;

      setIsSearching(false);
      if (!result.ok) {
        setResults([]);
        setError(result.error);
        return;
      }

      setError(null);
      setResults(result.data);
    }, 350);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [canSearch, onSearch, query]);

  async function handleAddTmdbMovie(movie: TmdbSearchResult) {
    setIsAdding(true);
    setFeedback(null);

    const result = await onAddTmdbMovie(movie);
    setIsAdding(false);

    if (!result.ok) {
      setFeedback({ kind: 'error', message: result.error });
      return;
    }

    setFeedback({ kind: 'success', message: `"${movie.title}" adicionado à watchlist.` });
    setQuery('');
    setResults([]);
  }

  async function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsAdding(true);
    setFeedback(null);

    const yearValue = manualYear.trim();
    const parsedYear = yearValue ? Number.parseInt(yearValue, 10) : undefined;

    const result = await onAddManualMovie({
      title: manualTitle,
      ...(parsedYear !== undefined && !Number.isNaN(parsedYear) && { year: parsedYear }),
      ...(manualPosterUrl.trim() && { posterUrl: manualPosterUrl.trim() }),
      ...(manualOverview.trim() && { overview: manualOverview.trim() }),
      tags: parseTags(manualTags),
    });

    setIsAdding(false);

    if (!result.ok) {
      setFeedback({ kind: 'error', message: result.error });
      return;
    }

    setFeedback({ kind: 'success', message: `"${result.data.title}" adicionado manualmente.` });
    setManualTitle('');
    setManualYear('');
    setManualPosterUrl('');
    setManualOverview('');
    setManualTags('');
    setManualOpen(false);
  }

  return (
    <section style={cardStyle}>
      <div>
        <h2 style={titleStyle}>Adicionar filme</h2>
        <p style={hintStyle}>
          Busque no TMDB para puxar dados ricos ou use o cadastro manual quando preferir.
        </p>
      </div>

      <div style={searchRowStyle}>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={canSearch ? 'Buscar no TMDB...' : 'Configure a API key do TMDB para habilitar a busca'}
          disabled={!canSearch}
          style={{ ...inputStyle, opacity: canSearch ? 1 : 0.6 }}
        />

        <button
          type="button"
          onClick={() => setManualOpen((open) => !open)}
          style={secondaryButtonStyle}
        >
          {manualOpen ? 'Fechar manual' : 'Adicionar manual'}
        </button>
      </div>

      {isSearching && <p style={mutedStyle}>Buscando filmes...</p>}
      {error && <p style={errorStyle}>{error}</p>}

      {results.length > 0 && (
        <div style={resultsStyle}>
          {results.map((movie) => (
            <div key={movie.tmdbId} style={resultCardStyle}>
              <div style={resultContentStyle}>
                {movie.posterUrl ? (
                  <img src={movie.posterUrl} alt={`Poster de ${movie.title}`} style={posterStyle} />
                ) : (
                  <div style={posterPlaceholderStyle}>Sem poster</div>
                )}

                <div style={{ minWidth: 0 }}>
                  <strong style={resultTitleStyle}>
                    {movie.title}
                    {movie.year ? ` (${movie.year})` : ''}
                  </strong>
                  {movie.overview && <p style={resultOverviewStyle}>{movie.overview}</p>}
                </div>
              </div>

              <button
                type="button"
                onClick={() => void handleAddTmdbMovie(movie)}
                disabled={isAdding}
                style={buttonStyle}
              >
                Adicionar
              </button>
            </div>
          ))}
        </div>
      )}

      {manualOpen && (
        <form onSubmit={handleManualSubmit} style={manualFormStyle}>
          <div style={manualGridStyle}>
            <label style={fieldStyle}>
              <span style={labelStyle}>Título</span>
              <input
                type="text"
                required
                value={manualTitle}
                onChange={(e) => setManualTitle(e.target.value)}
                placeholder="Ex.: Perfect Days"
                style={inputStyle}
              />
            </label>

            <label style={fieldStyle}>
              <span style={labelStyle}>Ano</span>
              <input
                type="number"
                min={1888}
                max={3000}
                value={manualYear}
                onChange={(e) => setManualYear(e.target.value)}
                placeholder="Opcional"
                style={inputStyle}
              />
            </label>

            <label style={fieldStyle}>
              <span style={labelStyle}>Poster URL</span>
              <input
                type="url"
                value={manualPosterUrl}
                onChange={(e) => setManualPosterUrl(e.target.value)}
                placeholder="https://..."
                style={inputStyle}
              />
            </label>

            <label style={fieldStyle}>
              <span style={labelStyle}>Tags</span>
              <input
                type="text"
                value={manualTags}
                onChange={(e) => setManualTags(e.target.value)}
                placeholder="Drama, Japão, favorito"
                style={inputStyle}
              />
            </label>
          </div>

          <label style={fieldStyle}>
            <span style={labelStyle}>Sinopse</span>
            <textarea
              value={manualOverview}
              onChange={(e) => setManualOverview(e.target.value)}
              rows={4}
              placeholder="Opcional"
              style={textareaStyle}
            />
          </label>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" disabled={isAdding} style={buttonStyle}>
              {isAdding ? 'Salvando...' : 'Salvar filme'}
            </button>
          </div>
        </form>
      )}

      {feedback && (
        <p style={feedback.kind === 'error' ? errorStyle : successStyle}>
          {feedback.message}
        </p>
      )}
    </section>
  );
}

function parseTags(input: string): string[] {
  return input
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean);
}

const cardStyle: React.CSSProperties = {
  padding: '20px 22px',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius-lg)',
  background: 'var(--bg-card)',
  boxShadow: 'var(--shadow-card)',
  display: 'flex',
  flexDirection: 'column',
  gap: 16,
};

const titleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 13,
  fontWeight: 700,
  color: 'var(--text)',
};

const hintStyle: React.CSSProperties = {
  margin: '4px 0 0',
  color: 'var(--text-muted)',
  fontSize: 12.5,
  lineHeight: 1.5,
};

const searchRowStyle: React.CSSProperties = {
  display: 'flex',
  gap: 10,
  flexWrap: 'wrap',
};

const manualFormStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 14,
  paddingTop: 4,
};

const manualGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
  gap: 12,
};

const fieldStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
};

const labelStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 600,
  color: 'var(--text-muted)',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--border-input)',
  background: 'var(--bg-input)',
  color: 'var(--text)',
  fontSize: 13.5,
  outline: 'none',
};

const textareaStyle: React.CSSProperties = {
  ...inputStyle,
  resize: 'vertical',
  minHeight: 96,
};

const buttonStyle: React.CSSProperties = {
  padding: '10px 16px',
  borderRadius: 'var(--radius-md)',
  border: 'none',
  background: 'var(--btn-bg)',
  color: 'var(--btn-text)',
  cursor: 'pointer',
  fontSize: 13,
  fontWeight: 600,
};

const secondaryButtonStyle: React.CSSProperties = {
  padding: '10px 16px',
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--border)',
  background: 'transparent',
  color: 'var(--text)',
  cursor: 'pointer',
  fontSize: 13,
  fontWeight: 600,
};

const resultsStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
};

const resultCardStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 12,
  alignItems: 'center',
  padding: '12px 14px',
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--border)',
  background: 'var(--bg)',
};

const resultContentStyle: React.CSSProperties = {
  display: 'flex',
  gap: 12,
  alignItems: 'flex-start',
  minWidth: 0,
};

const posterStyle: React.CSSProperties = {
  width: 56,
  height: 84,
  borderRadius: 'var(--radius-sm)',
  objectFit: 'cover',
  background: 'var(--bg-check)',
  flexShrink: 0,
};

const posterPlaceholderStyle: React.CSSProperties = {
  ...posterStyle,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: 'var(--text-muted)',
  fontSize: 11,
  textAlign: 'center',
  padding: 6,
};

const resultTitleStyle: React.CSSProperties = {
  display: 'block',
  color: 'var(--text)',
  fontSize: 14,
  marginBottom: 4,
};

const resultOverviewStyle: React.CSSProperties = {
  margin: 0,
  color: 'var(--text-muted)',
  fontSize: 12.5,
  lineHeight: 1.45,
};

const mutedStyle: React.CSSProperties = {
  margin: 0,
  color: 'var(--text-muted)',
  fontSize: 13,
};

const errorStyle: React.CSSProperties = {
  margin: 0,
  color: 'var(--priority-high-text)',
  fontSize: 13,
};

const successStyle: React.CSSProperties = {
  margin: 0,
  color: 'var(--progress-green)',
  fontSize: 13,
};
