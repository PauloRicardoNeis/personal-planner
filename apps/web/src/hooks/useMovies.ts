import { useCallback, useEffect, useState } from 'react';
import type { Movie, MovieId, MovieInput, Result, TmdbSearchResult } from '@planner/core';
import { adapter } from '../adapter.js';

type MoviesState =
  | { status: 'loading' }
  | { status: 'ok'; movies: Movie[]; tmdbApiKey: string | null }
  | { status: 'error'; message: string };

export function useMovies() {
  const [state, setState] = useState<MoviesState>({ status: 'loading' });

  const load = useCallback(async () => {
    const [moviesResult, apiKeyResult] = await Promise.all([
      adapter.getMovies(),
      adapter.getTmdbApiKey(),
    ]);

    if (!moviesResult.ok) {
      setState({ status: 'error', message: moviesResult.error });
      return;
    }

    if (!apiKeyResult.ok) {
      setState({ status: 'error', message: apiKeyResult.error });
      return;
    }

    setState({
      status: 'ok',
      movies: moviesResult.data,
      tmdbApiKey: apiKeyResult.data,
    });
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const createMovie = useCallback(async (input: MovieInput): Promise<Result<Movie>> => {
    const result = await adapter.createMovie(input);
    if (result.ok) {
      await load();
    }
    return result;
  }, [load]);

  const updateMovie = useCallback(async (
    id: MovieId,
    patch: Partial<Pick<Movie, 'status' | 'rating' | 'tags'>>,
  ): Promise<Result<Movie>> => {
    const result = await adapter.updateMovie(id, patch);
    if (result.ok) {
      await load();
    }
    return result;
  }, [load]);

  const deleteMovie = useCallback(async (id: MovieId): Promise<Result<void>> => {
    const result = await adapter.deleteMovie(id);
    if (result.ok) {
      await load();
    }
    return result;
  }, [load]);

  const searchTmdb = useCallback(async (query: string): Promise<Result<TmdbSearchResult[]>> => (
    adapter.searchTmdbMovies(query)
  ), []);

  const saveTmdbApiKey = useCallback(async (apiKey: string): Promise<Result<string>> => {
    const result = await adapter.saveTmdbApiKey(apiKey);
    if (result.ok) {
      await load();
    }
    return result;
  }, [load]);

  const movies = state.status === 'ok' ? state.movies : [];
  const watchlistMovies = movies.filter((movie) => movie.status === 'watchlist');
  const watchedMovies = movies.filter((movie) => movie.status === 'watched');

  return {
    state,
    movies,
    watchlistMovies,
    watchedMovies,
    tmdbApiKey: state.status === 'ok' ? state.tmdbApiKey : null,
    createMovie,
    updateMovie,
    deleteMovie,
    searchTmdb,
    saveTmdbApiKey,
    reload: load,
  };
}
