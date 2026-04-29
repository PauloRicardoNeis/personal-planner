# Decision Log (ADR)

Registro leve de decisões técnicas e de produto. Formato: contexto → decisão → consequências.

---

## ADR-001 — Monorepo com pnpm workspaces (sem Turborepo)

**Data:** 2026-03-11
**Status:** Aceito

**Contexto:** Projeto single-developer com 2-3 pacotes (core, web, server futuro).

**Decisão:** pnpm workspaces sem Turborepo.

**Consequências:** Setup simples, sem overhead de CI pipeline. Se o número de pacotes crescer, adicionar Turborepo é trivial.

---

## ADR-002 — Padrão Adapter para acesso a dados

**Data:** 2026-03-11
**Status:** Aceito

**Contexto:** MVP usa localStorage, mas o sistema deve suportar um servidor remoto no futuro sem reescrever o frontend.

**Decisão:** Interface `DataAdapter` em `packages/core`. Frontend importa apenas a interface. Implementações concretas ficam em `apps/web/src/adapters/`. Seleção em um único ponto: `apps/web/src/adapter.ts`.

**Consequências:** Pequeno overhead de boilerplate inicial. Troca de backend = zero mudanças na UI. Lógica de negócio (recorrência, ordenação) testável sem React.

---

## ADR-003 — Discriminated unions para Dever e RecurrenceConfig

**Data:** 2026-03-11
**Status:** Aceito

**Contexto:** Interface flat com campos opcionais (`deadline?`, `recurrence?`) não enforça invariantes — um dever `once` com `recurrence` seria válido para o TypeScript.

**Decisão:** `Dever = OnceDever | CyclicDever`. `RecurrenceConfig = DailyRecurrence | WeeklyRecurrence | MonthlyRecurrence`. Invariantes enforçadas em compile time.

**Consequências:** Agentes de IA e desenvolvedores recebem erro de TypeScript ao criar objetos inválidos. Mais verbose mas mais seguro.

---

## ADR-004 — Sem `interval` no MVP

**Data:** 2026-03-11
**Status:** Aceito

**Contexto:** `interval: 2` com `type: 'weekly'` levanta a pergunta "a cada 2 semanas a partir de quando?" — requer lógica de âncora e estado adicional.

**Decisão:** Remover `interval` do MVP. Suportar apenas `daily`, `weekly` (dias da semana), `monthly` (dia do mês).

**Consequências:** Casos como "a cada 2 semanas" não são suportados no MVP. Podem ser adicionados na Phase 3 com âncora definida na criação do dever.

---

## ADR-005 — `completions` sparse map em Habit, array em Dever

**Data:** 2026-03-11
**Status:** Aceito

**Contexto:** Habits podem ter uma ou mais ocorrências por dia. Deveres têm ocorrências que precisam de metadados (`occurrenceDate` vs `completedAt`).

**Decisão:** `Habit.completions: Record<ISODate, number>` — sparse map de contagens diárias, O(1) lookup, JSON compacto. `Dever.completions: DeverCompletion[]` — array com `occurrenceDate` e `completedAt`.

**Consequências:** Para habits, ausência no map = zero ocorrências (não armazena `0`). Para deveres, histórico rico permite saber quando algo foi concluído vs. quando deveria ter sido.

---

## ADR-006 — Schemas Zod co-localizados com interfaces TypeScript

**Data:** 2026-03-11
**Status:** Aceito

**Contexto:** Schema e tipo devem sempre estar em sincronia.

**Decisão:** `HabitSchema` e `HabitArraySchema` no mesmo arquivo que `Habit`. `DeverSchema` e `DeverArraySchema` no mesmo arquivo que `Dever`.

**Consequências:** Um único arquivo para atualizar quando o modelo muda. Sem risco de tipos e schemas divergirem.

---

## ADR-007 — `getTodaySnapshot` é método do adapter, não lógica de UI

**Data:** 2026-03-11
**Status:** Aceito

**Contexto:** Calcular quais deveres cíclicos disparam em uma data requer lógica de recorrência. Essa lógica não deve ficar em hooks ou componentes React.

**Decisão:** `DataAdapter.getTodaySnapshot(date)` retorna snapshot pré-montado com `isDone`, `isOverdue` e ordenação aplicados. A função pura `isOccurrenceOn` em `domain/recurrence.ts` é usada internamente pelo adapter.

**Consequências:** Hooks React são finos (só chamam o adapter e gerenciam estado). Lógica de agendamento testável com Vitest sem React Testing Library. Quando o servidor for ativado, ele implementa a mesma lógica server-side e expõe `GET /api/today`.

---

## ADR-008 — Node.js + Express + SQLite para servidor (Phase 2)

**Data:** 2026-03-11
**Status:** Substituído por ADR-009

**Contexto:** Developer é familiarizado com React/TypeScript. Servidor deve ser simples de implementar e deployar.

**Decisão:** Node.js + Express v4 + better-sqlite3. TypeScript end-to-end. SQLite como arquivo único — sem servidor de banco de dados.

**Consequências:** Zero context switch entre frontend e backend (mesmo idioma). SQLite é suficiente para uso single-user. Migração para PostgreSQL é trivial via troca de driver se escala exigir.

---

## ADR-009 — Rust (Axum + rusqlite) para backend em vez de Express

**Data:** 2026-03-13
**Status:** Aceito

**Contexto:** O plano original era Express + better-sqlite3. Porém, Rust oferece binário único sem runtime, uso mínimo de memória, e melhor type safety com serde.

**Decisão:** Backend em Rust com Axum (async HTTP), rusqlite com feature `bundled` (compila SQLite junto), serde para serialização JSON. JSON blob storage — cada entidade é uma row `(id TEXT, data TEXT)`.

**Consequências:** Binário standalone (~5MB), sem Node.js em produção. Compilação mais lenta (~30s). Developer precisa de Rust toolchain. API REST idêntica ao que Express teria exposto — frontend não sabe a diferença.

---

## ADR-010 — Streaks computados on-the-fly, não persistidos

**Data:** 2026-03-13
**Status:** Aceito

**Contexto:** Streaks de hábitos (currentStreak, bestStreak, atRisk, rate30d) poderiam ser persistidos ou calculados a cada request.

**Decisão:** `computeStreaks(completions, today, createdAt)` é uma função pura que calcula tudo a partir do sparse map de completions. Nada persistido.

**Consequências:** Zero estado adicional, zero risco de dessincronização. Performance aceitável: walk backwards é O(streak length), sort para bestStreak é O(n log n) onde n = total de completions. Para um hábito com 365 completions no ano, é instantâneo.

---

## ADR-011 — Nutrição: NutrientsPer100g como base, porções calculadas

**Data:** 2026-03-13
**Status:** Aceito

**Contexto:** Bases de dados nutricionais (USDA, TACO) usam nutrientes por 100g como padrão. Porções variam.

**Decisão:** Todos os alimentos armazenam `NutrientsPer100g` (5 macros obrigatórios + 15 micros opcionais). Ao adicionar ao diário, o usuário informa a gramagem e `computePortionNutrients(per100g, grams)` faz a regra de três. Quick entries também usam per100g.

**Consequências:** Consistência com bases de dados internacionais. Usuário precisa saber a gramagem (balança de cozinha). O campo `servingGrams` no Food ajuda como referência.

---

## ADR-012 — Metas nutricionais por fórmula + customTargets override

**Data:** 2026-03-13
**Status:** Aceito

**Contexto:** Fórmulas de macros por peso corporal são estimativas. Nutricionistas frequentemente ajustam valores individuais.

**Decisão:** `computeDailyTargets(profile)` calcula metas base por peso×multiplicador (cut/maintain/bulk). O campo `customTargets?: Partial<DailyTargets>` permite override de qualquer valor calculado.

**Consequências:** Funciona out-of-the-box com fórmulas padrão. Usuários avançados podem customizar individualmente sem perder o cálculo base dos outros campos.
