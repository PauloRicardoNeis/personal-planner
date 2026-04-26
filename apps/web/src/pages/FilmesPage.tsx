import { useEffect, useState } from 'react';
import type { MovieInput, TmdbSearchResult } from '@planner/core';
import { MovieCard } from '../components/movies/MovieCard.js';
import { MovieSearch } from '../components/movies/MovieSearch.js';
import { TmdbSettings } from '../components/movies/TmdbSettings.js';
import { useMovies } from '../hooks/useMovies.js';

type TabKey = 'watchlist' | 'watched';

export function FilmesPage() {
  const {
    state,
    watchlistMovies,
    watchedMovies,
    tmdbApiKey,
    createMovie,
    updateMovie,
    deleteMovie,
    searchTmdb,
    saveTmdbApiKey,
  } = useMovies();

  const [activeTab, setActiveTab] = useState<TabKey>('watchlist');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  const movies = activeTab === 'watchlist' ? watchlistMovies : watchedMovies;
  const availableTags = Array.from(new Set(movies.flatMap((movie) => movie.tags)))
    .sort((a, b) => a.localeCompare(b, 'pt-BR'));
  const filteredMovies = selectedTag
    ? movies.filter((movie) => movie.tags.includes(selectedTag))
    : movies;

  useEffect(() => {
    if (selectedTag && !availableTags.includes(selectedTag)) {
      setSelectedTag(null);
    }
  }, [availableTags, selectedTag]);

  async function handleAddTmdbMovie(movie: TmdbSearchResult) {
    return createMovie({
      title: movie.title,
      ...(movie.year !== undefined && { year: movie.year }),
      ...(movie.posterUrl !== undefined && { posterUrl: movie.posterUrl }),
      ...(movie.overview !== undefined && { overview: movie.overview }),
      tmdbId: movie.tmdbId,
    });
  }

  async function handleAddManualMovie(input: MovieInput) {
    return createMovie(input);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <section>
        <h1 style={titleStyle}>Filmes</h1>
        <p style={introStyle}>
          Organize sua watchlist, registre o que já assistiu e mantenha tags pessoais junto dos metadados do TMDB.
        </p>
      </section>

      {state.status === 'loading' && <p style={mutedStyle}>Carregando filmes...</p>}
      {state.status === 'error' && <p style={errorStyle}>Erro: {state.message}</p>}

      {state.status === 'ok' && (
        <>
          <TmdbSettings apiKey={tmdbApiKey ?? ''} onSave={saveTmdbApiKey} />

          <MovieSearch
            canSearch={Boolean(tmdbApiKey)}
            onSearch={searchTmdb}
            onAddTmdbMovie={handleAddTmdbMovie}
            onAddManualMovie={handleAddManualMovie}
          />

          <section style={controlsCardStyle}>
            <div style={tabsStyle}>
              <button
                type="button"
                onClick={() => setActiveTab('watchlist')}
                style={activeTab === 'watchlist' ? activeTabStyle : tabStyle}
              >
                Para Assistir ({watchlistMovies.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('watched')}
                style={activeTab === 'watched' ? activeTabStyle : tabStyle}
              >
                Assistidos ({watchedMovies.length})
              </button>
            </div>

            <div style={filtersStyle}>
              <button
                type="button"
                onClick={() => setSelectedTag(null)}
                style={selectedTag === null ? activeFilterStyle : filterStyle}
              >
                Todas as tags
              </button>
              {availableTags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setSelectedTag(tag)}
                  style={selectedTag === tag ? activeFilterStyle : filterStyle}
                >
                  {tag}
                </button>
              ))}
            </div>
          </section>

          {filteredMovies.length === 0 ? (
            <section style={emptyStateStyle}>
              <strong style={{ color: 'var(--text)' }}>
                {selectedTag
                  ? `Nenhum filme com a tag "${selectedTag}" nesta aba.`
                  : activeTab === 'watchlist'
                    ? 'Sua watchlist ainda está vazia.'
                    : 'Nenhum filme marcado como assistido ainda.'}
              </strong>
              <p style={hintStyle}>
                Use a busca TMDB ou o cadastro manual acima para começar.
              </p>
            </section>
          ) : (
            <section style={gridStyle}>
              {filteredMovies.map((movie) => (
                <MovieCard
                  key={movie.id}
                  movie={movie}
                  onUpdateMovie={updateMovie}
                  onDeleteMovie={deleteMovie}
                />
              ))}
            </section>
          )}
        </>
      )}
    </div>
  );
}

const titleStyle: React.CSSProperties = {
  fontSize: 20,
  fontWeight: 700,
  margin: 0,
  letterSpacing: '-0.3px',
  color: 'var(--text)',
};

const introStyle: React.CSSProperties = {
  margin: '8px 0 0',
  color: 'var(--text-muted)',
  fontSize: 13.5,
  lineHeight: 1.5,
  maxWidth: 720,
};

const controlsCardStyle: React.CSSProperties = {
  padding: '18px 20px',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius-lg)',
  background: 'var(--bg-card)',
  boxShadow: 'var(--shadow-card)',
  display: 'flex',
  flexDirection: 'column',
  gap: 14,
};

const tabsStyle: React.CSSProperties = {
  display: 'flex',
  gap: 10,
  flexWrap: 'wrap',
};

const tabStyle: React.CSSProperties = {
  padding: '10px 14px',
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--border)',
  background: 'transparent',
  color: 'var(--text)',
  cursor: 'pointer',
  fontSize: 13,
  fontWeight: 600,
};

const activeTabStyle: React.CSSProperties = {
  ...tabStyle,
  background: 'var(--accent-soft)',
  color: 'var(--accent)',
  border: '1px solid color-mix(in srgb, var(--accent) 30%, var(--border))',
};

const filtersStyle: React.CSSProperties = {
  display: 'flex',
  gap: 8,
  flexWrap: 'wrap',
};

const filterStyle: React.CSSProperties = {
  padding: '7px 10px',
  borderRadius: 999,
  border: '1px solid var(--border)',
  background: 'var(--bg)',
  color: 'var(--text)',
  cursor: 'pointer',
  fontSize: 12.5,
};

const activeFilterStyle: React.CSSProperties = {
  ...filterStyle,
  background: 'var(--accent-soft)',
  color: 'var(--accent)',
};

const gridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
  gap: 16,
};

const emptyStateStyle: React.CSSProperties = {
  padding: '22px 24px',
  borderRadius: 'var(--radius-lg)',
  border: '1px dashed var(--border)',
  background: 'var(--bg-card)',
};

const hintStyle: React.CSSProperties = {
  margin: '8px 0 0',
  color: 'var(--text-muted)',
  fontSize: 13,
  lineHeight: 1.5,
};

const mutedStyle: React.CSSProperties = {
  color: 'var(--text-muted)',
  fontSize: 13.5,
};

const errorStyle: React.CSSProperties = {
  color: 'var(--priority-high-text)',
  fontSize: 13.5,
};
