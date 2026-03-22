import {
  HabitArraySchema,
  DeverArraySchema,
  FoodArraySchema,
  DiaryEntryArraySchema,
  NutritionProfileSchema,
  isOccurrenceOn,
  nowISODateTime,
  computeStreaks,
  computePortionNutrients,
  computeDailyTotals,
  computeDailyTargets,
  computePercentages,
  type DataAdapter,
  type Result,
  type TodaySnapshot,
  type Habit,
  type HabitInput,
  type HabitId,
  type Dever,
  type DeverBase,
  type DeverInput,
  type DeverId,
  type ISODate,
  type Food,
  type FoodInput,
  type FoodId,
  type DiaryEntry,
  type DiaryEntryInput,
  type DiaryEntryId,
  type NutritionProfile,
  type DailyNutritionSummary,
} from '@planner/core';

const HABITS_KEY = 'planner_habits';
const DEVERES_KEY = 'planner_deveres';
const FOODS_KEY = 'planner_foods';
const DIARY_KEY = 'planner_diary';
const PROFILE_KEY = 'planner_nutrition_profile';

const PRIORITY_ORDER: Record<'low' | 'medium' | 'high', number> = {
  high: 0,
  medium: 1,
  low: 2,
};

export class LocalStorageAdapter implements DataAdapter {
  // ── Habits ──────────────────────────────────────────────────────────────────

  async getHabits(): Promise<Result<Habit[]>> {
    return ok(this.#readHabits());
  }

  async createHabit(input: HabitInput): Promise<Result<Habit>> {
    const habits = this.#readHabits();
    const habit: Habit = {
      id: crypto.randomUUID() as HabitId,
      title: input.title,
      ...(input.category !== undefined && { category: input.category }),
      active: true,
      createdAt: nowISODateTime(),
      completions: {},
    };
    habits.push(habit);
    this.#writeHabits(habits);
    return ok(habit);
  }

  async updateHabit(id: HabitId, patch: Partial<HabitInput & { active: boolean }>): Promise<Result<Habit>> {
    const habits = this.#readHabits();
    const idx = habits.findIndex((h) => h.id === id);
    if (idx === -1) return err(`Habit not found: ${id}`);
    const current = habits[idx]!;
    const updated: Habit = {
      ...current,
      ...(patch.title !== undefined && { title: patch.title }),
      ...(patch.category !== undefined && { category: patch.category }),
      ...(patch.active !== undefined && { active: patch.active }),
    };
    habits[idx] = updated;
    this.#writeHabits(habits);
    return ok(updated);
  }

  async markHabitDone(id: HabitId, date: ISODate): Promise<Result<Habit>> {
    const habits = this.#readHabits();
    const idx = habits.findIndex((h) => h.id === id);
    if (idx === -1) return err(`Habit not found: ${id}`);
    const habit = habits[idx]!;
    habit.completions[date] = true;
    this.#writeHabits(habits);
    return ok(habit);
  }

  async unmarkHabitDone(id: HabitId, date: ISODate): Promise<Result<Habit>> {
    const habits = this.#readHabits();
    const idx = habits.findIndex((h) => h.id === id);
    if (idx === -1) return err(`Habit not found: ${id}`);
    const habit = habits[idx]!;
    delete (habit.completions as Record<string, unknown>)[date];
    this.#writeHabits(habits);
    return ok(habit);
  }

  async archiveHabit(id: HabitId): Promise<Result<void>> {
    const result = await this.updateHabit(id, { active: false });
    if (!result.ok) return result;
    return ok(undefined);
  }

  // ── Deveres ─────────────────────────────────────────────────────────────────

  async getDeveres(): Promise<Result<Dever[]>> {
    return ok(this.#readDeveres());
  }

  async createDever(input: DeverInput): Promise<Result<Dever>> {
    const deveres = this.#readDeveres();
    const base = {
      id: crypto.randomUUID() as DeverId,
      title: input.title,
      ...(input.area !== undefined && { area: input.area }),
      priority: input.priority,
      active: true,
      createdAt: nowISODateTime(),
      completions: [] as Dever['completions'],
    };
    const dever: Dever =
      input.type === 'once'
        ? { ...base, type: 'once', deadline: input.deadline }
        : { ...base, type: 'cyclic', recurrence: input.recurrence };
    deveres.push(dever);
    this.#writeDeveres(deveres);
    return ok(dever);
  }

  async updateDever(id: DeverId, patch: Partial<Pick<DeverBase, 'title' | 'area' | 'priority' | 'active'>>): Promise<Result<Dever>> {
    const deveres = this.#readDeveres();
    const idx = deveres.findIndex((d) => d.id === id);
    if (idx === -1) return err(`Dever not found: ${id}`);
    const current = deveres[idx]!;
    const updated: Dever = {
      ...current,
      ...(patch.title !== undefined && { title: patch.title }),
      ...(patch.area !== undefined && { area: patch.area }),
      ...(patch.priority !== undefined && { priority: patch.priority }),
      ...(patch.active !== undefined && { active: patch.active }),
    } as Dever;
    deveres[idx] = updated;
    this.#writeDeveres(deveres);
    return ok(updated);
  }

  async markDeverDone(id: DeverId, occurrenceDate: ISODate): Promise<Result<Dever>> {
    const deveres = this.#readDeveres();
    const idx = deveres.findIndex((d) => d.id === id);
    if (idx === -1) return err(`Dever not found: ${id}`);
    const dever = deveres[idx]!;
    if (!dever.completions.some((c) => c.occurrenceDate === occurrenceDate)) {
      dever.completions.push({ occurrenceDate, completedAt: nowISODateTime() });
    }
    this.#writeDeveres(deveres);
    return ok(dever);
  }

  async unmarkDeverDone(id: DeverId, occurrenceDate: ISODate): Promise<Result<Dever>> {
    const deveres = this.#readDeveres();
    const idx = deveres.findIndex((d) => d.id === id);
    if (idx === -1) return err(`Dever not found: ${id}`);
    const dever = deveres[idx]!;
    dever.completions = dever.completions.filter((c) => c.occurrenceDate !== occurrenceDate);
    this.#writeDeveres(deveres);
    return ok(dever);
  }

  async archiveDever(id: DeverId): Promise<Result<void>> {
    const result = await this.updateDever(id, { active: false });
    if (!result.ok) return result;
    return ok(undefined);
  }

  // ── Foods ───────────────────────────────────────────────────────────────────

  async getFoods(): Promise<Result<Food[]>> {
    return ok(this.#readFoods());
  }

  async createFood(input: FoodInput): Promise<Result<Food>> {
    const foods = this.#readFoods();
    const food: Food = {
      id: crypto.randomUUID() as FoodId,
      name: input.name,
      ...(input.brand !== undefined && { brand: input.brand }),
      ...(input.category !== undefined && { category: input.category }),
      ...(input.servingDescription !== undefined && { servingDescription: input.servingDescription }),
      ...(input.servingGrams !== undefined && { servingGrams: input.servingGrams }),
      nutrients: input.nutrients,
      active: true,
      createdAt: nowISODateTime(),
    };
    foods.push(food);
    this.#writeFoods(foods);
    return ok(food);
  }

  async updateFood(id: FoodId, patch: Partial<FoodInput & { active: boolean }>): Promise<Result<Food>> {
    const foods = this.#readFoods();
    const idx = foods.findIndex((f) => f.id === id);
    if (idx === -1) return err(`Food not found: ${id}`);
    const current = foods[idx]!;
    const updated: Food = {
      ...current,
      ...(patch.name !== undefined && { name: patch.name }),
      ...(patch.brand !== undefined && { brand: patch.brand }),
      ...(patch.category !== undefined && { category: patch.category }),
      ...(patch.servingDescription !== undefined && { servingDescription: patch.servingDescription }),
      ...(patch.servingGrams !== undefined && { servingGrams: patch.servingGrams }),
      ...(patch.nutrients !== undefined && { nutrients: patch.nutrients }),
      ...(patch.active !== undefined && { active: patch.active }),
    };
    foods[idx] = updated;
    this.#writeFoods(foods);
    return ok(updated);
  }

  async archiveFood(id: FoodId): Promise<Result<void>> {
    const result = await this.updateFood(id, { active: false });
    if (!result.ok) return result;
    return ok(undefined);
  }

  // ── Diary ───────────────────────────────────────────────────────────────────

  async getDiaryEntries(date: ISODate): Promise<Result<DiaryEntry[]>> {
    const all = this.#readDiary();
    return ok(all.filter((e) => e.date === date));
  }

  async createDiaryEntry(input: DiaryEntryInput & { date: ISODate }): Promise<Result<DiaryEntry>> {
    const diary = this.#readDiary();
    let entry: DiaryEntry;
    if (input.type === 'food') {
      entry = {
        type: 'food',
        id: crypto.randomUUID() as DiaryEntryId,
        date: input.date,
        foodId: input.foodId,
        grams: input.grams,
        ...(input.meal !== undefined && { meal: input.meal }),
        createdAt: nowISODateTime(),
      };
    } else {
      entry = {
        type: 'quick',
        id: crypto.randomUUID() as DiaryEntryId,
        date: input.date,
        description: input.description,
        grams: input.grams,
        nutrients: input.nutrients,
        ...(input.meal !== undefined && { meal: input.meal }),
        createdAt: nowISODateTime(),
      };
    }
    diary.push(entry);
    this.#writeDiary(diary);
    return ok(entry);
  }

  async updateDiaryEntry(id: DiaryEntryId, patch: { grams?: number; meal?: string }): Promise<Result<DiaryEntry>> {
    const diary = this.#readDiary();
    const idx = diary.findIndex((e) => e.id === id);
    if (idx === -1) return err(`Diary entry not found: ${id}`);
    const current = diary[idx]!;
    const updated: DiaryEntry = {
      ...current,
      ...(patch.grams !== undefined && { grams: patch.grams }),
      ...(patch.meal !== undefined && { meal: patch.meal }),
    } as DiaryEntry;
    diary[idx] = updated;
    this.#writeDiary(diary);
    return ok(updated);
  }

  async deleteDiaryEntry(id: DiaryEntryId): Promise<Result<void>> {
    const diary = this.#readDiary();
    const filtered = diary.filter((e) => e.id !== id);
    this.#writeDiary(filtered);
    return ok(undefined);
  }

  // ── Nutrition Profile ───────────────────────────────────────────────────────

  async getNutritionProfile(): Promise<Result<NutritionProfile | null>> {
    return ok(this.#readProfile());
  }

  async saveNutritionProfile(profile: NutritionProfile): Promise<Result<NutritionProfile>> {
    this.#writeProfile(profile);
    return ok(profile);
  }

  // ── Nutrition Summary ───────────────────────────────────────────────────────

  async getNutritionSummary(date: ISODate): Promise<Result<DailyNutritionSummary>> {
    const entries = this.#readDiary().filter((e) => e.date === date);
    const foods = this.#readFoods();
    const profile = this.#readProfile();

    const totals = computeDailyTotals(entries, foods);
    const targets = profile ? computeDailyTargets(profile) : {
      calories: 2000, protein: 50, carbs: 250, fat: 65, fiber: 25,
    };
    const percentages = computePercentages(totals, targets);

    return ok({ date, entries, totals, targets, percentages });
  }

  // ── Today ───────────────────────────────────────────────────────────────────

  async getTodaySnapshot(date: ISODate): Promise<Result<TodaySnapshot>> {
    const habits = this.#readHabits().filter((h) => h.active);
    const deveres = this.#readDeveres().filter((d) => d.active);

    const habitItems: TodaySnapshot['habits'] = habits.map((habit) => ({
      habit,
      isDone: habit.completions[date] === true,
      streak: computeStreaks(habit.completions, date, habit.createdAt),
    }));

    const deverItems: TodaySnapshot['deveres'] = [];

    for (const dever of deveres) {
      if (dever.type === 'once') {
        const isOverdue = dever.deadline < date;
        const isDueToday = dever.deadline === date;
        if (!isDueToday && !isOverdue) continue;
        const isDone = dever.completions.some((c) => c.occurrenceDate === dever.deadline);
        if (isDone) continue;
        deverItems.push({ dever, occurrenceDate: dever.deadline, isDone: false, isOverdue });
      } else {
        if (!isOccurrenceOn(dever.recurrence, date)) continue;
        const isDone = dever.completions.some((c) => c.occurrenceDate === date);
        deverItems.push({ dever, occurrenceDate: date, isDone, isOverdue: false });
      }
    }

    deverItems.sort((a, b) => {
      if (a.isOverdue !== b.isOverdue) return a.isOverdue ? -1 : 1;
      return PRIORITY_ORDER[a.dever.priority] - PRIORITY_ORDER[b.dever.priority];
    });

    // Nutrition summary for today
    const profile = this.#readProfile();
    let nutritionSummary: TodaySnapshot['nutritionSummary'];
    if (profile) {
      const entries = this.#readDiary().filter((e) => e.date === date);
      const foods = this.#readFoods();
      const totals = computeDailyTotals(entries, foods);
      const targets = computeDailyTargets(profile);
      const percentages = computePercentages(totals, targets);
      nutritionSummary = {
        calories: totals.calories,
        caloriesTarget: targets.calories,
        caloriesPercent: percentages.calories,
        protein: totals.protein,
        proteinTarget: targets.protein,
        proteinPercent: percentages.protein,
        carbs: totals.carbs,
        carbsTarget: targets.carbs,
        carbsPercent: percentages.carbs,
        fat: totals.fat,
        fatTarget: targets.fat,
        fatPercent: percentages.fat,
      };
    }

    return ok({
      date,
      habits: habitItems,
      deveres: deverItems,
      ...(nutritionSummary && { nutritionSummary }),
    });
  }

  // ── Private: Habits ─────────────────────────────────────────────────────────

  #readHabits(): Habit[] {
    const raw = localStorage.getItem(HABITS_KEY);
    if (!raw) return [];
    try {
      return HabitArraySchema.parse(JSON.parse(raw)) as unknown as Habit[];
    } catch (e) {
      console.error(`[LocalStorageAdapter] Invalid data in "${HABITS_KEY}", falling back to []:`, e);
      return [];
    }
  }

  #writeHabits(habits: Habit[]): void {
    localStorage.setItem(HABITS_KEY, JSON.stringify(habits));
  }

  // ── Private: Deveres ────────────────────────────────────────────────────────

  #readDeveres(): Dever[] {
    const raw = localStorage.getItem(DEVERES_KEY);
    if (!raw) return [];
    try {
      return DeverArraySchema.parse(JSON.parse(raw)) as unknown as Dever[];
    } catch (e) {
      console.error(`[LocalStorageAdapter] Invalid data in "${DEVERES_KEY}", falling back to []:`, e);
      return [];
    }
  }

  #writeDeveres(deveres: Dever[]): void {
    localStorage.setItem(DEVERES_KEY, JSON.stringify(deveres));
  }

  // ── Private: Foods ──────────────────────────────────────────────────────────

  #readFoods(): Food[] {
    const raw = localStorage.getItem(FOODS_KEY);
    if (!raw) return [];
    try {
      return FoodArraySchema.parse(JSON.parse(raw)) as unknown as Food[];
    } catch (e) {
      console.error(`[LocalStorageAdapter] Invalid data in "${FOODS_KEY}", falling back to []:`, e);
      return [];
    }
  }

  #writeFoods(foods: Food[]): void {
    localStorage.setItem(FOODS_KEY, JSON.stringify(foods));
  }

  // ── Private: Diary ──────────────────────────────────────────────────────────

  #readDiary(): DiaryEntry[] {
    const raw = localStorage.getItem(DIARY_KEY);
    if (!raw) return [];
    try {
      return DiaryEntryArraySchema.parse(JSON.parse(raw)) as unknown as DiaryEntry[];
    } catch (e) {
      console.error(`[LocalStorageAdapter] Invalid data in "${DIARY_KEY}", falling back to []:`, e);
      return [];
    }
  }

  #writeDiary(diary: DiaryEntry[]): void {
    localStorage.setItem(DIARY_KEY, JSON.stringify(diary));
  }

  // ── Private: Profile ────────────────────────────────────────────────────────

  #readProfile(): NutritionProfile | null {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (!raw) return null;
    try {
      return NutritionProfileSchema.parse(JSON.parse(raw)) as unknown as NutritionProfile;
    } catch (e) {
      console.error(`[LocalStorageAdapter] Invalid data in "${PROFILE_KEY}", falling back to null:`, e);
      return null;
    }
  }

  #writeProfile(profile: NutritionProfile): void {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  }
}

function ok<T>(data: T): Result<T> {
  return { ok: true, data };
}

function err<T>(error: string): Result<T> {
  return { ok: false, error };
}
