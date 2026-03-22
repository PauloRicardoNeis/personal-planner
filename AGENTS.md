# AGENTS.md

Leia este arquivo antes de fazer qualquer mudança no projeto.

## O que é esse projeto

`planner-app` é um app web de planejamento pessoal single-user. Ele rastreia:

- **Hábitos** — comportamentos diários repetidos infinitamente (ex: Anki, exercício)
- **Deveres** — tarefas a fazer, podendo ser únicas (`once`) ou cíclicas (`cyclic`)
- **Hoje** — view unificada com hábitos do dia + deveres devidos/atrasados

No MVP, o app roda 100% no browser com `localStorage`. O contrato de dados foi projetado para trocar o adapter local por um servidor remoto sem reescrever a UI.

## Mapa de diretórios

| Caminho | Propósito |
|---|---|
| `packages/core/` | Types, schemas Zod, contrato `DataAdapter`, funções puras |
| `packages/core/src/contracts/DataAdapter.ts` | **O CONTRATO** — leia antes de tocar em qualquer data flow |
| `packages/core/src/models/` | Interfaces `Habit`, `OnceDever`, `CyclicDever` e schemas Zod |
| `packages/core/src/domain/recurrence.ts` | `isOccurrenceOn()` — lógica pura de agendamento, com testes |
| `apps/web/src/adapter.ts` | **ÚNICO ponto** onde o adapter concreto é instanciado |
| `apps/web/src/adapters/` | `LocalStorageAdapter` (MVP) e `RestApiAdapter` (stub Phase 2) |
| `apps/web/src/hooks/` | Hooks React que consomem o adapter |
| `apps/web/src/pages/` | `HojePage`, `HabitsPage`, `DeveresPage` |
| `docs/` | Arquitetura, data model, MVP spec, roadmap, decisões |
| `specs/` | Specs de feature no formato Dado/Quando/Então |

## Antes de tocar nos modelos de dados

Leia `docs/DATA_MODEL.md`. Os schemas Zod são co-localizados com as interfaces TypeScript no mesmo arquivo. Ao adicionar um campo a uma interface, atualize o schema Zod correspondente no mesmo arquivo.

## Antes de tocar no data access

Leia `packages/core/src/contracts/DataAdapter.ts`. Todo acesso a dados no frontend passa por essa interface. Nunca importe `LocalStorageAdapter` ou `RestApiAdapter` fora de `apps/web/src/adapter.ts`.

## Antes de criar uma feature nova

Verifique `specs/` para um spec file existente. Se não existir, crie um usando o formato definido em `specs/README.md` antes de escrever código.

## Regras de arquitetura

- `packages/core` tem **zero** dependências de browser APIs, `localStorage`, `fetch` ou React
- `packages/core` contém apenas modelos, schemas, contratos e funções puras
- `apps/web` importa de `packages/core` mas nunca de `apps/server`
- A UI depende apenas de `DataAdapter` — nunca de classes concretas de adapter
- Todos os valores de data em modelos são strings `YYYY-MM-DD` (`ISODate`) ou ISO completo (`ISODateTime`)
- IDs são `crypto.randomUUID()` — branded types evitam mistura de IDs de entidades distintas
- Todos os métodos do adapter retornam `Promise<Result<T>>` — nunca lançam exceção além da fronteira do adapter
- `updateDever` não pode alterar `type` ou `recurrence` — para mudar, arquivar e recriar

## Comandos comuns

```bash
# Instalar todas as dependências do workspace
pnpm install

# Frontend dev server (porta 5173)
pnpm --filter web dev

# Typecheck em todos os pacotes
pnpm -r typecheck

# Rodar todos os testes
pnpm -r test

# Build do frontend
pnpm --filter web build

# Typecheck só do core
pnpm --filter core typecheck

# Testes só do core
pnpm --filter core test
```

## Workflow de spec-driven development

Para qualquer mudança não-trivial:

1. Verifique `specs/` para um spec existente
2. Se não existir, crie um spec (formato em `specs/README.md`)
3. Implemente contra os acceptance criteria do spec
4. Marque os critérios como concluídos no spec ao terminar

Mudanças triviais (copy, ajustes de estilo, renomeações simples): spec opcional.

## O que está no MVP

- Hábitos: criar, listar, check-off diário, desmarcar, arquivar
- Deveres: criar (`once` e `cyclic`), listar, marcar ocorrência como feita, desmarcar, arquivar
- Hoje view: hábitos ativos + deveres devidos/overdue do dia

## O que NÃO está no MVP

- Servidor remoto (Phase 2)
- Autenticação
- Sync entre dispositivos
- Progress tracking (%, etapas)
- Streaks de hábitos
- Revisão semanal
- Rastreamento de nutrição
- Export CSV

Se você encontrar referências a esses tópicos, são features de Phase 2+.
