// ── Models ────────────────────────────────────────────────────────────────────
export type {
  ISODate,
  ISODateTime,
  HabitId,
  DeverId,
  ProjetoId,
  EtapaId,
  FoodId,
  DiaryEntryId,
  GameId,
  BookId,
  MovieId,
  SaudeItemId,
  SaudeEventId,
  ListaCompraId,
  CompraItemId,
  WeekdayName,
  DailyRecurrence,
  WeeklyRecurrence,
  MonthlyRecurrence,
  RecurrenceConfig,
} from './models/shared.js';

export {
  ISODateSchema,
  ISODateTimeSchema,
  WeekdayNameSchema,
  DailyRecurrenceSchema,
  WeeklyRecurrenceSchema,
  MonthlyRecurrenceSchema,
  RecurrenceConfigSchema,
  toISODate,
  todayISODate,
  nowISODateTime,
} from './models/shared.js';

export type { Habit, HabitInput } from './models/habit.js';
export { HabitSchema, HabitArraySchema } from './models/habit.js';

export type {
  DeverCompletion,
  DeverBase,
  OnceDever,
  CyclicDever,
  Dever,
  DeverInput,
} from './models/dever.js';
export { OnceDeverSchema, CyclicDeverSchema, DeverSchema, DeverArraySchema } from './models/dever.js';

export type {
  Etapa,
  EtapaInput,
  EtapaPatch,
  EtapaStatus,
  Projeto,
  ProjetoInput,
  ProjetoPatch,
  ProjetoStatus,
} from './models/projeto.js';
export { EtapaSchema, ProjetoSchema, ProjetoArraySchema } from './models/projeto.js';

export type {
  NutrientsPer100g,
  Food,
  FoodInput,
  FoodDiaryEntry,
  QuickDiaryEntry,
  DiaryEntry,
  DiaryEntryInput,
  NutritionProfile,
  DailyTargets,
  DailyNutritionSummary,
} from './models/nutrition.js';

export {
  NutrientsPer100gSchema,
  FoodSchema,
  FoodArraySchema,
  FoodDiaryEntrySchema,
  QuickDiaryEntrySchema,
  DiaryEntrySchema,
  DiaryEntryArraySchema,
  NutritionProfileSchema,
} from './models/nutrition.js';

export type {
  Game,
  SteamLibrarySettings,
  SteamLibrarySettingsInput,
  SteamSyncResult,
} from './models/game.js';

export {
  GameSchema,
  GameArraySchema,
  SteamLibrarySettingsSchema,
  SteamSyncResultSchema,
} from './models/game.js';

export type {
  Book,
  BookInput,
  BookPatch,
  BookStatus,
  ReadingGoal,
} from './models/book.js';

export {
  BookStatusSchema,
  BookSchema,
  BookArraySchema,
  ReadingGoalSchema,
  ReadingGoalArraySchema,
} from './models/book.js';

export type {
  Movie,
  MovieInput,
  MovieRating,
  TmdbSearchResult,
} from './models/movie.js';

export {
  MovieRatingSchema,
  MovieSchema,
  MovieArraySchema,
  TmdbSearchResultSchema,
  TmdbSearchResultArraySchema,
} from './models/movie.js';

export type {
  SaudeItemType,
  SaudeEventKind,
  SaudeIntervalUnit,
  SaudeSchedule,
  SaudeEvent,
  SaudeItem,
  SaudeItemInput,
  SaudeItemPatch,
  SaudeEventInput,
} from './models/saude.js';

export {
  SaudeItemTypeSchema,
  SaudeEventKindSchema,
  SaudeIntervalUnitSchema,
  SaudeScheduleSchema,
  SaudeEventSchema,
  SaudeItemSchema,
  SaudeItemArraySchema,
} from './models/saude.js';

export type {
  CompraIntervalUnit,
  CompraReminder,
  CompraPricePoint,
  CompraItem,
  ListaCompra,
  ListaCompraInput,
  ListaCompraPatch,
  CompraItemInput,
  CompraItemPatch,
} from './models/compra.js';

export {
  CompraIntervalUnitSchema,
  CompraReminderSchema,
  CompraPricePointSchema,
  CompraItemSchema,
  ListaCompraSchema,
  ListaCompraArraySchema,
} from './models/compra.js';

// ── Contracts ─────────────────────────────────────────────────────────────────
export type { Result, TodaySnapshot, DataAdapter } from './contracts/DataAdapter.js';

// ── Domain ────────────────────────────────────────────────────────────────────
export {
  getDeverStartDate,
  hasExplicitDeverStart,
  getOnceDeverOccurrenceDate,
  getOnceDeverCalendarDate,
} from './domain/dever.js';
export { isOccurrenceOn, getMonthlyWindowInfo } from './domain/recurrence.js';

export type { ProjetoProgress, ProjetoEffort } from './domain/projeto.js';
export {
  computeProjetoProgress,
  computeProjetoEffort,
  getBlockedEtapas,
  getNextEtapas,
  canTransitionEtapa,
  wouldCreateCycle,
} from './domain/projeto.js';

export type { HabitStreakInfo } from './domain/streaks.js';
export { computeStreaks } from './domain/streaks.js';

export type { ParsedSteamProfile } from './domain/steam.js';
export { parseSteamProfile, normalizeSteamOwnedGamesResponse } from './domain/steam.js';

export type { OpenLibrarySearchResult } from './domain/openLibrary.js';
export { parseOpenLibraryResponse } from './domain/openLibrary.js';

export {
  computePortionNutrients,
  computeDailyTotals,
  computeDailyTargets,
  computePercentages,
} from './domain/nutrition.js';

export type { SaudeDueInfo } from './domain/saude.js';
export { getSaudeDueInfo } from './domain/saude.js';

export type { ListaCompraDueInfo } from './domain/compras.js';
export { getListaCompraDueInfo } from './domain/compras.js';
