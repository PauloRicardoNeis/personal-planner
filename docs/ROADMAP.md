# Roadmap

## MVP (Phase 1) — concluído

- [x] Monorepo pnpm com `packages/core` + `apps/web`
- [x] Padrão adapter: `DataAdapter` interface em `core`, implementações em `apps/web`
- [x] Modelos com discriminated unions: `OnceDever | CyclicDever`, `RecurrenceConfig`
- [x] `isOccurrenceOn()` com Vitest (11 testes)
- [x] `LocalStorageAdapter` completo
- [x] Hábitos: criar, listar, check-off diário, arquivar
- [x] Deveres: criar (once + cyclic), listar, marcar ocorrência, arquivar
- [x] Hoje view: hábitos + deveres devidos/overdue, ordenação por prioridade
- [x] Documentação: AGENTS.md, docs/, specs/

## Phase 2 — Backend remoto — concluído

- [x] Backend Rust com Axum + rusqlite (SQLite bundled)
- [x] API REST completa: habits, deveres, foods, diary, nutrition profile/summary, today
- [x] `RestApiAdapter` implementado em `apps/web/src/adapters/`
- [x] Ativar via `VITE_BACKEND_MODE=rest` + `VITE_API_BASE_URL=http://localhost:3001`
- [x] CORS configurado para desenvolvimento local
- [x] JSON blob storage com SQLite — sem ORM, sem migrations complexas

**Nota:** Decisão mudou de Express+SQLite para Rust+Axum (ver ADR-009).

## Phase 3 — Enriquecimento — parcialmente concluído

- [ ] Progress tracking em deveres (%, etapas/subtarefas)
- [x] Streaks de hábitos (currentStreak, bestStreak, atRisk, rate30d)
- [ ] Revisão semanal (% de consistência, deveres concluídos)
- [x] Rastreamento de nutrição (banco de alimentos, diário, perfil, metas, percentuais)
- [ ] Export CSV
- [ ] Intervalo de recorrência (ex: a cada 2 semanas)
- [x] Dark mode (CSS custom properties + prefers-color-scheme)

## Phase 4 — Futuro

- Auth (token single-user ou OAuth)
- Deploy: Railway/Render/Fly.io
- PWA (offline-first com sync)
- Mobile app (React Native ou Capacitor)
