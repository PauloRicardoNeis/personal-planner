# Planner App

App web de planejamento pessoal com hábitos diários e deveres (tarefas únicas e cíclicas).

## Quick start

```bash
# Instalar dependências
pnpm install

# Rodar o frontend (localhost:5173)
pnpm dev:web

# Typecheck em todos os pacotes
pnpm typecheck

# Testes
pnpm test
```

Se voce esta configurando uma maquina Windows nova, veja [`docs/DEV_SETUP_WINDOWS.md`](./docs/DEV_SETUP_WINDOWS.md).

## Estrutura

```
packages/core/   Tipos, schemas Zod, contrato DataAdapter, lógica de recorrência
apps/web/        Frontend React + Vite (localStorage no MVP)
docs/            Arquitetura, data model, spec MVP, roadmap, decisões
specs/           Specs de feature no formato Dado/Quando/Então
```

## Documentação

- [`AGENTS.md`](./AGENTS.md) — guia para agentes de IA (leia antes de qualquer mudança)
- [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) — arquitetura e padrão adapter
- [`docs/DATA_MODEL.md`](./docs/DATA_MODEL.md) — modelos de dados completos
- [`docs/MVP_SPEC.md`](./docs/MVP_SPEC.md) — acceptance criteria do MVP
- [`docs/ROADMAP.md`](./docs/ROADMAP.md) — fases de desenvolvimento
- [`docs/DECISIONS.md`](./docs/DECISIONS.md) — log de decisões técnicas

## Backend (Phase 2)

No MVP, o app usa `localStorage` no browser. Na Phase 2, um servidor Express + SQLite será ativado via `VITE_BACKEND_MODE=rest` sem necessidade de reescrever o frontend.
