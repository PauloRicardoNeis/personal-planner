/* v8 ignore file -- TypeScript-only public contract; executable behavior is covered by adapter implementations. */
import type { Habit, HabitInput } from '../models/habit.js';
import type { Dever, DeverBase, DeverInput } from '../models/dever.js';
import type { Projeto, ProjetoInput, ProjetoPatch, EtapaInput, EtapaPatch } from '../models/projeto.js';
import type {
  HabitId,
  DeverId,
  ProjetoId,
  EtapaId,
  ISODate,
  FoodId,
  DiaryEntryId,
  BookId,
  MovieId,
  SaudeItemId,
  ListaCompraId,
  CompraItemId,
} from '../models/shared.js';
import type { Food, FoodInput, DiaryEntry, DiaryEntryInput, NutritionProfile, DailyNutritionSummary } from '../models/nutrition.js';
import type { Game, SteamLibrarySettings, SteamLibrarySettingsInput, SteamSyncResult } from '../models/game.js';
import type { Book, BookInput, BookPatch, ReadingGoal } from '../models/book.js';
import type { Movie, MovieInput, TmdbSearchResult } from '../models/movie.js';
import type { SaudeItem, SaudeItemInput, SaudeItemPatch, SaudeEventInput } from '../models/saude.js';
import type {
  ListaCompra,
  ListaCompraInput,
  ListaCompraPatch,
  CompraItem,
  CompraItemInput,
  CompraItemPatch,
} from '../models/compra.js';
import type { HabitStreakInfo } from '../domain/streaks.js';
import type { HabitDayProgressSummary, HabitProgress } from '../domain/habits.js';
import type { ProjetoProgress } from '../domain/projeto.js';

// ── Result type ───────────────────────────────────────────────────────────────

/**
 * All adapter methods return Result<T> instead of throwing.
 * Callers handle errors explicitly without try/catch at the boundary.
 */
export type Result<T> = { ok: true; data: T } | { ok: false; error: string };

// ── Today view ────────────────────────────────────────────────────────────────

export interface TodaySnapshot {
  date: ISODate;
  /** All active habits with their completion status for this date */
  habits: Array<{
    habit: Habit;
    isDone: boolean;
    progress: HabitProgress;
    streak: HabitStreakInfo;
  }>;
  habitProgress: HabitDayProgressSummary;
  /**
   * All deveres due today (recurrence fires today) + overdue once-deveres.
   * Ordering: overdue first, then due-today; within each group: high → medium → low.
   */
  deveres: Array<{
    dever: Dever;
    /** For once-deveres: the deadline. For cyclic: the date the recurrence fires. */
    occurrenceDate: ISODate;
    isDone: boolean;
    /** true when overdue — once-deveres past deadline, or cyclic monthly window past end without completion */
    isOverdue: boolean;
  }>;

  /** Active projects with progress and next actionable etapas */
  projetos: Array<{
    projeto: Projeto;
    progress: ProjetoProgress;
    nextEtapas: import('../models/projeto.js').Etapa[];
  }>;

  saude: Array<{
    item: SaudeItem;
    nextDate: ISODate;
    isOverdue: boolean;
  }>;

  compras: Array<{
    lista: ListaCompra;
    nextDate: ISODate;
    isOverdue: boolean;
    pendingItems: number;
    totalItems: number;
  }>;

  nutritionSummary?: {
    calories: number;
    caloriesTarget: number;
    caloriesPercent: number;
    protein: number;
    proteinTarget: number;
    proteinPercent: number;
    carbs: number;
    carbsTarget: number;
    carbsPercent: number;
    fat: number;
    fatTarget: number;
    fatPercent: number;
  };
}

// ── The contract ──────────────────────────────────────────────────────────────

/**
 * DataAdapter — the single interface the frontend depends on for all data access.
 *
 * The concrete implementation (LocalStorageAdapter, RestApiAdapter) is selected
 * in ONE place: apps/web/src/adapter.ts.
 *
 * Rules:
 * - Never import a concrete adapter class outside of apps/web/src/adapter.ts
 * - All methods return Promise<Result<T>> — never throw across this boundary
 * - updateDever cannot change `type` or `recurrence` — archive and recreate instead
 */
export interface DataAdapter {
  // ── Habits ──────────────────────────────────────────────────────────────────

  /** Returns all habits, including archived ones */
  getHabits(): Promise<Result<Habit[]>>;

  /** Creates a new habit. ID and createdAt are assigned by the adapter. */
  createHabit(input: HabitInput): Promise<Result<Habit>>;

  /** Updates mutable habit fields. Does not affect completions. */
  updateHabit(
    id: HabitId,
    patch: Partial<HabitInput & { active: boolean }>,
  ): Promise<Result<Habit>>;

  /** Adds one completed occurrence for a habit on the given date. */
  markHabitDone(id: HabitId, date: ISODate): Promise<Result<Habit>>;

  /** Removes one completed occurrence for the given date. Idempotent at zero. */
  unmarkHabitDone(id: HabitId, date: ISODate): Promise<Result<Habit>>;

  /** Soft-deletes a habit (sets active: false). */
  archiveHabit(id: HabitId): Promise<Result<void>>;

  // ── Deveres ─────────────────────────────────────────────────────────────────

  /** Returns all deveres, including archived ones */
  getDeveres(): Promise<Result<Dever[]>>;

  /** Creates a new dever. ID and createdAt are assigned by the adapter. */
  createDever(input: DeverInput): Promise<Result<Dever>>;

  /**
   * Updates mutable dever fields.
   * Cannot change `type` or `recurrence` — archive and recreate for that.
   */
  updateDever(
    id: DeverId,
    patch: Partial<Pick<DeverBase, 'title' | 'area' | 'priority' | 'active'>>,
  ): Promise<Result<Dever>>;

  /**
   * Records completion of a specific occurrence.
   * occurrenceDate: the scheduled date of the occurrence being completed.
   * Idempotent: completing an already-completed occurrence is a no-op.
   */
  markDeverDone(id: DeverId, occurrenceDate: ISODate): Promise<Result<Dever>>;

  /** Removes a completion record for an occurrence. Idempotent. */
  unmarkDeverDone(id: DeverId, occurrenceDate: ISODate): Promise<Result<Dever>>;

  /** Soft-deletes a dever (sets active: false). */
  archiveDever(id: DeverId): Promise<Result<void>>;

  // ── Projetos ──────────────────────────────────────────────────────────────────

  /** Returns all projetos, including archived ones */
  getProjetos(): Promise<Result<Projeto[]>>;

  /** Creates a new projeto. ID and createdAt are assigned by the adapter. */
  createProjeto(input: ProjetoInput): Promise<Result<Projeto>>;

  /** Updates mutable projeto fields (not etapas). */
  updateProjeto(id: ProjetoId, patch: ProjetoPatch): Promise<Result<Projeto>>;

  /** Sets status to 'archived'. */
  archiveProjeto(id: ProjetoId): Promise<Result<void>>;

  /** Adds a new etapa to a projeto. Returns the updated projeto. */
  addEtapa(projetoId: ProjetoId, input: EtapaInput): Promise<Result<Projeto>>;

  /** Updates an etapa within a projeto. Returns the updated projeto. */
  updateEtapa(projetoId: ProjetoId, etapaId: EtapaId, patch: EtapaPatch): Promise<Result<Projeto>>;

  /** Removes an etapa from a projeto. Returns the updated projeto. */
  removeEtapa(projetoId: ProjetoId, etapaId: EtapaId): Promise<Result<Projeto>>;

  /** Reorders etapas by providing the full ordered list of IDs. */
  reorderEtapas(projetoId: ProjetoId, etapaIds: EtapaId[]): Promise<Result<Projeto>>;

  // ── Saúde ───────────────────────────────────────────────────────────────────

  getSaudeItems(): Promise<Result<SaudeItem[]>>;
  createSaudeItem(input: SaudeItemInput): Promise<Result<SaudeItem>>;
  updateSaudeItem(id: SaudeItemId, patch: SaudeItemPatch): Promise<Result<SaudeItem>>;
  recordSaudeEvent(id: SaudeItemId, input: SaudeEventInput): Promise<Result<SaudeItem>>;
  archiveSaudeItem(id: SaudeItemId): Promise<Result<void>>;

  // ── Compras ─────────────────────────────────────────────────────────────────

  getListasCompra(): Promise<Result<ListaCompra[]>>;
  createListaCompra(input: ListaCompraInput): Promise<Result<ListaCompra>>;
  updateListaCompra(id: ListaCompraId, patch: ListaCompraPatch): Promise<Result<ListaCompra>>;
  archiveListaCompra(id: ListaCompraId): Promise<Result<void>>;
  addCompraItem(listaId: ListaCompraId, input: CompraItemInput): Promise<Result<ListaCompra>>;
  updateCompraItem(
    listaId: ListaCompraId,
    itemId: CompraItemId,
    patch: CompraItemPatch,
  ): Promise<Result<CompraItem>>;
  removeCompraItem(listaId: ListaCompraId, itemId: CompraItemId): Promise<Result<ListaCompra>>;
  completeListaCompra(listaId: ListaCompraId, date: ISODate): Promise<Result<ListaCompra>>;

  // ── Foods ───────────────────────────────────────────────────────────────────

  getFoods(): Promise<Result<Food[]>>;
  createFood(input: FoodInput): Promise<Result<Food>>;
  updateFood(id: FoodId, patch: Partial<FoodInput & { active: boolean }>): Promise<Result<Food>>;
  archiveFood(id: FoodId): Promise<Result<void>>;

  // ── Diary ───────────────────────────────────────────────────────────────────

  getDiaryEntries(date: ISODate): Promise<Result<DiaryEntry[]>>;
  createDiaryEntry(input: DiaryEntryInput & { date: ISODate }): Promise<Result<DiaryEntry>>;
  updateDiaryEntry(id: DiaryEntryId, patch: { grams?: number; meal?: string }): Promise<Result<DiaryEntry>>;
  deleteDiaryEntry(id: DiaryEntryId): Promise<Result<void>>;

  // ── Nutrition Profile ───────────────────────────────────────────────────────

  getNutritionProfile(): Promise<Result<NutritionProfile | null>>;
  saveNutritionProfile(profile: NutritionProfile): Promise<Result<NutritionProfile>>;

  // ── Nutrition Summary ───────────────────────────────────────────────────────

  getNutritionSummary(date: ISODate): Promise<Result<DailyNutritionSummary>>;

  // ── Today ────────────────────────────────────────────────────────────────────

  /**
   * Returns a pre-assembled snapshot for the given date.
   * The adapter is responsible for:
   * - determining which cyclic deveres fire on this date (via isOccurrenceOn)
   * - including overdue once-deveres (deadline < date, not completed)
   * - computing isDone and isOverdue for each item
   * - applying the ordering rules
   *
   * This keeps scheduling logic testable in isolation, out of React components.
   */
  // ── Games ───────────────────────────────────────────────────────────────────

  getGames(): Promise<Result<Game[]>>;
  getSteamLibrarySettings(): Promise<Result<SteamLibrarySettings | null>>;
  saveSteamLibrarySettings(settings: SteamLibrarySettingsInput): Promise<Result<SteamLibrarySettings>>;
  syncSteamLibrary(): Promise<Result<SteamSyncResult>>;

  // ── Movies ─────────────────────────────────────────────────────────────────

  getMovies(): Promise<Result<Movie[]>>;
  createMovie(input: MovieInput): Promise<Result<Movie>>;
  updateMovie(
    id: MovieId,
    patch: Partial<Pick<Movie, 'status' | 'rating' | 'tags'>>,
  ): Promise<Result<Movie>>;
  deleteMovie(id: MovieId): Promise<Result<void>>;
  searchTmdbMovies(query: string): Promise<Result<TmdbSearchResult[]>>;
  getTmdbApiKey(): Promise<Result<string | null>>;
  saveTmdbApiKey(apiKey: string): Promise<Result<string>>;

  // ── Books ──────────────────────────────────────────────────────────────────

  getBooks(): Promise<Result<Book[]>>;
  createBook(input: BookInput): Promise<Result<Book>>;
  updateBook(id: BookId, patch: BookPatch): Promise<Result<Book>>;
  archiveBook(id: BookId): Promise<Result<void>>;

  // ── Reading Goals ──────────────────────────────────────────────────────────

  getReadingGoals(): Promise<Result<ReadingGoal[]>>;
  setReadingGoal(year: number, target: number): Promise<Result<ReadingGoal>>;

  // ── Today ──────────────────────────────────────────────────────────────────

  getTodaySnapshot(date: ISODate): Promise<Result<TodaySnapshot>>;
}
