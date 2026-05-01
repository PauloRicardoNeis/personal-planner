# Planner App

App desktop de planejamento pessoal com habitos diarios e deveres (tarefas unicas e ciclicas).

## Produto Canonico

A versao correta e final do aplicativo e o **desktop Tauri** gerado por `pnpm build:desktop`. Ele embute o sidecar Rust `planner-server` e persiste dados em SQLite.

O frontend web/Vite e o `LocalStorageAdapter` continuam no repo apenas como harness de desenvolvimento e teste da UI. Eles nao sao a versao de produto.

## Quick Start

```bash
# Instalar dependencias
pnpm install

# Rodar o frontend de desenvolvimento (localhost:5173)
pnpm dev:web

# Rodar o servidor Rust usado pelo desktop
pnpm dev:server

# Gerar o installer desktop final
pnpm build:desktop

# Typecheck em todos os pacotes
pnpm typecheck

# Testes
pnpm test
```

Se voce esta configurando uma maquina Windows nova, veja [`docs/DEV_SETUP_WINDOWS.md`](./docs/DEV_SETUP_WINDOWS.md).

## Estrutura

```text
packages/core/     Tipos, schemas Zod, contrato DataAdapter, logica de recorrencia
apps/web/          Frontend React + Vite; localStorage apenas para dev/teste
apps/server-rust/  Backend Rust + SQLite usado pelo desktop
apps/desktop/      App Tauri final com sidecar planner-server
docs/              Arquitetura, data model, spec MVP, roadmap, decisoes
specs/             Specs de feature no formato Dado/Quando/Entao
```

## Documentacao

- [`AGENTS.md`](./AGENTS.md) - guia para agentes de IA (leia antes de qualquer mudanca)
- [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) - arquitetura e padrao adapter
- [`docs/DATA_MODEL.md`](./docs/DATA_MODEL.md) - modelos de dados completos
- [`docs/MVP_SPEC.md`](./docs/MVP_SPEC.md) - acceptance criteria do MVP
- [`docs/ROADMAP.md`](./docs/ROADMAP.md) - fases de desenvolvimento
- [`docs/DECISIONS.md`](./docs/DECISIONS.md) - log de decisoes tecnicas

## Backend

O backend de produto e `apps/server-rust` (Axum + SQLite). O desktop compila o frontend com `VITE_BACKEND_MODE=rest` e fala com o sidecar em `127.0.0.1:3001`.

`VITE_BACKEND_MODE=local` usa `localStorage` e deve ser tratado como ambiente auxiliar de desenvolvimento/teste, nao como armazenamento final.
