# Architecture

## Overview

`planner-app` é um monorepo pnpm com três pacotes:

| Pacote | Tipo | Propósito |
|---|---|---|
| `packages/core` | Library (TS) | Modelos, schemas Zod, contrato DataAdapter, funções puras de domínio |
| `apps/web` | React App (Vite) | Frontend — consome DataAdapter, nunca sabe qual adapter está ativo |
| `apps/server-rust` | Axum App (Rust) | Backend — API REST + SQLite persistente |

## Grafo de dependências

```
apps/web  ──▶  packages/core
apps/server-rust  (implementa os mesmos contratos, mas em Rust)

apps/web  ✗  apps/server-rust   (nunca se importam mutuamente)
```

`packages/core` não depende de ninguém além de `zod`.

## O padrão Adapter

O frontend nunca sabe onde os dados estão armazenados. Ele depende apenas de `DataAdapter`:

```
UI (hooks, pages, components)
        │
        ▼
  DataAdapter (interface)
        │
   ┌────┴────┐
   │         │
LocalStorage  RestApi
 Adapter     Adapter
   │         │
localStorage  fetch → Express server
```

A seleção do adapter concreto acontece em **um único lugar**: `apps/web/src/adapter.ts`.

```typescript
// apps/web/src/adapter.ts
const mode = import.meta.env.VITE_BACKEND_MODE ?? 'local';
export const adapter: DataAdapter =
  mode === 'rest'
    ? new RestApiAdapter(import.meta.env.VITE_API_BASE_URL)
    : new LocalStorageAdapter();
```

Para trocar de localStorage para servidor Rust, muda-se apenas `VITE_BACKEND_MODE=rest` + `VITE_API_BASE_URL=http://localhost:3001`. O resto do frontend não muda.

## Backend Rust (apps/server-rust)

```
apps/server-rust/src/
├── main.rs          # Axum router, CORS, state setup
├── db.rs            # SQLite CRUD (rusqlite, JSON blob storage)
├── models.rs        # Serde structs + domain functions (streaks, nutrition)
└── routes/
    ├── mod.rs
    ├── habits.rs    # GET/POST /habits, PATCH/POST archive
    ├── deveres.rs   # GET/POST /deveres, PATCH/POST archive/complete
    ├── today.rs     # GET /today — snapshot com streaks + nutrition
    ├── foods.rs     # GET/POST /foods, PATCH, POST archive
    ├── diary.rs     # GET/POST /diary, PATCH, DELETE
    └── nutrition.rs # GET/PUT /nutrition/profile, GET /nutrition/summary
```

**Padrões do backend:**
- `Arc<Mutex<rusqlite::Connection>>` como state compartilhado (Axum)
- JSON blob storage: cada tabela tem `id TEXT PRIMARY KEY, data TEXT NOT NULL`
- `serde(tag = "type")` para discriminated unions (DiaryEntry, Dever)
- `Result<T>` wrapper: `{ ok: true, data: T }` ou `{ ok: false, error: string }`
- Porta padrão: 3001

## Fluxo de dados

```
Ação do usuário (ex: check-off hábito)
        │
        ▼
  Hook React (useHabits, useToday...)
        │  chama adapter.markHabitDone(id, date)
        ▼
  DataAdapter.markHabitDone()
        │
        ▼
  LocalStorageAdapter (MVP)
        │  lê, atualiza, valida com Zod, escreve
        ▼
  localStorage['planner_habits']
        │
        ▼
  Retorna Result<Habit>
        │
        ▼
  Hook atualiza estado React
        │
        ▼
  Componente re-renderiza
```

## Configuração por ambiente

| Variável | Padrão | Descrição |
|---|---|---|
| `VITE_BACKEND_MODE` | `'local'` | `'local'` ou `'rest'` |
| `VITE_API_BASE_URL` | — | Base URL do servidor (Phase 2) |

## Adicionando um novo adapter

Para implementar um novo adapter (ex: `IndexedDBAdapter`):

1. Crie `apps/web/src/adapters/IndexedDBAdapter.ts`
2. Implemente a interface `DataAdapter` de `packages/core`
3. Adicione a seleção em `apps/web/src/adapter.ts`
4. Nunca importe o novo adapter fora de `adapter.ts`

## Estrutura de packages/core

```
packages/core/src/
├── index.ts               # Barrel export — tudo que o core expõe
├── models/
│   ├── shared.ts          # ISODate, ISODateTime, HabitId, DeverId, FoodId, DiaryEntryId, RecurrenceConfig
│   ├── habit.ts           # Habit interface + HabitSchema Zod
│   ├── dever.ts           # OnceDever, CyclicDever, DeverBase, DeverInput + schemas
│   └── nutrition.ts       # Food, DiaryEntry, NutritionProfile, DailyTargets + schemas Zod
├── contracts/
│   └── DataAdapter.ts     # DataAdapter interface, Result<T>, TodaySnapshot (com streaks + nutrition)
└── domain/
    ├── recurrence.ts      # isOccurrenceOn() — função pura
    ├── recurrence.test.ts # 11 testes
    ├── streaks.ts         # computeStreaks() → HabitStreakInfo
    ├── streaks.test.ts    # 25 testes
    ├── nutrition.ts       # computePortionNutrients, computeDailyTotals, computeDailyTargets, computePercentages
    └── nutrition.test.ts  # 28 testes
```

## Funções puras de domínio

| Função | Módulo | Propósito |
|---|---|---|
| `isOccurrenceOn(config, date)` | `domain/recurrence.ts` | Verifica se uma recorrência dispara numa data |
| `computeStreaks(completions, today, createdAt)` | `domain/streaks.ts` | Calcula currentStreak, bestStreak, atRisk, rate30d |
| `computePortionNutrients(per100g, grams)` | `domain/nutrition.ts` | Escala nutrientes por porção |
| `computeDailyTotals(entries, foods)` | `domain/nutrition.ts` | Soma nutrientes de todas as entradas do dia |
| `computeDailyTargets(profile)` | `domain/nutrition.ts` | Calcula metas diárias por peso/objetivo |
| `computePercentages(totals, targets)` | `domain/nutrition.ts` | Percentual de consumo vs meta |
