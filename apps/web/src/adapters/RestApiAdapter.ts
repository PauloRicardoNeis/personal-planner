import {
  computePercentages,
  DataAdapter,
  Result,
  TodaySnapshot,
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
} from '@planner/core';

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
      return (await res.json()) as Result<T>;
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : 'Network error' };
    }
  }

  async #getNutritionSummary(date: ISODate): Promise<Result<DailyNutritionSummary>> {
    const result = await this.#call<RestNutritionSummary>('GET', `/nutrition/summary?date=${date}`);
    if (!result.ok) return result;
    return { ok: true, data: normalizeNutritionSummary(date, result.data) };
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
