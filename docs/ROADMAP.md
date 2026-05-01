# Roadmap

## Produto Atual: Desktop + SQLite

- [x] Desktop Tauri como versao canonica/final do aplicativo.
- [x] Sidecar Rust `planner-server` embutido no desktop.
- [x] Persistencia local em SQLite via `apps/server-rust`.
- [x] Frontend React/Vite compilado em modo `rest` para o desktop.
- [x] `LocalStorageAdapter` mantido apenas como harness de desenvolvimento/teste.

## Fundacao Concluida

- [x] Monorepo pnpm com `packages/core`, `apps/web`, `apps/server-rust` e `apps/desktop`.
- [x] Padrao adapter: `DataAdapter` interface em `core`, implementacoes em `apps/web`.
- [x] Modelos com discriminated unions: `OnceDever | CyclicDever`, `RecurrenceConfig`.
- [x] Funcoes puras de dominio com testes.
- [x] Habitos: criar, listar, check-off diario, arquivar.
- [x] Deveres: criar (`once` + `cyclic`), listar, marcar ocorrencia, arquivar.
- [x] Hoje view: habitos + deveres devidos/overdue, ordenacao por prioridade.
- [x] Documentacao: `AGENTS.md`, `docs/`, `specs/`.

## Backend Local Concluido

- [x] Backend Rust com Axum + rusqlite.
- [x] API REST: habits, deveres, foods, diary, nutrition profile/summary, today, games, projetos.
- [x] `RestApiAdapter` implementado em `apps/web/src/adapters/`.
- [x] JSON blob storage com SQLite.
- [x] CORS configurado para desenvolvimento local.

## Enriquecimento

- [ ] Progress tracking em deveres (%, etapas/subtarefas).
- [x] Streaks de habitos (currentStreak, bestStreak, atRisk, rate30d).
- [ ] Revisao semanal (% de consistencia, deveres concluidos).
- [x] Rastreamento de nutricao (banco de alimentos, diario, perfil, metas, percentuais).
- [ ] Export CSV.
- [ ] Intervalo de recorrencia (ex: a cada 2 semanas).
- [x] Dark mode.

## Futuro

- Servidor remoto multiusuario ou sync entre dispositivos.
- Auth.
- PWA/mobile se houver necessidade real.
