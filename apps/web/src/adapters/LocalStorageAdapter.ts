import {
  HabitArraySchema,
  DeverArraySchema,
  ProjetoArraySchema,
  FoodArraySchema,
  DiaryEntryArraySchema,
  NutritionProfileSchema,
  GameArraySchema,
  SteamLibrarySettingsSchema,
  MovieArraySchema,
  SaudeItemArraySchema,
  ListaCompraArraySchema,
  TmdbSearchResultArraySchema,
  getOnceDeverOccurrenceDate,
  isOccurrenceOn,
  getMonthlyWindowInfo,
  nowISODateTime,
  computeStreaks,
  computeHabitDayProgress,
  computeHabitGoalCompletions,
  computeHabitProgress,
  decrementHabitCompletion,
  incrementHabitCompletion,
  normalizeHabitSettings,
  computePortionNutrients,
  computeDailyTotals,
  computeDailyTargets,
  computePercentages,
  computeProjetoProgress,
  getNextEtapas,
  getSaudeDueInfo,
  getListaCompraDueInfo,
  normalizeSteamOwnedGamesResponse,
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
  type Projeto,
  type ProjetoInput,
  type ProjetoPatch,
  type EtapaInput,
  type EtapaPatch,
  type Etapa,
  type ProjetoId,
  type EtapaId,
  type ISODate,
  type Food,
  type FoodInput,
  type FoodId,
  type DiaryEntry,
  type DiaryEntryInput,
  type DiaryEntryId,
  type NutritionProfile,
  type DailyNutritionSummary,
  type Game,
  type SteamLibrarySettings,
  type SteamLibrarySettingsInput,
  type SteamSyncResult,
  type Movie,
  type MovieInput,
  type MovieId,
  type TmdbSearchResult,
  BookArraySchema,
  ReadingGoalArraySchema,
  type Book,
  type BookInput,
  type BookPatch,
  type BookId,
  type ReadingGoal,
  type SaudeItem,
  type SaudeItemInput,
  type SaudeItemPatch,
  type SaudeEventInput,
  type SaudeItemId,
  type SaudeEvent,
  type SaudeEventId,
  type ListaCompra,
  type ListaCompraInput,
  type ListaCompraPatch,
  type ListaCompraId,
  type CompraItem,
  type CompraItemInput,
  type CompraItemPatch,
  type CompraItemId,
} from '@planner/core';

const HABITS_KEY = 'planner_habits';
const DEVERES_KEY = 'planner_deveres';
const PROJETOS_KEY = 'planner_projetos';
const FOODS_KEY = 'planner_foods';
const DIARY_KEY = 'planner_diary';
const PROFILE_KEY = 'planner_nutrition_profile';
const GAMES_KEY = 'planner_games';
const STEAM_SETTINGS_KEY = 'planner_steam_settings';
const MOVIES_KEY = 'planner:movies';
const TMDB_API_KEY_KEY = 'planner:tmdb-api-key';
const BOOKS_KEY = 'planner_books';
const READING_GOALS_KEY = 'planner_reading_goals';
const SAUDE_KEY = 'planner_saude';
const COMPRAS_KEY = 'planner_compras';
const TMDB_API_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w342';

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
    const settings = normalizeHabitSettings(input);
    const habit: Habit = {
      id: crypto.randomUUID() as HabitId,
      title: input.title,
      ...(input.category !== undefined && { category: input.category }),
      active: true,
      createdAt: nowISODateTime(),
      ...settings,
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
    const settings = normalizeHabitSettings({
      timesPerDay: patch.timesPerDay ?? current.timesPerDay,
      valueWeights: patch.valueWeights ?? current.valueWeights,
    });
    const updated: Habit = {
      ...current,
      ...(patch.title !== undefined && { title: patch.title }),
      ...(patch.category !== undefined && { category: patch.category }),
      ...(patch.active !== undefined && { active: patch.active }),
      ...settings,
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
    habit.completions = incrementHabitCompletion(habit.completions, date);
    this.#writeHabits(habits);
    return ok(habit);
  }

  async unmarkHabitDone(id: HabitId, date: ISODate): Promise<Result<Habit>> {
    const habits = this.#readHabits();
    const idx = habits.findIndex((h) => h.id === id);
    if (idx === -1) return err(`Habit not found: ${id}`);
    const habit = habits[idx]!;
    habit.completions = decrementHabitCompletion(habit.completions, date);
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
    const createdAt = nowISODateTime();
    const base = {
      id: crypto.randomUUID() as DeverId,
      title: input.title,
      ...(input.area !== undefined && { area: input.area }),
      priority: input.priority,
      active: true,
      createdAt,
      inicio: input.inicio ?? createdAt,
      completions: [] as Dever['completions'],
    };
    const dever: Dever =
      input.type === 'once'
        ? { ...base, type: 'once', ...(input.fim !== undefined && { fim: input.fim }) }
        : { ...base, type: 'cyclic', recurrence: input.recurrence, ...(input.fim !== undefined && { fim: input.fim }) };
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

  // ── Projetos ──────────────────────────────────────────────────────────────────

  async getProjetos(): Promise<Result<Projeto[]>> {
    return ok(this.#readProjetos());
  }

  async createProjeto(input: ProjetoInput): Promise<Result<Projeto>> {
    const projetos = this.#readProjetos();
    const createdAt = nowISODateTime();
    const etapas: Etapa[] = (input.etapas ?? []).map((e, i) => ({
      id: crypto.randomUUID() as EtapaId,
      title: e.title,
      ...(e.description !== undefined && { description: e.description }),
      status: 'pending' as const,
      order: e.order ?? i,
      ...(e.deadline !== undefined && { deadline: e.deadline }),
      ...(e.effortHours !== undefined && { effortHours: e.effortHours }),
      ...(e.dependsOn !== undefined && { dependsOn: e.dependsOn }),
      createdAt,
    }));
    const projeto: Projeto = {
      id: crypto.randomUUID() as ProjetoId,
      title: input.title,
      ...(input.description !== undefined && { description: input.description }),
      ...(input.area !== undefined && { area: input.area }),
      priority: input.priority,
      status: 'planning',
      createdAt,
      ...(input.inicio !== undefined && { inicio: input.inicio }),
      ...(input.fim !== undefined && { fim: input.fim }),
      etapas,
    };
    projetos.push(projeto);
    this.#writeProjetos(projetos);
    return ok(projeto);
  }

  async updateProjeto(id: ProjetoId, patch: ProjetoPatch): Promise<Result<Projeto>> {
    const projetos = this.#readProjetos();
    const idx = projetos.findIndex((p) => p.id === id);
    if (idx === -1) return err(`Projeto not found: ${id}`);
    const current = projetos[idx]!;
    const updated: Projeto = {
      ...current,
      ...(patch.title !== undefined && { title: patch.title }),
      ...(patch.description !== undefined && { description: patch.description }),
      ...(patch.area !== undefined && { area: patch.area }),
      ...(patch.priority !== undefined && { priority: patch.priority }),
      ...(patch.status !== undefined && { status: patch.status }),
      ...(patch.inicio !== undefined && { inicio: patch.inicio }),
      ...(patch.fim !== undefined && { fim: patch.fim }),
    };
    projetos[idx] = updated;
    this.#writeProjetos(projetos);
    return ok(updated);
  }

  async archiveProjeto(id: ProjetoId): Promise<Result<void>> {
    const result = await this.updateProjeto(id, { status: 'archived' });
    if (!result.ok) return result;
    return ok(undefined);
  }

  async addEtapa(projetoId: ProjetoId, input: EtapaInput): Promise<Result<Projeto>> {
    const projetos = this.#readProjetos();
    const idx = projetos.findIndex((p) => p.id === projetoId);
    if (idx === -1) return err(`Projeto not found: ${projetoId}`);
    const projeto = projetos[idx]!;
    const maxOrder = projeto.etapas.length > 0
      ? Math.max(...projeto.etapas.map((e) => e.order))
      : -1;
    const etapa: Etapa = {
      id: crypto.randomUUID() as EtapaId,
      title: input.title,
      ...(input.description !== undefined && { description: input.description }),
      status: 'pending',
      order: input.order ?? maxOrder + 1,
      ...(input.deadline !== undefined && { deadline: input.deadline }),
      ...(input.effortHours !== undefined && { effortHours: input.effortHours }),
      ...(input.dependsOn !== undefined && { dependsOn: input.dependsOn }),
      createdAt: nowISODateTime(),
    };
    projeto.etapas.push(etapa);
    this.#writeProjetos(projetos);
    return ok(projeto);
  }

  async updateEtapa(projetoId: ProjetoId, etapaId: EtapaId, patch: EtapaPatch): Promise<Result<Projeto>> {
    const projetos = this.#readProjetos();
    const pIdx = projetos.findIndex((p) => p.id === projetoId);
    if (pIdx === -1) return err(`Projeto not found: ${projetoId}`);
    const projeto = projetos[pIdx]!;
    const eIdx = projeto.etapas.findIndex((e) => e.id === etapaId);
    if (eIdx === -1) return err(`Etapa not found: ${etapaId}`);
    const current = projeto.etapas[eIdx]!;
    const updated: Etapa = {
      ...current,
      ...(patch.title !== undefined && { title: patch.title }),
      ...(patch.description !== undefined && { description: patch.description }),
      ...(patch.status !== undefined && { status: patch.status }),
      ...(patch.deadline !== undefined && { deadline: patch.deadline }),
      ...(patch.effortHours !== undefined && { effortHours: patch.effortHours }),
      ...(patch.order !== undefined && { order: patch.order }),
      ...(patch.dependsOn !== undefined && { dependsOn: patch.dependsOn }),
    };
    // Set completedAt when transitioning to done
    if (patch.status === 'done' && current.status !== 'done') {
      updated.completedAt = nowISODateTime();
    }
    // Clear completedAt when transitioning away from done
    if (patch.status !== undefined && patch.status !== 'done' && current.status === 'done') {
      delete (updated as unknown as Record<string, unknown>)['completedAt'];
    }
    projeto.etapas[eIdx] = updated;
    this.#writeProjetos(projetos);
    return ok(projeto);
  }

  async removeEtapa(projetoId: ProjetoId, etapaId: EtapaId): Promise<Result<Projeto>> {
    const projetos = this.#readProjetos();
    const pIdx = projetos.findIndex((p) => p.id === projetoId);
    if (pIdx === -1) return err(`Projeto not found: ${projetoId}`);
    const projeto = projetos[pIdx]!;
    projeto.etapas = projeto.etapas.filter((e) => e.id !== etapaId);
    // Also remove from dependsOn of other etapas
    for (const e of projeto.etapas) {
      if (e.dependsOn) {
        e.dependsOn = e.dependsOn.filter((id) => id !== etapaId) as EtapaId[];
        if (e.dependsOn.length === 0) {
          delete (e as unknown as Record<string, unknown>)['dependsOn'];
        }
      }
    }
    this.#writeProjetos(projetos);
    return ok(projeto);
  }

  async reorderEtapas(projetoId: ProjetoId, etapaIds: EtapaId[]): Promise<Result<Projeto>> {
    const projetos = this.#readProjetos();
    const pIdx = projetos.findIndex((p) => p.id === projetoId);
    if (pIdx === -1) return err(`Projeto not found: ${projetoId}`);
    const projeto = projetos[pIdx]!;
    for (let i = 0; i < etapaIds.length; i++) {
      const etapa = projeto.etapas.find((e) => e.id === etapaIds[i]);
      if (etapa) etapa.order = i;
    }
    this.#writeProjetos(projetos);
    return ok(projeto);
  }

  // ── Foods ───────────────────────────────────────────────────────────────────

  async getSaudeItems(): Promise<Result<SaudeItem[]>> {
    return ok(this.#readSaudeItems());
  }

  async createSaudeItem(input: SaudeItemInput): Promise<Result<SaudeItem>> {
    const items = this.#readSaudeItems();
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
    this.#writeSaudeItems(items);
    return ok(item);
  }

  async updateSaudeItem(id: SaudeItemId, patch: SaudeItemPatch): Promise<Result<SaudeItem>> {
    const items = this.#readSaudeItems();
    const idx = items.findIndex((item) => item.id === id);
    if (idx === -1) return err(`Saude item not found: ${id}`);

    const current = items[idx]!;
    const updated: SaudeItem = {
      ...current,
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
    this.#writeSaudeItems(items);
    return ok(updated);
  }

  async recordSaudeEvent(id: SaudeItemId, input: SaudeEventInput): Promise<Result<SaudeItem>> {
    const items = this.#readSaudeItems();
    const idx = items.findIndex((item) => item.id === id);
    if (idx === -1) return err(`Saude item not found: ${id}`);

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
    this.#writeSaudeItems(items);
    return ok(updated);
  }

  async archiveSaudeItem(id: SaudeItemId): Promise<Result<void>> {
    const result = await this.updateSaudeItem(id, { active: false });
    if (!result.ok) return result;
    return ok(undefined);
  }

  async getListasCompra(): Promise<Result<ListaCompra[]>> {
    return ok(this.#readListasCompra());
  }

  async createListaCompra(input: ListaCompraInput): Promise<Result<ListaCompra>> {
    const listas = this.#readListasCompra();
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
    this.#writeListasCompra(listas);
    return ok(lista);
  }

  async updateListaCompra(id: ListaCompraId, patch: ListaCompraPatch): Promise<Result<ListaCompra>> {
    const listas = this.#readListasCompra();
    const idx = listas.findIndex((lista) => lista.id === id);
    if (idx === -1) return err(`Lista de compra not found: ${id}`);

    const current = listas[idx]!;
    const updated: ListaCompra = {
      ...current,
      ...(patch.title !== undefined && { title: patch.title }),
      ...(patch.notes !== undefined && { notes: patch.notes }),
      ...(patch.active !== undefined && { active: patch.active }),
      ...(patch.plannedFor !== undefined && { plannedFor: patch.plannedFor }),
      ...(patch.reminder !== undefined && { reminder: patch.reminder }),
    };
    listas[idx] = updated;
    this.#writeListasCompra(listas);
    return ok(updated);
  }

  async archiveListaCompra(id: ListaCompraId): Promise<Result<void>> {
    const result = await this.updateListaCompra(id, { active: false });
    if (!result.ok) return result;
    return ok(undefined);
  }

  async addCompraItem(listaId: ListaCompraId, input: CompraItemInput): Promise<Result<ListaCompra>> {
    const listas = this.#readListasCompra();
    const idx = listas.findIndex((lista) => lista.id === listaId);
    if (idx === -1) return err(`Lista de compra not found: ${listaId}`);

    const lista = listas[idx]!;
    const priceHistory = input.lastPrice !== undefined
      ? [{ price: input.lastPrice, date: todayFromNow(), ...(input.preferredStore && { store: input.preferredStore }) }]
      : undefined;

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
      ...(priceHistory !== undefined && { priceHistory }),
      ...(input.notes !== undefined && { notes: input.notes }),
    };

    lista.items.push(item);
    this.#writeListasCompra(listas);
    return ok(lista);
  }

  async updateCompraItem(
    listaId: ListaCompraId,
    itemId: CompraItemId,
    patch: CompraItemPatch,
  ): Promise<Result<CompraItem>> {
    const listas = this.#readListasCompra();
    const lista = listas.find((entry) => entry.id === listaId);
    if (!lista) return err(`Lista de compra not found: ${listaId}`);

    const idx = lista.items.findIndex((item) => item.id === itemId);
    if (idx === -1) return err(`Compra item not found: ${itemId}`);

    const current = lista.items[idx]!;
    const updated: CompraItem = {
      ...current,
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

    if (patch.lastPrice !== undefined && patch.lastPrice !== current.lastPrice) {
      updated.priceHistory = [
        ...(current.priceHistory ?? []),
        {
          price: patch.lastPrice,
          date: todayFromNow(),
          ...(patch.preferredStore !== undefined
            ? patch.preferredStore
              ? { store: patch.preferredStore }
              : {}
            : current.preferredStore
              ? { store: current.preferredStore }
              : {}),
        },
      ];
    }

    lista.items[idx] = updated;
    this.#writeListasCompra(listas);
    return ok(updated);
  }

  async removeCompraItem(listaId: ListaCompraId, itemId: CompraItemId): Promise<Result<ListaCompra>> {
    const listas = this.#readListasCompra();
    const lista = listas.find((entry) => entry.id === listaId);
    if (!lista) return err(`Lista de compra not found: ${listaId}`);

    lista.items = lista.items.filter((item) => item.id !== itemId);
    this.#writeListasCompra(listas);
    return ok(lista);
  }

  async completeListaCompra(listaId: ListaCompraId, date: ISODate): Promise<Result<ListaCompra>> {
    const listas = this.#readListasCompra();
    const lista = listas.find((entry) => entry.id === listaId);
    if (!lista) return err(`Lista de compra not found: ${listaId}`);

    lista.lastCompletedAt = isoDateToDateTime(date);
    lista.items = lista.items.map((item) => ({ ...item, checked: false }));
    this.#writeListasCompra(listas);
    return ok(lista);
  }

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

  async getGames(): Promise<Result<Game[]>> {
    return ok(this.#readGames());
  }

  async getSteamLibrarySettings(): Promise<Result<SteamLibrarySettings | null>> {
    return ok(this.#readSteamSettings());
  }

  async saveSteamLibrarySettings(settings: SteamLibrarySettingsInput): Promise<Result<SteamLibrarySettings>> {
    const apiKey = settings.apiKey.trim();
    const profile = settings.profile.trim();

    if (!apiKey || !profile) {
      return err('Preencha a chave da Steam e o perfil antes de salvar.');
    }

    const current = this.#readSteamSettings();
    const sameCredentials = current?.apiKey === apiKey && current?.profile === profile;
    const next: SteamLibrarySettings = {
      apiKey,
      profile,
      ...(sameCredentials && current?.resolvedSteamId ? { resolvedSteamId: current.resolvedSteamId } : {}),
      ...(sameCredentials && current?.lastSyncedAt ? { lastSyncedAt: current.lastSyncedAt } : {}),
    };

    this.#writeSteamSettings(next);
    return ok(next);
  }

  async syncSteamLibrary(): Promise<Result<SteamSyncResult>> {
    const settings = this.#readSteamSettings();
    if (!settings) {
      return err('Salve a chave da Steam e o perfil antes de sincronizar.');
    }

    if (!('__TAURI_INTERNALS__' in window)) {
      return err('A Steam bloqueia sincronizacao direta no navegador. Use o app desktop ou o modo REST local.');
    }

    try {
      const { invoke } = await import('@tauri-apps/api/core');
      const payload = await invoke<DesktopSteamSyncPayload>('sync_steam_library', {
        apiKey: settings.apiKey,
        profile: settings.profile,
      });

      const syncResult = normalizeSteamOwnedGamesResponse(
        payload.ownedGamesResponse,
        nowISODateTime(),
        payload.resolvedSteamId,
      );

      this.#writeGames(syncResult.games);
      this.#writeSteamSettings({
        ...settings,
        resolvedSteamId: syncResult.resolvedSteamId,
        lastSyncedAt: syncResult.syncedAt,
      });

      return ok(syncResult);
    } catch (e) {
      return err(e instanceof Error ? e.message : 'Falha ao sincronizar biblioteca Steam.');
    }
  }

  // ── Movies ─────────────────────────────────────────────────────────────────

  async getMovies(): Promise<Result<Movie[]>> {
    return ok(this.#readMovies());
  }

  async createMovie(input: MovieInput): Promise<Result<Movie>> {
    const title = input.title.trim();
    if (!title) {
      return err('Título do filme é obrigatório.');
    }

    if (input.posterUrl !== undefined && !isValidHttpUrl(input.posterUrl)) {
      return err('Poster URL inválida.');
    }

    if (input.year !== undefined && !isValidMovieYear(input.year)) {
      return err('Ano inválido.');
    }

    const enrichment = input.tmdbId !== undefined
      ? await this.#fetchTmdbMovieDetails(input.tmdbId)
      : null;

    const movies = this.#readMovies();
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
      tags: normalizeMovieTags([...(enrichment?.tags ?? []), ...(input.tags ?? [])]),
      createdAt: nowISODateTime(),
    };

    movies.unshift(movie);
    this.#writeMovies(movies);
    return ok(movie);
  }

  async updateMovie(
    id: MovieId,
    patch: Partial<Pick<Movie, 'status' | 'rating' | 'tags'>>,
  ): Promise<Result<Movie>> {
    const movies = this.#readMovies();
    const idx = movies.findIndex((movie) => movie.id === id);
    if (idx === -1) {
      return err('Filme não encontrado.');
    }

    const current = movies[idx]!;
    const requestedStatus = patch.status ?? (patch.rating !== undefined ? 'watched' : current.status);
    const normalizedRating = normalizeMovieRating(patch.rating);
    if (patch.rating !== undefined && normalizedRating === undefined) {
      return err('Nota inválida. Use um valor entre 1 e 5.');
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
    this.#writeMovies(movies);
    return ok(updated);
  }

  async deleteMovie(id: MovieId): Promise<Result<void>> {
    const movies = this.#readMovies();
    if (!movies.some((movie) => movie.id === id)) {
      return err('Filme não encontrado.');
    }

    this.#writeMovies(movies.filter((movie) => movie.id !== id));
    return ok(undefined);
  }

  async searchTmdbMovies(query: string): Promise<Result<TmdbSearchResult[]>> {
    const normalizedQuery = query.trim();
    if (!normalizedQuery) {
      return ok([]);
    }

    const apiKey = this.#readTmdbApiKey();
    if (!apiKey) {
      return err('Configure a API key do TMDB antes de buscar filmes.');
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
        return err(payload?.status_message ?? 'Falha ao buscar filmes no TMDB.');
      }

      const payload = await response.json() as TmdbSearchPayload;
      const results = (payload.results ?? [])
        .filter((movie): movie is NonNullable<TmdbSearchPayload['results']>[number] => (
          typeof movie?.id === 'number' &&
          movie.id > 0 &&
          typeof movie.title === 'string' &&
          movie.title.trim().length > 0
        ))
        .map((movie) => {
          const year = parseTmdbYear(movie.release_date);
          const posterUrl = toTmdbPosterUrl(movie.poster_path);
          return {
            tmdbId: movie.id,
            title: movie.title!.trim(),
            ...(year !== undefined ? { year } : {}),
            ...(posterUrl ? { posterUrl } : {}),
            ...(typeof movie.overview === 'string' && movie.overview.trim()
              ? { overview: movie.overview.trim() }
              : {}),
          };
        });

      return ok(TmdbSearchResultArraySchema.parse(results) as unknown as TmdbSearchResult[]);
    } catch (e) {
      return err(e instanceof Error ? e.message : 'Falha ao buscar filmes no TMDB.');
    }
  }

  async getTmdbApiKey(): Promise<Result<string | null>> {
    return ok(this.#readTmdbApiKey());
  }

  async saveTmdbApiKey(apiKey: string): Promise<Result<string>> {
    const normalized = apiKey.trim();
    if (!normalized) {
      localStorage.removeItem(TMDB_API_KEY_KEY);
      return ok('');
    }

    localStorage.setItem(TMDB_API_KEY_KEY, normalized);
    return ok(normalized);
  }

  // ── Books ──────────────────────────────────────────────────────────────────

  async getBooks(): Promise<Result<Book[]>> {
    return ok(this.#readBooks());
  }

  async createBook(input: BookInput): Promise<Result<Book>> {
    const books = this.#readBooks();
    const book: Book = {
      id: crypto.randomUUID() as BookId,
      title: input.title,
      author: input.author,
      ...(input.genre && { genre: input.genre }),
      ...(input.totalPages && { totalPages: input.totalPages }),
      ...(input.coverUrl && { coverUrl: input.coverUrl }),
      ...(input.openLibraryKey && { openLibraryKey: input.openLibraryKey }),
      status: 'want_to_read',
      pagesRead: 0,
      createdAt: nowISODateTime(),
    };
    books.push(book);
    this.#writeBooks(books);
    return ok(book);
  }

  async updateBook(id: BookId, patch: BookPatch): Promise<Result<Book>> {
    const books = this.#readBooks();
    const idx = books.findIndex((b) => b.id === id);
    if (idx === -1) return err('Livro não encontrado.');

    const book = books[idx]!;
    const today = new Date().toISOString().split('T')[0] as ISODate;

    // Auto-fill dates based on status transitions
    if (patch.status === 'reading' && book.status !== 'reading' && !book.startedAt && !patch.startedAt) {
      patch.startedAt = today;
    }
    if ((patch.status === 'read' || patch.status === 'abandoned') && !book.finishedAt && !patch.finishedAt) {
      patch.finishedAt = today;
    }

    const updated: Book = { ...book, ...patch };
    books[idx] = updated;
    this.#writeBooks(books);
    return ok(updated);
  }

  async archiveBook(id: BookId): Promise<Result<void>> {
    const books = this.#readBooks();
    const idx = books.findIndex((b) => b.id === id);
    if (idx === -1) return err('Livro não encontrado.');
    books[idx] = { ...books[idx]!, archivedAt: nowISODateTime() };
    this.#writeBooks(books);
    return ok(undefined);
  }

  // ── Reading Goals ──────────────────────────────────────────────────────────

  async getReadingGoals(): Promise<Result<ReadingGoal[]>> {
    return ok(this.#readReadingGoals());
  }

  async setReadingGoal(year: number, target: number): Promise<Result<ReadingGoal>> {
    const goals = this.#readReadingGoals();
    const idx = goals.findIndex((g) => g.year === year);
    const goal: ReadingGoal = { year, target };
    if (idx === -1) {
      goals.push(goal);
    } else {
      goals[idx] = goal;
    }
    this.#writeReadingGoals(goals);
    return ok(goal);
  }

  // ── Today ──────────────────────────────────────────────────────────────────

  async getTodaySnapshot(date: ISODate): Promise<Result<TodaySnapshot>> {
    const habits = this.#readHabits().filter((h) => h.active);
    const deveres = this.#readDeveres().filter((d) => d.active);
    const saudeItems = this.#readSaudeItems().filter((item) => item.active);
    const listasCompra = this.#readListasCompra().filter((lista) => lista.active);

    const habitItems: TodaySnapshot['habits'] = habits.map((habit) => {
      const progress = computeHabitProgress(habit, date);
      return {
        habit,
        isDone: progress.isDone,
        progress,
        streak: computeStreaks(computeHabitGoalCompletions(habit), date, habit.createdAt),
      };
    });
    const habitProgress = computeHabitDayProgress(habits, date);

    const deverItems: TodaySnapshot['deveres'] = [];

    for (const dever of deveres) {
      const inicioDate = dever.inicio.split('T')[0] as ISODate;
      if (inicioDate > date) continue;

      if (dever.type === 'once') {
        const occurrenceDate = getOnceDeverOccurrenceDate(dever);
        if (dever.fim) {
          // Has deadline — show when due or overdue
          const isOverdue = dever.fim < date;
          const isDueToday = dever.fim === date;
          if (!isDueToday && !isOverdue) continue;
          const isDone = dever.completions.some((c) => c.occurrenceDate === occurrenceDate);
          if (isDone) continue;
          deverItems.push({ dever, occurrenceDate, isDone: false, isOverdue });
        } else {
          // Indefinite — show every day until completed (use today as occurrence)
          const isDone = dever.completions.some((c) => c.occurrenceDate === occurrenceDate);
          if (isDone) continue;
          deverItems.push({ dever, occurrenceDate, isDone: false, isOverdue: false });
        }
      } else {
        if (dever.fim && dever.fim < date) continue;

        // Monthly recurrence with a window (monthDayEnd)
        const windowInfo = getMonthlyWindowInfo(dever.recurrence, date);
        if (windowInfo) {
          const isDone = dever.completions.some((c) => c.occurrenceDate === windowInfo.occurrenceDate);
          if (windowInfo.status === 'overdue' && isDone) continue; // completed, don't show
          deverItems.push({
            dever,
            occurrenceDate: windowInfo.occurrenceDate,
            isDone,
            isOverdue: windowInfo.status === 'overdue' && !isDone,
          });
        } else {
          if (!isOccurrenceOn(dever.recurrence, date)) continue;
          const isDone = dever.completions.some((c) => c.occurrenceDate === date);
          deverItems.push({ dever, occurrenceDate: date, isDone, isOverdue: false });
        }
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

    // Projetos: active projects with progress and next etapas
    const allProjetos = this.#readProjetos();
    const projetoItems: TodaySnapshot['projetos'] = allProjetos
      .filter((p) => p.status === 'active')
      .map((projeto) => ({
        projeto,
        progress: computeProjetoProgress(projeto),
        nextEtapas: getNextEtapas(projeto),
      }));

    const saudeTodayItems: TodaySnapshot['saude'] = saudeItems
      .map((item) => {
        const dueInfo = getSaudeDueInfo(item, date);
        return dueInfo
          ? {
              item,
              nextDate: dueInfo.dueDate,
              isOverdue: dueInfo.isOverdue,
            }
          : null;
      })
      .filter((entry): entry is TodaySnapshot['saude'][number] => entry !== null)
      .sort((a, b) => {
        if (a.isOverdue !== b.isOverdue) return a.isOverdue ? -1 : 1;
        return PRIORITY_ORDER[a.item.priority] - PRIORITY_ORDER[b.item.priority];
      });

    const comprasTodayItems: TodaySnapshot['compras'] = listasCompra
      .map((lista) => {
        const dueInfo = getListaCompraDueInfo(lista, date);
        return dueInfo
          ? {
              lista,
              nextDate: dueInfo.dueDate,
              isOverdue: dueInfo.isOverdue,
              pendingItems: lista.items.filter((item) => !item.checked).length,
              totalItems: lista.items.length,
            }
          : null;
      })
      .filter((entry): entry is TodaySnapshot['compras'][number] => entry !== null)
      .sort((a, b) => {
        if (a.isOverdue !== b.isOverdue) return a.isOverdue ? -1 : 1;
        return a.nextDate.localeCompare(b.nextDate);
      });

    return ok({
      date,
      habits: habitItems,
      habitProgress,
      deveres: deverItems,
      projetos: projetoItems,
      saude: saudeTodayItems,
      compras: comprasTodayItems,
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
      const parsed = DeverArraySchema.parse(JSON.parse(raw));
      // Inline migration: normalise legacy deveres that lack inicio/fim
      for (const d of parsed) {
        if (!d.inicio) {
          (d as Record<string, unknown>)['inicio'] = d.createdAt;
        }
        if (d.type === 'once' && !d.fim) {
          const legacy = (d as Record<string, unknown>)['deadline'] as string | undefined;
          // deadline was already ISODate — use it directly as fim
          if (legacy) {
            (d as Record<string, unknown>)['fim'] = legacy;
          }
        }
      }
      return parsed as unknown as Dever[];
    } catch (e) {
      console.error(`[LocalStorageAdapter] Invalid data in "${DEVERES_KEY}", falling back to []:`, e);
      return [];
    }
  }

  #writeDeveres(deveres: Dever[]): void {
    localStorage.setItem(DEVERES_KEY, JSON.stringify(deveres));
  }

  // ── Private: Projetos ──────────────────────────────────────────────────────

  #readProjetos(): Projeto[] {
    const raw = localStorage.getItem(PROJETOS_KEY);
    if (!raw) return [];
    try {
      return ProjetoArraySchema.parse(JSON.parse(raw)) as unknown as Projeto[];
    } catch (e) {
      console.error(`[LocalStorageAdapter] Invalid data in "${PROJETOS_KEY}", falling back to []:`, e);
      return [];
    }
  }

  #writeProjetos(projetos: Projeto[]): void {
    localStorage.setItem(PROJETOS_KEY, JSON.stringify(projetos));
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

  #readGames(): Game[] {
    const raw = localStorage.getItem(GAMES_KEY);
    if (!raw) return [];
    try {
      return GameArraySchema.parse(JSON.parse(raw)) as unknown as Game[];
    } catch (e) {
      console.error(`[LocalStorageAdapter] Invalid data in "${GAMES_KEY}", falling back to []:`, e);
      return [];
    }
  }

  #writeGames(games: Game[]): void {
    localStorage.setItem(GAMES_KEY, JSON.stringify(games));
  }

  #readSteamSettings(): SteamLibrarySettings | null {
    const raw = localStorage.getItem(STEAM_SETTINGS_KEY);
    if (!raw) return null;
    try {
      return SteamLibrarySettingsSchema.parse(JSON.parse(raw)) as unknown as SteamLibrarySettings;
    } catch (e) {
      console.error(`[LocalStorageAdapter] Invalid data in "${STEAM_SETTINGS_KEY}", falling back to null:`, e);
      return null;
    }
  }

  #writeSteamSettings(settings: SteamLibrarySettings): void {
    localStorage.setItem(STEAM_SETTINGS_KEY, JSON.stringify(settings));
  }

  // ── Private: Movies ────────────────────────────────────────────────────────

  #readSaudeItems(): SaudeItem[] {
    const raw = localStorage.getItem(SAUDE_KEY);
    if (!raw) return [];
    try {
      return SaudeItemArraySchema.parse(JSON.parse(raw)) as unknown as SaudeItem[];
    } catch (e) {
      console.error(`[LocalStorageAdapter] Invalid data in "${SAUDE_KEY}", falling back to []:`, e);
      return [];
    }
  }

  #writeSaudeItems(items: SaudeItem[]): void {
    localStorage.setItem(SAUDE_KEY, JSON.stringify(items));
  }

  #readListasCompra(): ListaCompra[] {
    const raw = localStorage.getItem(COMPRAS_KEY);
    if (!raw) return [];
    try {
      return ListaCompraArraySchema.parse(JSON.parse(raw)) as unknown as ListaCompra[];
    } catch (e) {
      console.error(`[LocalStorageAdapter] Invalid data in "${COMPRAS_KEY}", falling back to []:`, e);
      return [];
    }
  }

  #writeListasCompra(listas: ListaCompra[]): void {
    localStorage.setItem(COMPRAS_KEY, JSON.stringify(listas));
  }

  #readMovies(): Movie[] {
    const raw = localStorage.getItem(MOVIES_KEY);
    if (!raw) return [];
    try {
      return MovieArraySchema.parse(JSON.parse(raw)) as unknown as Movie[];
    } catch (e) {
      console.error(`[LocalStorageAdapter] Invalid data in "${MOVIES_KEY}", falling back to []:`, e);
      return [];
    }
  }

  #writeMovies(movies: Movie[]): void {
    localStorage.setItem(MOVIES_KEY, JSON.stringify(movies));
  }

  #readTmdbApiKey(): string | null {
    const raw = localStorage.getItem(TMDB_API_KEY_KEY)?.trim();
    return raw ? raw : null;
  }

  async #fetchTmdbMovieDetails(tmdbId: number): Promise<{
    year?: number;
    posterUrl?: string;
    overview?: string;
    tags: string[];
  } | null> {
    const apiKey = this.#readTmdbApiKey();
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

  // ── Private: Books ─────────────────────────────────────────────────────────

  #readBooks(): Book[] {
    const raw = localStorage.getItem(BOOKS_KEY);
    if (!raw) return [];
    try {
      return BookArraySchema.parse(JSON.parse(raw)) as unknown as Book[];
    } catch (e) {
      console.error(`[LocalStorageAdapter] Invalid data in "${BOOKS_KEY}", falling back to []:`, e);
      return [];
    }
  }

  #writeBooks(books: Book[]): void {
    localStorage.setItem(BOOKS_KEY, JSON.stringify(books));
  }

  // ── Private: Reading Goals ─────────────────────────────────────────────────

  #readReadingGoals(): ReadingGoal[] {
    const raw = localStorage.getItem(READING_GOALS_KEY);
    if (!raw) return [];
    try {
      return ReadingGoalArraySchema.parse(JSON.parse(raw)) as unknown as ReadingGoal[];
    } catch (e) {
      console.error(`[LocalStorageAdapter] Invalid data in "${READING_GOALS_KEY}", falling back to []:`, e);
      return [];
    }
  }

  #writeReadingGoals(goals: ReadingGoal[]): void {
    localStorage.setItem(READING_GOALS_KEY, JSON.stringify(goals));
  }
}

type DesktopSteamSyncPayload = {
  resolvedSteamId: string;
  ownedGamesResponse: unknown;
};

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

function ok<T>(data: T): Result<T> {
  return { ok: true, data };
}

function err<T>(error: string): Result<T> {
  return { ok: false, error };
}

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
