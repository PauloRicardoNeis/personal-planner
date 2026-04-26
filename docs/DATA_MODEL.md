# Data Model

## Filosofia de design

- **Sparse map para completions de Hábito** — `Record<ISODate, true>` armazena apenas as datas concluídas. Ausência = não feito. O(1) lookup: `habit.completions[today] === true`. JSON compacto.
- **Array para completions de Dever** — `DeverCompletion[]` armazena `occurrenceDate` (quando era esperado) e `completedAt` (quando foi marcado). Isso permite histórico de quando algo foi concluído vs. quando deveria ter sido.
- **Discriminated unions** para `Dever` e `RecurrenceConfig` — enforça invariantes em compile time. `OnceDever` não pode ter `recurrence`, `CyclicDever` não pode ter `deadline`.
- **Branded types para IDs** — evita misturar `HabitId` com `DeverId`. TypeScript captura `markHabitDone(deverId)` em compilação.
- **ISODate para campos de ocorrência, ISODateTime para timestamps** — campos que representam "um dia" usam `YYYY-MM-DD`; campos que precisam de momento exato usam ISO completo.

## Tipos base

```typescript
// "YYYY-MM-DD" — representa apenas um dia, sem horário
type ISODate = string & { readonly __brand: 'ISODate' };

// ISO 8601 completo — "2026-03-10T14:30:00.000Z"
type ISODateTime = string & { readonly __brand: 'ISODateTime' };

type HabitId = string & { readonly __brand: 'HabitId' };
type DeverId = string & { readonly __brand: 'DeverId' };
type FoodId = string & { readonly __brand: 'FoodId' };
type DiaryEntryId = string & { readonly __brand: 'DiaryEntryId' };
type GameId = string & { readonly __brand: 'GameId' };
```

## RecurrenceConfig

```typescript
type DailyRecurrence = {
  type: 'daily';
  // Sem campos extras — dispara todo dia
};

type WeekdayName =
  | 'monday' | 'tuesday' | 'wednesday' | 'thursday'
  | 'friday' | 'saturday' | 'sunday';

type WeeklyRecurrence = {
  type: 'weekly';
  weekdays: [WeekdayName, ...WeekdayName[]]; // ao menos um dia
};

type MonthlyRecurrence = {
  type: 'monthly';
  monthDay: number; // 1–31
  // Se o mês não tem esse dia (ex: 31 em fevereiro), skip silencioso
};

type RecurrenceConfig = DailyRecurrence | WeeklyRecurrence | MonthlyRecurrence;
```

**Sem `interval` no MVP** — "a cada 2 semanas" levanta a pergunta "a partir de quando?", que requer lógica de âncora e não é necessária no MVP.

## Habit

```typescript
interface Habit {
  id: HabitId;
  title: string;          // nome do hábito (ex: "Anki", "Exercício")
  category?: string;      // label livre (ex: "saúde", "aprendizado")
  active: boolean;        // false = arquivado, não aparece em listas ativas
  createdAt: ISODateTime; // timestamp de criação
  // Sparse map: só armazena datas concluídas
  // habit.completions["2026-03-10"] === true → feito nesse dia
  // habit.completions["2026-03-11"] === undefined → não feito
  completions: Record<ISODate, true>;
}

type HabitInput = {
  title: string;
  category?: string;
};
```

## Dever

```typescript
interface DeverBase {
  id: DeverId;
  title: string;
  area?: string;                        // "saúde", "finanças", "carreira"...
  priority: 'low' | 'medium' | 'high';
  active: boolean;                      // false = arquivado
  createdAt: ISODateTime;
  completions: DeverCompletion[];
}

interface DeverCompletion {
  occurrenceDate: ISODate;    // data agendada da ocorrência (deadline ou data do ciclo)
  completedAt: ISODateTime;   // quando o usuário marcou como feito
}

interface OnceDever extends DeverBase {
  type: 'once';
  deadline: ISODate; // obrigatório — TypeScript enforça isso
}

interface CyclicDever extends DeverBase {
  type: 'cyclic';
  recurrence: RecurrenceConfig; // obrigatório — TypeScript enforça isso
}

type Dever = OnceDever | CyclicDever;

type DeverInput =
  | { type: 'once'; title: string; deadline: ISODate; area?: string; priority: 'low'|'medium'|'high' }
  | { type: 'cyclic'; title: string; recurrence: RecurrenceConfig; area?: string; priority: 'low'|'medium'|'high' };
```

## HabitStreakInfo

Calculado on-the-fly por `computeStreaks()` — não é persistido.

```typescript
interface HabitStreakInfo {
  currentStreak: number;   // dias consecutivos até hoje (ou ontem se atRisk)
  bestStreak: number;      // maior sequência histórica
  atRisk: boolean;         // true se hoje não marcado mas ontem sim
  rate30d: number;         // 0-100, % de dias feitos nos últimos 30 dias (ou desde criação)
}
```

## Food (Banco de alimentos)

```typescript
interface Food {
  id: FoodId;
  name: string;
  brand?: string;
  category?: string;
  servingDescription?: string;
  servingGrams?: number;
  nutrients: NutrientsPer100g;  // 5 macros obrigatórios + 15 micros opcionais
  active: boolean;               // false = arquivado
  createdAt: ISODateTime;
}
```

## DiaryEntry (Diário alimentar)

Discriminated union: entrada por food bank ou entrada rápida.

```typescript
interface FoodDiaryEntry {
  type: 'food';
  id: DiaryEntryId;
  date: ISODate;
  foodId: FoodId;       // referência ao banco de alimentos
  grams: number;
  meal?: string;        // "café", "almoço", "jantar", "lanche"
  createdAt: ISODateTime;
}

interface QuickDiaryEntry {
  type: 'quick';
  id: DiaryEntryId;
  date: ISODate;
  description: string;
  grams: number;
  nutrients: NutrientsPer100g;  // inline, sem salvar no banco
  meal?: string;
  createdAt: ISODateTime;
}

type DiaryEntry = FoodDiaryEntry | QuickDiaryEntry;
```

## NutritionProfile

```typescript
interface NutritionProfile {
  weightKg: number;
  goalType: 'cut' | 'maintain' | 'bulk';
  customTargets?: Partial<DailyTargets>;  // overrides das metas calculadas
}
```

**Fórmulas por objetivo:**
| Goal | Calorias | Proteína | Gordura | Fibra |
|---|---|---|---|---|
| Cut | peso×22 | peso×2.2 | peso×0.8 | 25g |
| Maintain | peso×28 | peso×1.8 | peso×1.0 | 30g |
| Bulk | peso×34 | peso×2.0 | peso×1.2 | 30g |

Carbs = (calorias - proteína×4 - gordura×9) / 4

## DailyTargets

```typescript
interface DailyTargets {
  calories: number; protein: number; carbs: number; fat: number; fiber: number;
  // Opcionais (micros):
  saturatedFat?: number; sugar?: number; sodium?: number; potassium?: number;
  calcium?: number; iron?: number; vitaminA?: number; vitaminC?: number;
  vitaminD?: number; vitaminB12?: number; magnesium?: number; zinc?: number;
  omega3?: number; cholesterol?: number;
}
```

## Game

Biblioteca importada da Steam no MVP.

```typescript
interface Game {
  id: GameId;                  // "steam:<appid>"
  source: 'steam';
  steamAppId: number;
  name: string;
  playtimeMinutes: number;
  iconHash?: string;
  logoHash?: string;
  lastImportedAt: ISODateTime;
}

interface SteamLibrarySettings {
  apiKey: string;
  profile: string;             // SteamID64, vanity URL ou URL completa
  resolvedSteamId?: string;
  lastSyncedAt?: ISODateTime;
}
```

## TodaySnapshot

Montado pelo adapter em `getTodaySnapshot(date)`. A lógica de recorrência fica no adapter, não na UI.

```typescript
interface TodaySnapshot {
  date: ISODate;
  habits: Array<{
    habit: Habit;
    isDone: boolean;
    streak: HabitStreakInfo;   // streaks calculados on-the-fly
  }>;
  deveres: Array<{
    dever: Dever;
    occurrenceDate: ISODate;
    isDone: boolean;
    isOverdue: boolean;
  }>;
  nutritionSummary?: {        // presente se há perfil ou entradas no dia
    calories: { value: number; target: number; percent: number };
    protein:  { value: number; target: number; percent: number };
    carbs:    { value: number; target: number; percent: number };
    fat:      { value: number; target: number; percent: number };
  };
}
```

## Invariantes

| Regra | Consequência |
|---|---|
| `active: false` | Não aparece em listas ativas nem em `TodaySnapshot` |
| `OnceDever` overdue (deadline < hoje, não concluído) | Aparece em Hoje com `isOverdue: true` até ser concluído ou arquivado |
| `MonthlyRecurrence.monthDay` não existe no mês | Skip silencioso — `isOccurrenceOn` retorna `false` |
| Parse inválido do localStorage | Fallback para `[]` + `console.error`, sem crash |
| `updateDever` não muda `type` ou `recurrence` | Para mudar, arquivar e recriar |

## Armazenamento localStorage

| Chave | Tipo | Conteúdo |
|---|---|---|
| `planner_habits` | `Habit[]` | Array JSON de todos os hábitos |
| `planner_deveres` | `Dever[]` | Array JSON de todos os deveres |
| `planner_foods` | `Food[]` | Array JSON de todos os alimentos |
| `planner_diary` | `DiaryEntry[]` | Array JSON de todas as entradas do diário |
| `planner_nutrition_profile` | `NutritionProfile` | Perfil nutricional (peso + objetivo) |
| `planner_games` | `Game[]` | Biblioteca importada da Steam |
| `planner_steam_settings` | `SteamLibrarySettings` | Chave e perfil usados na sincronizaÃ§Ã£o da Steam |

Toda leitura é validada com os schemas Zod correspondentes.

## Armazenamento SQLite (backend Rust)

| Tabela | Schema | Conteúdo |
|---|---|---|
| `habits` | `id TEXT PK, data TEXT` | JSON blob por hábito |
| `deveres` | `id TEXT PK, data TEXT` | JSON blob por dever |
| `foods` | `id TEXT PK, data TEXT` | JSON blob por alimento |
| `diary_entries` | `id TEXT PK, data TEXT` | JSON blob por entrada |
| `nutrition_profile` | `id TEXT PK, data TEXT` | JSON blob (id='default') |
| `games` | `id TEXT PK, data TEXT` | JSON blob por jogo importado |
| `steam_library_settings` | `id TEXT PK, data TEXT` | JSON blob (id='default') com config da Steam |

## Schemas Zod

Os schemas Zod são co-localizados com as interfaces TypeScript:

- `HabitSchema` em `packages/core/src/models/habit.ts`
- `DeverSchema` (union de `OnceDeverSchema | CyclicDeverSchema`) em `packages/core/src/models/dever.ts`
- `RecurrenceConfigSchema` em `packages/core/src/models/shared.ts`
- `FoodSchema`, `FoodArraySchema` em `packages/core/src/models/nutrition.ts`
- `DiaryEntrySchema` (discriminated union food|quick), `DiaryEntryArraySchema` em `packages/core/src/models/nutrition.ts`
- `NutritionProfileSchema` em `packages/core/src/models/nutrition.ts`
- `GameSchema`, `GameArraySchema`, `SteamLibrarySettingsSchema` em `packages/core/src/models/game.ts`

Ao adicionar um campo à interface, adicione ao schema correspondente no mesmo arquivo.
