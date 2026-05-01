# Architecture

## Overview

`planner-app` e um monorepo pnpm com quatro pacotes principais:

| Pacote | Tipo | Proposito |
|---|---|---|
| `packages/core` | Library (TS) | Modelos, schemas Zod, contrato `DataAdapter`, funcoes puras de dominio |
| `apps/web` | React App (Vite) | UI compartilhada; consome `DataAdapter` e nao sabe qual backend esta ativo |
| `apps/server-rust` | Axum App (Rust) | Backend de produto: API REST + SQLite persistente |
| `apps/desktop` | Tauri App | Produto canonico: empacota a UI e o sidecar `planner-server` |

## Produto Canonico

A versao correta e final do aplicativo e o desktop Tauri gerado por `pnpm build:desktop`.

- O desktop sempre usa `VITE_BACKEND_MODE=rest`.
- O desktop sempre fala com o sidecar Rust `planner-server`.
- O sidecar persiste dados em SQLite no diretorio de dados do aplicativo.
- `LocalStorageAdapter` existe apenas para desenvolvimento rapido, testes de UI e isolamento do frontend no browser.

Nao considere uma feature pronta apenas porque funcionou no `LocalStorageAdapter`; comportamento de produto precisa passar tambem pelo caminho `RestApiAdapter` + `apps/server-rust`.

## Grafo de Dependencias

```text
apps/desktop  ->  apps/web/dist + planner-server sidecar
apps/web      ->  packages/core
apps/server-rust implementa o contrato HTTP equivalente em Rust

apps/web nao importa apps/server-rust diretamente
packages/core nao depende de browser, React, fetch, localStorage ou SQLite
```

## Padrao Adapter

O frontend depende apenas de `DataAdapter`:

```text
UI (hooks, pages, components)
        |
        v
DataAdapter (interface)
        |
   +----+----+
   |         |
LocalStorage RestApi
Adapter      Adapter
dev/test     produto desktop
   |         |
localStorage fetch -> planner-server -> SQLite
```

A selecao do adapter concreto acontece em um unico lugar: `apps/web/src/adapter.ts`.

```typescript
const mode = import.meta.env['VITE_BACKEND_MODE'] ?? 'local';

export const adapter: DataAdapter =
  mode === 'rest'
    ? new RestApiAdapter(import.meta.env['VITE_API_BASE_URL'] as string ?? 'http://localhost:3001')
    : new LocalStorageAdapter();
```

## Configuracao Por Ambiente

| Ambiente | `VITE_BACKEND_MODE` | `VITE_API_BASE_URL` | Uso |
|---|---|---|---|
| Desktop final | `rest` | `http://127.0.0.1:3001` | Produto canonico |
| Browser dev rapido | `local` | opcional | Harness de desenvolvimento/teste |
| Browser contra server local | `rest` | `http://127.0.0.1:3001` | Teste de integracao manual |

## Backend Rust

```text
apps/server-rust/src/
├── main.rs          # Axum router, CORS, state setup
├── db.rs            # SQLite CRUD (rusqlite, JSON blob storage)
├── models.rs        # Serde structs + domain functions
└── routes/
    ├── habits.rs
    ├── deveres.rs
    ├── today.rs
    ├── foods.rs
    ├── diary.rs
    ├── nutrition.rs
    ├── games.rs
    └── projetos.rs
```

Padroes do backend:

- `Arc<Mutex<rusqlite::Connection>>` como state compartilhado.
- JSON blob storage: cada tabela tem `id TEXT PRIMARY KEY, data TEXT NOT NULL`.
- `serde(tag = "type")` para discriminated unions.
- Respostas no formato `{ ok: true, data: T }` ou `{ ok: false, error: string }`.
- Porta padrao do sidecar: `3001`.

## Fluxo De Dados Do Produto

```text
Acao do usuario no desktop
        |
        v
Hook React (useHabits, useToday...)
        |
        v
RestApiAdapter
        |
        v
planner-server (Rust/Axum)
        |
        v
SQLite
        |
        v
Result<T> volta para a UI
```

## Adicionando Um Novo Adapter

Adapters alternativos podem existir para teste ou ambientes auxiliares, mas o desktop final continua sendo o alvo de produto.

1. Crie `apps/web/src/adapters/NovoAdapter.ts`.
2. Implemente a interface `DataAdapter` de `packages/core`.
3. Adicione a selecao em `apps/web/src/adapter.ts`.
4. Nunca importe o novo adapter fora de `adapter.ts`.

## Funcoes Puras De Dominio

| Funcao | Modulo | Proposito |
|---|---|---|
| `isOccurrenceOn(config, date)` | `domain/recurrence.ts` | Verifica se uma recorrencia dispara numa data |
| `computeStreaks(completions, today, createdAt)` | `domain/streaks.ts` | Calcula currentStreak, bestStreak, atRisk, rate30d |
| `computeHabitProgress(habit, date)` | `domain/habits.ts` | Calcula progresso ponderado de um habito |
| `computeDailyTotals(entries, foods)` | `domain/nutrition.ts` | Soma nutrientes de todas as entradas do dia |
| `computeDailyTargets(profile)` | `domain/nutrition.ts` | Calcula metas diarias por peso/objetivo |
