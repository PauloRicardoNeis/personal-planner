import {
  computePercentages,
  DataAdapter,
  MovieArraySchema,
  SaudeItemArraySchema,
  ListaCompraArraySchema,
  Result,
  TodaySnapshot,
  nowISODateTime,
  type DailyTargets,
  Habit,
  HabitInput,
  HabitId,
  Dever,
  DeverBase,
  DeverInput,
  DeverId,
  Projeto,
  ProjetoInput,
  ProjetoPatch,
  EtapaInput,
  EtapaPatch,
  ProjetoId,
  EtapaId,
  ISODate,
  Food,
  FoodInput,
  FoodId,
  DiaryEntry,
  DiaryEntryInput,
  DiaryEntryId,
  NutritionProfile,
  DailyNutritionSummary,
  Game,
  SteamLibrarySettings,
  SteamLibrarySettingsInput,
  SteamSyncResult,
  Movie,
  MovieInput,
  MovieId,
  TmdbSearchResult,
  Book,
  BookInput,
  BookPatch,
  BookId,
  ReadingGoal,
  SaudeItem,
  SaudeItemInput,
  SaudeItemPatch,
  SaudeItemId,
  SaudeEventInput,
  SaudeEvent,
  SaudeEventId,
  ListaCompra,
  ListaCompraInput,
  ListaCompraPatch,
  ListaCompraId,
  CompraItem,
  CompraItemInput,
  CompraItemPatch,
  CompraItemId,
} from '@planner/core';

const MOVIES_KEY = 'planner:movies';
const TMDB_API_KEY_KEY = 'planner:tmdb-api-key';
const SAUDE_KEY = 'planner_saude';
const COMPRAS_KEY = 'planner_compras';
const TMDB_API_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w342';

/**
 * Talks to the Rust backend (Axum) running on localhost:3001.
 * Every method maps 1-to-1 to a REST endpoint; the server always
 * returns `{ ok: true, data: T }` or `{ ok: false, error: string }`.
 */
export class RestApiAdapter implements DataAdapter {
  constructor(private readonly baseUrl: string) {}

  // ── Habits ──────────────────────────────────────────────────────────────────

  getHabits(): Promise<Result<Habit[]>> {
    return this.#call('GET', '/habits');
  }

  createHabit(input: HabitInput): Promise<Result<Habit>> {
    return this.#call('POST', '/habits', input);
  }

  updateHabit(
    id: HabitId,
    patch: Partial<HabitInput & { active: boolean }>,
  ): Promise<Result<Habit>> {
    return this.#call('PATCH', `/habits/${id}`, patch);
  }

  markHabitDone(id: HabitId, date: ISODate): Promise<Result<Habit>> {
    return this.#call('POST', `/habits/${id}/completions`, { date });
  }

  unmarkHabitDone(id: HabitId, date: ISODate): Promise<Result<Habit>> {
    return this.#call('DELETE', `/habits/${id}/completions/${date}`);
  }

  archiveHabit(id: HabitId): Promise<Result<void>> {
    return this.#call('POST', `/habits/${id}/archive`);
  }

  // ── Deveres ─────────────────────────────────────────────────────────────────

  getDeveres(): Promise<Result<Dever[]>> {
    return this.#call('GET', '/deveres');
  }

  createDever(input: DeverInput): Promise<Result<Dever>> {
    return this.#call('POST', '/deveres', input);
  }

  updateDever(
    id: DeverId,
    patch: Partial<Pick<DeverBase, 'title' | 'area' | 'priority' | 'active'>>,
  ): Promise<Result<Dever>> {
    return this.#call('PATCH', `/deveres/${id}`, patch);
  }

  markDeverDone(id: DeverId, occurrenceDate: ISODate): Promise<Result<Dever>> {
    return this.#call('POST', `/deveres/${id}/completions`, { occurrenceDate });
  }

  unmarkDeverDone(id: DeverId, occurrenceDate: ISODate): Promise<Result<Dever>> {
    return this.#call('DELETE', `/deveres/${id}/completions/${occurrenceDate}`);
  }

  archiveDever(id: DeverId): Promise<Result<void>> {
    return this.#call('POST', `/deveres/${id}/archive`);
  }

  // ── Projetos ──────────────────────────────────────────────────────────────────

  getProjetos(): Promise<Result<Projeto[]>> {
    return this.#call('GET', '/projetos');
  }

  createProjeto(input: ProjetoInput): Promise<Result<Projeto>> {
    return this.#call('POST', '/projetos', input);
  }

  updateProjeto(id: ProjetoId, patch: ProjetoPatch): Promise<Result<Projeto>> {
    return this.#call('PATCH', `/projetos/${id}`, patch);
  }

  archiveProjeto(id: ProjetoId): Promise<Result<void>> {
    return this.#call('POST', `/projetos/${id}/archive`);
  }

  addEtapa(projetoId: ProjetoId, input: EtapaInput): Promise<Result<Projeto>> {
    return this.#call('POST', `/projetos/${projetoId}/etapas`, input);
  }

  updateEtapa(projetoId: ProjetoId, etapaId: EtapaId, patch: EtapaPatch): Promise<Result<Projeto>> {
    return this.#call('PATCH', `/projetos/${projetoId}/etapas/${etapaId}`, patch);
  }

  removeEtapa(projetoId: ProjetoId, etapaId: EtapaId): Promise<Result<Projeto>> {
    return this.#call('DELETE', `/projetos/${projetoId}/etapas/${etapaId}`);
  }

  reorderEtapas(projetoId: ProjetoId, etapaIds: EtapaId[]): Promise<Result<Projeto>> {
    return this.#call('PUT', `/projetos/${projetoId}/etapas/order`, { etapaIds });
  }

  // ── Foods ───────────────────────────────────────────────────────────────────

  getSaudeItems(): Promise<Result<SaudeItem[]>> {
    return Promise.resolve({ ok: true, data: this.#readSaudeItemsLocal() });
  }

  async createSaudeItem(input: SaudeItemInput): Promise<Result<SaudeItem>> {
    const items = this.#readSaudeItemsLocal();
    const item: SaudeItem = {
      id: crypto.randomUUID() as SaudeItemId,
      type: input.type,
      title: input.title,
      ...(input.specialty !== undefined && { specialty: input.specialty }),
      ...(input.providerName !== undefined && { providerName: input.providerName }),
      ...(input.clinicName !== undefined && { clinicName: input.clinicName }),
      ...(input.location !== undefined && { location: input.location }),
      ...(input.notes !== undefined && { notes: input.notes }),
      ...(input.costEstimate !== undefined && { costEstimate: input.costEstimate }),
      priority: input.priority,
      active: true,
      createdAt: nowISODateTime(),
      schedule: input.schedule,
      events: [],
    };
    items.push(item);
    this.#writeSaudeItemsLocal(items);
    return { ok: true, data: item };
  }

  async updateSaudeItem(id: SaudeItemId, patch: SaudeItemPatch): Promise<Result<SaudeItem>> {
    const items = this.#readSaudeItemsLocal();
    const idx = items.findIndex((item) => item.id === id);
    if (idx === -1) return { ok: false, error: 'Item de saúde não encontrado.' };

    const updated: SaudeItem = {
      ...items[idx]!,
      ...(patch.type !== undefined && { type: patch.type }),
      ...(patch.title !== undefined && { title: patch.title }),
      ...(patch.specialty !== undefined && { specialty: patch.specialty }),
      ...(patch.providerName !== undefined && { providerName: patch.providerName }),
      ...(patch.clinicName !== undefined && { clinicName: patch.clinicName }),
      ...(patch.location !== undefined && { location: patch.location }),
      ...(patch.notes !== undefined && { notes: patch.notes }),
      ...(patch.costEstimate !== undefined && { costEstimate: patch.costEstimate }),
      ...(patch.priority !== undefined && { priority: patch.priority }),
      ...(patch.active !== undefined && { active: patch.active }),
      ...(patch.schedule !== undefined && { schedule: patch.schedule }),
    };
    items[idx] = updated;
    this.#writeSaudeItemsLocal(items);
    return { ok: true, data: updated };
  }

  async recordSaudeEvent(id: SaudeItemId, input: SaudeEventInput): Promise<Result<SaudeItem>> {
    const items = this.#readSaudeItemsLocal();
    const idx = items.findIndex((item) => item.id === id);
    if (idx === -1) return { ok: false, error: 'Item de saúde não encontrado.' };

    const current = items[idx]!;
    const event: SaudeEvent = {
      id: crypto.randomUUID() as SaudeEventId,
      kind: input.kind,
      date: input.date,
      createdAt: nowISODateTime(),
      ...(input.notes !== undefined && { notes: input.notes }),
      ...(input.cost !== undefined && { cost: input.cost }),
    };

    const updated: SaudeItem = {
      ...current,
      events: [event, ...current.events],
      ...((input.kind === 'completed' || input.kind === 'purchased')
        ? { lastCompletedAt: isoDateToDateTime(input.date) }
        : {}),
    };
    items[idx] = updated;
    this.#writeSaudeItemsLocal(items);
    return { ok: true, data: updated };
  }

  async archiveSaudeItem(id: SaudeItemId): Promise<Result<void>> {
    const result = await this.updateSaudeItem(id, { active: false });
    return result.ok ? { ok: true, data: undefined } : result;
  }

  getListasCompra(): Promise<Result<ListaCompra[]>> {
    return Promise.resolve({ ok: true, data: this.#readListasCompraLocal() });
  }

  async createListaCompra(input: ListaCompraInput): Promise<Result<ListaCompra>> {
    const listas = this.#readListasCompraLocal();
    const lista: ListaCompra = {
      id: crypto.randomUUID() as ListaCompraId,
      title: input.title,
      ...(input.notes !== undefined && { notes: input.notes }),
      active: true,
      createdAt: nowISODateTime(),
      ...(input.plannedFor !== undefined && { plannedFor: input.plannedFor }),
      reminder: input.reminder ?? { mode: 'none' },
      items: [],
    };
    listas.push(lista);
    this.#writeListasCompraLocal(listas);
    return { ok: true, data: lista };
  }

  async updateListaCompra(id: ListaCompraId, patch: ListaCompraPatch): Promise<Result<ListaCompra>> {
    const listas = this.#readListasCompraLocal();
    const idx = listas.findIndex((lista) => lista.id === id);
    if (idx === -1) return { ok: false, error: 'Lista de compra não encontrada.' };

    const updated: ListaCompra = {
      ...listas[idx]!,
      ...(patch.title !== undefined && { title: patch.title }),
      ...(patch.notes !== undefined && { notes: patch.notes }),
      ...(patch.active !== undefined && { active: patch.active }),
      ...(patch.plannedFor !== undefined && { plannedFor: patch.plannedFor }),
      ...(patch.reminder !== undefined && { reminder: patch.reminder }),
    };
    listas[idx] = updated;
    this.#writeListasCompraLocal(listas);
    return { ok: true, data: updated };
  }

  async archiveListaCompra(id: ListaCompraId): Promise<Result<void>> {
    const result = await this.updateListaCompra(id, { active: false });
    return result.ok ? { ok: true, data: undefined } : result;
  }

  async addCompraItem(listaId: ListaCompraId, input: CompraItemInput): Promise<Result<ListaCompra>> {
    const listas = this.#readListasCompraLocal();
    const lista = listas.find((entry) => entry.id === listaId);
    if (!lista) return { ok: false, error: 'Lista de compra não encontrada.' };

    const item: CompraItem = {
      id: crypto.randomUUID() as CompraItemId,
      title: input.title,
      checked: false,
      ...(input.quantity !== undefined && { quantity: input.quantity }),
      ...(input.unit !== undefined && { unit: input.unit }),
      ...(input.preferredStore !== undefined && { preferredStore: input.preferredStore }),
      ...(input.url !== undefined && { url: input.url }),
      ...(input.lastPrice !== undefined && { lastPrice: input.lastPrice }),
      ...(input.targetPrice !== undefined && { targetPrice: input.targetPrice }),
      ...(input.lastPrice !== undefined
        ? {
            priceHistory: [{
              price: input.lastPrice,
              date: todayFromNow(),
              ...(input.preferredStore ? { store: input.preferredStore } : {}),
            }],
          }
        : {}),
      ...(input.notes !== undefined && { notes: input.notes }),
    };
    lista.items.push(item);
    this.#writeListasCompraLocal(listas);
    return { ok: true, data: lista };
  }

  async updateCompraItem(
    listaId: ListaCompraId,
    itemId: CompraItemId,
    patch: CompraItemPatch,
  ): Promise<Result<CompraItem>> {
    const listas = this.#readListasCompraLocal();
    const lista = listas.find((entry) => entry.id === listaId);
    if (!lista) return { ok: false, error: 'Lista de compra não encontrada.' };

    const idx = lista.items.findIndex((item) => item.id === itemId);
    if (idx === -1) return { ok: false, error: 'Item de compra não encontrado.' };

    const updated: CompraItem = {
      ...lista.items[idx]!,
      ...(patch.title !== undefined && { title: patch.title }),
      ...(patch.checked !== undefined && { checked: patch.checked }),
      ...(patch.quantity !== undefined && { quantity: patch.quantity }),
      ...(patch.unit !== undefined && { unit: patch.unit }),
      ...(patch.preferredStore !== undefined && { preferredStore: patch.preferredStore }),
      ...(patch.url !== undefined && { url: patch.url }),
      ...(patch.lastPrice !== undefined && { lastPrice: patch.lastPrice }),
      ...(patch.targetPrice !== undefined && { targetPrice: patch.targetPrice }),
      ...(patch.notes !== undefined && { notes: patch.notes }),
    };
    lista.items[idx] = updated;
    this.#writeListasCompraLocal(listas);
    return { ok: true, data: updated };
  }

  async removeCompraItem(listaId: ListaCompraId, itemId: CompraItemId): Promise<Result<ListaCompra>> {
    const listas = this.#readListasCompraLocal();
    const lista = listas.find((entry) => entry.id === listaId);
    if (!lista) return { ok: false, error: 'Lista de compra não encontrada.' };

    lista.items = lista.items.filter((item) => item.id !== itemId);
    this.#writeListasCompraLocal(listas);
    return { ok: true, data: lista };
  }

  async completeListaCompra(listaId: ListaCompraId, date: ISODate): Promise<Result<ListaCompra>> {
    const listas = this.#readListasCompraLocal();
    const lista = listas.find((entry) => entry.id === listaId);
    if (!lista) return { ok: false, error: 'Lista de compra não encontrada.' };

    lista.lastCompletedAt = isoDateToDateTime(date);
    lista.items = lista.items.map((item) => ({ ...item, checked: false }));
    this.#writeListasCompraLocal(listas);
    return { ok: true, data: lista };
  }

  getFoods(): Promise<Result<Food[]>> {
    return this.#call('GET', '/foods');
  }

  createFood(input: FoodInput): Promise<Result<Food>> {
    return this.#call('POST', '/foods', input);
  }

  updateFood(id: FoodId, patch: Partial<FoodInput & { active: boolean }>): Promise<Result<Food>> {
    return this.#call('PATCH', `/foods/${id}`, patch);
  }

  archiveFood(id: FoodId): Promise<Result<void>> {
    return this.#call('POST', `/foods/${id}/archive`);
  }

  // ── Diary ───────────────────────────────────────────────────────────────────

  getDiaryEntries(date: ISODate): Promise<Result<DiaryEntry[]>> {
    return this.#call('GET', `/diary?date=${date}`);
  }

  createDiaryEntry(input: DiaryEntryInput & { date: ISODate }): Promise<Result<DiaryEntry>> {
    return this.#call('POST', '/diary', input);
  }

  updateDiaryEntry(id: DiaryEntryId, patch: { grams?: number; meal?: string }): Promise<Result<DiaryEntry>> {
    return this.#call('PATCH', `/diary/${id}`, patch);
  }

  deleteDiaryEntry(id: DiaryEntryId): Promise<Result<void>> {
    return this.#call('DELETE', `/diary/${id}`);
  }

  // ── Nutrition Profile ───────────────────────────────────────────────────────

  getNutritionProfile(): Promise<Result<NutritionProfile | null>> {
    return this.#call('GET', '/nutrition/profile');
  }

  saveNutritionProfile(profile: NutritionProfile): Promise<Result<NutritionProfile>> {
    return this.#call('PUT', '/nutrition/profile', profile);
  }

  // ── Nutrition Summary ───────────────────────────────────────────────────────

  getNutritionSummary(date: ISODate): Promise<Result<DailyNutritionSummary>> {
    return this.#getNutritionSummary(date);
  }

  // ── Today ───────────────────────────────────────────────────────────────────

  getGames(): Promise<Result<Game[]>> {
    return this.#call('GET', '/games');
  }

  getSteamLibrarySettings(): Promise<Result<SteamLibrarySettings | null>> {
    return this.#call('GET', '/games/steam-settings');
  }

  saveSteamLibrarySettings(settings: SteamLibrarySettingsInput): Promise<Result<SteamLibrarySettings>> {
    return this.#call('PUT', '/games/steam-settings', settings);
  }

  syncSteamLibrary(): Promise<Result<SteamSyncResult>> {
    return this.#call('POST', '/games/sync-steam');
  }

  // ── Movies ─────────────────────────────────────────────────────────────────

  // The Rust backend does not expose movie endpoints yet, so this slice stays
  // local to keep the desktop/server build usable in the meantime.
  getMovies(): Promise<Result<Movie[]>> {
    return Promise.resolve({ ok: true, data: this.#readMoviesLocal() });
  }

  async createMovie(input: MovieInput): Promise<Result<Movie>> {
    const title = input.title.trim();
    if (!title) {
      return { ok: false, error: 'Título do filme é obrigatório.' };
    }

    if (input.posterUrl !== undefined && !isValidHttpUrl(input.posterUrl)) {
      return { ok: false, error: 'Poster URL inválida.' };
    }

    if (input.year !== undefined && !isValidMovieYear(input.year)) {
      return { ok: false, error: 'Ano inválido.' };
    }

    const enrichment = input.tmdbId !== undefined
      ? await this.#fetchTmdbMovieDetailsLocal(input.tmdbId)
      : null;

    const movies = this.#readMoviesLocal();
    const movie: Movie = {
      id: crypto.randomUUID() as MovieId,
      title,
      ...(input.year !== undefined
        ? { year: input.year }
        : enrichment?.year !== undefined
          ? { year: enrichment.year }
          : {}),
      ...(input.posterUrl !== undefined
        ? { posterUrl: input.posterUrl }
        : enrichment?.posterUrl
          ? { posterUrl: enrichment.posterUrl }
          : {}),
      ...(input.overview !== undefined
        ? { overview: input.overview }
        : enrichment?.overview
          ? { overview: enrichment.overview }
          : {}),
      ...(input.tmdbId !== undefined && { tmdbId: input.tmdbId }),
      status: 'watchlist',
      tags: normalizeMovieTags([...(input.tags ?? []), ...(enrichment?.tags ?? [])]),
      createdAt: nowISODateTime(),
    };

    movies.push(movie);
    this.#writeMoviesLocal(movies);
    return { ok: true, data: movie };
  }

  async updateMovie(
    id: MovieId,
    patch: Partial<Pick<Movie, 'status' | 'rating' | 'tags'>>,
  ): Promise<Result<Movie>> {
    const movies = this.#readMoviesLocal();
    const idx = movies.findIndex((movie) => movie.id === id);
    if (idx === -1) {
      return { ok: false, error: 'Filme não encontrado.' };
    }

    const current = movies[idx]!;
    const requestedStatus = patch.status ?? (patch.rating !== undefined ? 'watched' : current.status);
    const normalizedRating = normalizeMovieRating(patch.rating);
    if (patch.rating !== undefined && normalizedRating === undefined) {
      return { ok: false, error: 'Nota inválida. Use um valor entre 1 e 5.' };
    }

    const updated: Movie = {
      ...current,
      ...(patch.tags !== undefined && { tags: normalizeMovieTags(patch.tags) }),
      status: requestedStatus,
    };

    if (requestedStatus === 'watched') {
      updated.watchedAt = current.status === 'watched' ? current.watchedAt ?? nowISODateTime() : nowISODateTime();
      if (normalizedRating !== undefined) {
        updated.rating = normalizedRating;
      }
    } else {
      delete (updated as Partial<Movie>).rating;
      delete (updated as Partial<Movie>).watchedAt;
    }

    movies[idx] = updated;
    this.#writeMoviesLocal(movies);
    return { ok: true, data: updated };
  }

  deleteMovie(id: MovieId): Promise<Result<void>> {
    const movies = this.#readMoviesLocal();
    if (!movies.some((movie) => movie.id === id)) {
      return Promise.resolve({ ok: false, error: 'Filme não encontrado.' });
    }

    this.#writeMoviesLocal(movies.filter((movie) => movie.id !== id));
    return Promise.resolve({ ok: true, data: undefined });
  }

  async searchTmdbMovies(query: string): Promise<Result<TmdbSearchResult[]>> {
    const normalizedQuery = query.trim();
    if (!normalizedQuery) {
      return { ok: true, data: [] };
    }

    const apiKey = this.#readTmdbApiKeyLocal();
    if (!apiKey) {
      return { ok: false, error: 'Configure a API key do TMDB antes de buscar filmes.' };
    }

    const url = new URL(`${TMDB_API_BASE_URL}/search/movie`);
    url.searchParams.set('api_key', apiKey);
    url.searchParams.set('query', normalizedQuery);
    url.searchParams.set('language', 'pt-BR');
    url.searchParams.set('include_adult', 'false');

    try {
      const response = await fetch(url);
      if (!response.ok) {
        const payload = await safeJson<TmdbErrorPayload>(response);
        return { ok: false, error: payload?.status_message ?? 'Falha ao buscar filmes no TMDB.' };
      }

      const payload = await response.json() as TmdbSearchPayload;
      const results: TmdbSearchResult[] = (payload.results ?? []).flatMap((movie) => {
        if (
          typeof movie?.id !== 'number' ||
          movie.id <= 0 ||
          typeof movie.title !== 'string' ||
          movie.title.trim().length === 0
        ) {
          return [];
        }

        const year = parseTmdbYear(movie.release_date);
        const posterUrl = toTmdbPosterUrl(movie.poster_path);
        return [{
          tmdbId: movie.id,
          title: movie.title.trim(),
          ...(year !== undefined && { year }),
          ...(posterUrl ? { posterUrl } : {}),
          ...(typeof movie.overview === 'string' && movie.overview.trim()
            ? { overview: movie.overview.trim() }
            : {}),
        }];
      });

      return { ok: true, data: results };
    } catch (e) {
      return {
        ok: false,
        error: e instanceof Error ? e.message : 'Falha ao buscar filmes no TMDB.',
      };
    }
  }

  getTmdbApiKey(): Promise<Result<string | null>> {
    return Promise.resolve({ ok: true, data: this.#readTmdbApiKeyLocal() });
  }

  saveTmdbApiKey(apiKey: string): Promise<Result<string>> {
    const normalized = apiKey.trim();
    if (!normalized) {
      localStorage.removeItem(TMDB_API_KEY_KEY);
      return Promise.resolve({ ok: true, data: '' });
    }

    localStorage.setItem(TMDB_API_KEY_KEY, normalized);
    return Promise.resolve({ ok: true, data: normalized });
  }

  // ── Books ──────────────────────────────────────────────────────────────────

  getBooks(): Promise<Result<Book[]>> {
    return this.#call('GET', '/books');
  }

  createBook(input: BookInput): Promise<Result<Book>> {
    return this.#call('POST', '/books', input);
  }

  updateBook(id: BookId, patch: BookPatch): Promise<Result<Book>> {
    return this.#call('PATCH', `/books/${id}`, patch);
  }

  archiveBook(id: BookId): Promise<Result<void>> {
    return this.#call('POST', `/books/${id}/archive`);
  }

  // ── Reading Goals ──────────────────────────────────────────────────────────

  getReadingGoals(): Promise<Result<ReadingGoal[]>> {
    return this.#call('GET', '/reading-goals');
  }

  setReadingGoal(year: number, target: number): Promise<Result<ReadingGoal>> {
    return this.#call('PUT', `/reading-goals/${year}`, { target });
  }

  // ── Today ──────────────────────────────────────────────────────────────────

  getTodaySnapshot(date: ISODate): Promise<Result<TodaySnapshot>> {
    return this.#call('GET', `/today?date=${date}`);
  }

  // ── Internal ────────────────────────────────────────────────────────────────

  async #call<T>(method: string, path: string, body?: unknown): Promise<Result<T>> {
    try {
      const res = await fetch(`${this.baseUrl}${path}`, {
        method,
        headers: body !== undefined ? { 'Content-Type': 'application/json' } : {},
        ...(body !== undefined && { body: JSON.stringify(body) }),
      });
      const text = await res.text();
      if (!text) {
        return { ok: false, error: `Server returned ${res.status} with no body (${method} ${path})` };
      }
      try {
        return JSON.parse(text) as Result<T>;
      } catch {
        return { ok: false, error: `Server returned ${res.status}: ${text.slice(0, 200)}` };
      }
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : 'Network error' };
    }
  }

  async #getNutritionSummary(date: ISODate): Promise<Result<DailyNutritionSummary>> {
    const result = await this.#call<RestNutritionSummary>('GET', `/nutrition/summary?date=${date}`);
    if (!result.ok) return result;
    return { ok: true, data: normalizeNutritionSummary(date, result.data) };
  }

  #readSaudeItemsLocal(): SaudeItem[] {
    const raw = localStorage.getItem(SAUDE_KEY);
    if (!raw) return [];
    try {
      return SaudeItemArraySchema.parse(JSON.parse(raw)) as unknown as SaudeItem[];
    } catch {
      return [];
    }
  }

  #writeSaudeItemsLocal(items: SaudeItem[]): void {
    localStorage.setItem(SAUDE_KEY, JSON.stringify(items));
  }

  #readListasCompraLocal(): ListaCompra[] {
    const raw = localStorage.getItem(COMPRAS_KEY);
    if (!raw) return [];
    try {
      return ListaCompraArraySchema.parse(JSON.parse(raw)) as unknown as ListaCompra[];
    } catch {
      return [];
    }
  }

  #writeListasCompraLocal(listas: ListaCompra[]): void {
    localStorage.setItem(COMPRAS_KEY, JSON.stringify(listas));
  }

  #readMoviesLocal(): Movie[] {
    const raw = localStorage.getItem(MOVIES_KEY);
    if (!raw) return [];

    try {
      return MovieArraySchema.parse(JSON.parse(raw)) as unknown as Movie[];
    } catch (e) {
      console.error(`[RestApiAdapter] Invalid data in "${MOVIES_KEY}", falling back to []:`, e);
      return [];
    }
  }

  #writeMoviesLocal(movies: Movie[]): void {
    localStorage.setItem(MOVIES_KEY, JSON.stringify(movies));
  }

  #readTmdbApiKeyLocal(): string | null {
    const raw = localStorage.getItem(TMDB_API_KEY_KEY)?.trim();
    return raw ? raw : null;
  }

  async #fetchTmdbMovieDetailsLocal(tmdbId: number): Promise<{
    year?: number;
    posterUrl?: string;
    overview?: string;
    tags: string[];
  } | null> {
    const apiKey = this.#readTmdbApiKeyLocal();
    if (!apiKey) {
      return null;
    }

    const url = new URL(`${TMDB_API_BASE_URL}/movie/${tmdbId}`);
    url.searchParams.set('api_key', apiKey);
    url.searchParams.set('language', 'pt-BR');

    try {
      const response = await fetch(url);
      if (!response.ok) {
        return null;
      }

      const payload = await response.json() as TmdbMovieDetailsPayload;
      const tags = Array.isArray(payload.genres)
        ? payload.genres
          .map((genre) => typeof genre?.name === 'string' ? genre.name : '')
          .filter((genre) => genre.trim().length > 0)
        : [];

      const year = parseTmdbYear(payload.release_date);
      const posterUrl = toTmdbPosterUrl(payload.poster_path);

      return {
        ...(year !== undefined ? { year } : {}),
        ...(posterUrl ? { posterUrl } : {}),
        ...(typeof payload.overview === 'string' && payload.overview.trim()
          ? { overview: payload.overview.trim() }
          : {}),
        tags,
      };
    } catch {
      return null;
    }
  }
}

type RestNutritionSummary = {
  date?: ISODate;
  entries?: unknown;
  totals?: Partial<DailyTargets>;
  targets?: Partial<DailyTargets>;
  percentages?: Partial<Record<keyof DailyTargets, number>>;
};

function normalizeNutritionSummary(
  requestedDate: ISODate,
  summary: RestNutritionSummary,
): DailyNutritionSummary {
  const totals = {
    ...emptyDailyTargets(),
    ...summary.totals,
  } satisfies DailyTargets;
  const targets = {
    ...defaultNutritionTargets(),
    ...summary.targets,
  } satisfies DailyTargets;
  const percentages = {
    ...computePercentages(totals, targets),
    ...summary.percentages,
  } satisfies DailyNutritionSummary['percentages'];

  return {
    date: summary.date ?? requestedDate,
    entries: isDiaryEntryArray(summary.entries) ? summary.entries : [],
    totals,
    targets,
    percentages,
  };
}

function isDiaryEntryArray(value: unknown): value is DiaryEntry[] {
  return Array.isArray(value) && value.every(isDiaryEntry);
}

function isDiaryEntry(value: unknown): value is DiaryEntry {
  if (!value || typeof value !== 'object') return false;
  const entry = value as Record<string, unknown>;
  return (
    typeof entry.id === 'string' &&
    typeof entry.date === 'string' &&
    typeof entry.grams === 'number' &&
    (entry.type === 'food' || entry.type === 'quick')
  );
}

function emptyDailyTargets(): DailyTargets {
  return {
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    fiber: 0,
  };
}

function defaultNutritionTargets(): DailyTargets {
  return {
    calories: 2000,
    protein: 50,
    carbs: 250,
    fat: 65,
    fiber: 25,
  };
}

type TmdbSearchPayload = {
  results?: Array<{
    id?: number;
    title?: string;
    release_date?: string;
    poster_path?: string | null;
    overview?: string;
  }>;
};

type TmdbMovieDetailsPayload = {
  release_date?: string;
  poster_path?: string | null;
  overview?: string;
  genres?: Array<{ id?: number; name?: string }>;
};

type TmdbErrorPayload = {
  status_message?: string;
};

function normalizeMovieTags(tags: string[]): string[] {
  const seen = new Set<string>();
  const normalized: string[] = [];

  for (const tag of tags) {
    const trimmed = tag.trim();
    if (!trimmed) continue;
    const key = trimmed.toLocaleLowerCase('pt-BR');
    if (seen.has(key)) continue;
    seen.add(key);
    normalized.push(trimmed);
  }

  return normalized;
}

function normalizeMovieRating(rating: Movie['rating']): Movie['rating'] {
  return rating !== undefined && [1, 2, 3, 4, 5].includes(rating)
    ? rating
    : undefined;
}

function isValidMovieYear(year: number): boolean {
  return Number.isInteger(year) && year >= 1888 && year <= 3000;
}

function isValidHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function parseTmdbYear(value?: string): number | undefined {
  if (!value) return undefined;
  const year = Number.parseInt(value.slice(0, 4), 10);
  return isValidMovieYear(year) ? year : undefined;
}

function toTmdbPosterUrl(path?: string | null): string | undefined {
  if (!path) return undefined;
  return `${TMDB_IMAGE_BASE_URL}${path}`;
}

async function safeJson<T>(response: Response): Promise<T | null> {
  try {
    return await response.json() as T;
  } catch {
    return null;
  }
}

function isoDateToDateTime(date: ISODate) {
  return new Date(`${date}T12:00:00.000Z`).toISOString() as ReturnType<typeof nowISODateTime>;
}

function todayFromNow(): ISODate {
  return nowISODateTime().slice(0, 10) as ISODate;
}
