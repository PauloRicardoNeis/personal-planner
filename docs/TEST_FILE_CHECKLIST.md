# Test File Checklist

Snapshot: 2026-04-29

Esta checklist rastreia os arquivos de producao ja existentes e o local esperado dos testes conforme `docs/TESTING.md`.

Legenda:

- [x] Existe pelo menos um arquivo de teste no local esperado
- [ ] Falta criar o arquivo de teste no local esperado

Observacao: esta checklist mede existencia/localizacao do teste. A meta de coverage continua sendo 100% de `lines`, `statements`, `functions` e `branches` por arquivo.

## Core

### Domain

- [x] `packages/core/src/domain/compras.ts` -> `packages/core/src/domain/compras.test.ts`
- [x] `packages/core/src/domain/dever.ts` -> `packages/core/src/domain/dever.test.ts`
- [x] `packages/core/src/domain/habits.ts` -> `packages/core/src/domain/habits.test.ts`
- [x] `packages/core/src/domain/nutrition.ts` -> `packages/core/src/domain/nutrition.test.ts`
- [x] `packages/core/src/domain/openLibrary.ts` -> `packages/core/src/domain/openLibrary.test.ts`
- [x] `packages/core/src/domain/projeto.ts` -> `packages/core/src/domain/projeto.test.ts`
- [x] `packages/core/src/domain/recurrence.ts` -> `packages/core/src/domain/recurrence.test.ts`
- [x] `packages/core/src/domain/saude.ts` -> `packages/core/src/domain/saude.test.ts`
- [x] `packages/core/src/domain/steam.ts` -> `packages/core/src/domain/steam.test.ts`
- [x] `packages/core/src/domain/streaks.ts` -> `packages/core/src/domain/streaks.test.ts`

### Models And Schemas

- [x] `packages/core/src/models/book.ts` -> `packages/core/src/models/book.test.ts`
- [x] `packages/core/src/models/compra.ts` -> `packages/core/src/models/compra.test.ts`
- [x] `packages/core/src/models/dever.ts` -> `packages/core/src/models/dever.test.ts`
- [x] `packages/core/src/models/game.ts` -> `packages/core/src/models/game.test.ts`
- [x] `packages/core/src/models/habit.ts` -> `packages/core/src/models/habit.test.ts`
- [x] `packages/core/src/models/movie.ts` -> `packages/core/src/models/movie.test.ts`
- [x] `packages/core/src/models/nutrition.ts` -> `packages/core/src/models/nutrition.test.ts`
- [x] `packages/core/src/models/projeto.ts` -> `packages/core/src/models/projeto.test.ts`
- [x] `packages/core/src/models/saude.ts` -> `packages/core/src/models/saude.test.ts`
- [x] `packages/core/src/models/shared.ts` -> `packages/core/src/models/shared.test.ts`

### Contracts And Exports

- [ ] `packages/core/src/contracts/DataAdapter.ts` -> `tests/contracts/dataAdapterContractSuite.ts`
- [x] `packages/core/src/index.ts` -> `packages/core/src/index.test.ts`

## Web

### Composition And Pure Frontend Helpers

- [x] `apps/web/src/adapter.ts` -> `apps/web/src/adapter.test.ts`
- [x] `apps/web/src/App.tsx` -> `apps/web/src/test/pages/App.test.tsx`
- [x] `apps/web/src/deverPresentation.ts` -> `apps/web/src/deverPresentation.test.ts`
- [x] `apps/web/src/habitCompatibility.ts` -> `apps/web/src/habitCompatibility.test.ts`
- [ ] `apps/web/src/main.tsx` -> `apps/web/src/test/pages/main.test.tsx`

### Adapters

- [ ] `apps/web/src/adapters/LocalStorageAdapter.ts` -> `apps/web/src/adapters/LocalStorageAdapter.contract.test.ts`
- [ ] `apps/web/src/adapters/RestApiAdapter.ts` -> `apps/web/src/adapters/RestApiAdapter.contract.test.ts`

### Hooks

- [ ] `apps/web/src/hooks/useBooks.ts` -> `apps/web/src/test/hooks/useBooks.test.tsx`
- [ ] `apps/web/src/hooks/useBookSearch.ts` -> `apps/web/src/test/hooks/useBookSearch.test.tsx`
- [ ] `apps/web/src/hooks/useCalendar.ts` -> `apps/web/src/test/hooks/useCalendar.test.tsx`
- [ ] `apps/web/src/hooks/useCompras.ts` -> `apps/web/src/test/hooks/useCompras.test.tsx`
- [ ] `apps/web/src/hooks/useDeveres.ts` -> `apps/web/src/test/hooks/useDeveres.test.tsx`
- [ ] `apps/web/src/hooks/useGames.ts` -> `apps/web/src/test/hooks/useGames.test.tsx`
- [ ] `apps/web/src/hooks/useHabits.ts` -> `apps/web/src/test/hooks/useHabits.test.tsx`
- [ ] `apps/web/src/hooks/useMovies.ts` -> `apps/web/src/test/hooks/useMovies.test.tsx`
- [ ] `apps/web/src/hooks/useNutrition.ts` -> `apps/web/src/test/hooks/useNutrition.test.tsx`
- [ ] `apps/web/src/hooks/useProjetos.ts` -> `apps/web/src/test/hooks/useProjetos.test.tsx`
- [ ] `apps/web/src/hooks/useSaude.ts` -> `apps/web/src/test/hooks/useSaude.test.tsx`
- [ ] `apps/web/src/hooks/useTimeTheme.ts` -> `apps/web/src/test/hooks/useTimeTheme.test.tsx`
- [ ] `apps/web/src/hooks/useToday.ts` -> `apps/web/src/test/hooks/useToday.test.tsx`

### Components

- [ ] `apps/web/src/components/ErrorBoundary.tsx` -> `apps/web/src/test/components/ErrorBoundary.test.tsx`
- [ ] `apps/web/src/components/UpdateBanner.tsx` -> `apps/web/src/test/components/UpdateBanner.test.tsx`
- [ ] `apps/web/src/components/books/BookCard.tsx` -> `apps/web/src/test/components/books/BookCard.test.tsx`
- [ ] `apps/web/src/components/books/BookList.tsx` -> `apps/web/src/test/components/books/BookList.test.tsx`
- [ ] `apps/web/src/components/books/BookSearchModal.tsx` -> `apps/web/src/test/components/books/BookSearchModal.test.tsx`
- [ ] `apps/web/src/components/books/ReadingGoalBar.tsx` -> `apps/web/src/test/components/books/ReadingGoalBar.test.tsx`
- [ ] `apps/web/src/components/calendar/CalendarDayCell.tsx` -> `apps/web/src/test/components/calendar/CalendarDayCell.test.tsx`
- [ ] `apps/web/src/components/calendar/CalendarDayPanel.tsx` -> `apps/web/src/test/components/calendar/CalendarDayPanel.test.tsx`
- [ ] `apps/web/src/components/calendar/CalendarGrid.tsx` -> `apps/web/src/test/components/calendar/CalendarGrid.test.tsx`
- [ ] `apps/web/src/components/deveres/DeverCard.tsx` -> `apps/web/src/test/components/deveres/DeverCard.test.tsx`
- [ ] `apps/web/src/components/deveres/DeverList.tsx` -> `apps/web/src/test/components/deveres/DeverList.test.tsx`
- [x] `apps/web/src/components/habits/HabitCard.tsx` -> `apps/web/src/test/components/habits/HabitCard.test.tsx`
- [ ] `apps/web/src/components/habits/HabitList.tsx` -> `apps/web/src/test/components/habits/HabitList.test.tsx`
- [ ] `apps/web/src/components/habits/HabitProgressBar.tsx` -> `apps/web/src/test/components/habits/HabitProgressBar.test.tsx`
- [ ] `apps/web/src/components/hoje/DashboardCard.tsx` -> `apps/web/src/test/components/hoje/DashboardCard.test.tsx`
- [ ] `apps/web/src/components/hoje/HojeView.tsx` -> `apps/web/src/test/components/hoje/HojeView.test.tsx`
- [ ] `apps/web/src/components/movies/MovieCard.tsx` -> `apps/web/src/test/components/movies/MovieCard.test.tsx`
- [ ] `apps/web/src/components/movies/MovieSearch.tsx` -> `apps/web/src/test/components/movies/MovieSearch.test.tsx`
- [ ] `apps/web/src/components/movies/TmdbSettings.tsx` -> `apps/web/src/test/components/movies/TmdbSettings.test.tsx`
- [ ] `apps/web/src/components/projetos/EtapaCard.tsx` -> `apps/web/src/test/components/projetos/EtapaCard.test.tsx`
- [ ] `apps/web/src/components/projetos/EtapaList.tsx` -> `apps/web/src/test/components/projetos/EtapaList.test.tsx`
- [ ] `apps/web/src/components/projetos/ProjetoCard.tsx` -> `apps/web/src/test/components/projetos/ProjetoCard.test.tsx`
- [ ] `apps/web/src/components/projetos/ProjetoList.tsx` -> `apps/web/src/test/components/projetos/ProjetoList.test.tsx`
- [ ] `apps/web/src/components/projetos/ProjetoProgressBar.tsx` -> `apps/web/src/test/components/projetos/ProjetoProgressBar.test.tsx`

### Pages

- [ ] `apps/web/src/pages/BooksPage.tsx` -> `apps/web/src/test/pages/BooksPage.test.tsx`
- [ ] `apps/web/src/pages/CalendarPage.tsx` -> `apps/web/src/test/pages/CalendarPage.test.tsx`
- [ ] `apps/web/src/pages/ComprasPage.tsx` -> `apps/web/src/test/pages/ComprasPage.test.tsx`
- [ ] `apps/web/src/pages/DeveresPage.tsx` -> `apps/web/src/test/pages/DeveresPage.test.tsx`
- [ ] `apps/web/src/pages/FilmesPage.tsx` -> `apps/web/src/test/pages/FilmesPage.test.tsx`
- [ ] `apps/web/src/pages/FoodsPage.tsx` -> `apps/web/src/test/pages/FoodsPage.test.tsx`
- [ ] `apps/web/src/pages/GamesPage.tsx` -> `apps/web/src/test/pages/GamesPage.test.tsx`
- [x] `apps/web/src/pages/HabitsPage.tsx` -> `apps/web/src/test/pages/HabitsPage.test.tsx`
- [ ] `apps/web/src/pages/HojePage.tsx` -> `apps/web/src/test/pages/HojePage.test.tsx`
- [ ] `apps/web/src/pages/NutritionPage.tsx` -> `apps/web/src/test/pages/NutritionPage.test.tsx`
- [ ] `apps/web/src/pages/ProfilePage.tsx` -> `apps/web/src/test/pages/ProfilePage.test.tsx`
- [ ] `apps/web/src/pages/ProjetosPage.tsx` -> `apps/web/src/test/pages/ProjetosPage.test.tsx`
- [ ] `apps/web/src/pages/SaudePage.tsx` -> `apps/web/src/test/pages/SaudePage.test.tsx`

## Cross-Cutting Test Harness

- [ ] `tests/contracts/dataAdapterContractSuite.ts`
- [ ] `tests/contracts/dataAdapterFixtures.ts`
- [ ] `apps/web/src/test/setup/vitest.setup.ts`
- [ ] `apps/web/src/test/render/renderWithApp.tsx`
- [ ] `apps/web/src/test/fakes/createMockAdapter.ts`
- [ ] `apps/web/src/test/builders/`

## E2E Flows

- [ ] `tests/e2e/hoje-flow.e2e.ts`
- [ ] `tests/e2e/habit-flow.e2e.ts`
- [ ] `tests/e2e/dever-once-overdue.e2e.ts`
- [ ] `tests/e2e/dever-cyclic-occurrence.e2e.ts`
- [ ] `tests/e2e/archive-and-persistence.e2e.ts`

## Rust Server

- [x] `apps/server-rust/src/db.rs` -> co-located `#[cfg(test)]`
- [x] `apps/server-rust/src/main.rs` -> co-located `#[cfg(test)]`
- [x] `apps/server-rust/src/models.rs` -> co-located `#[cfg(test)]`
- [x] `apps/server-rust/src/routes/deveres.rs` -> co-located `#[cfg(test)]`
- [x] `apps/server-rust/src/routes/diary.rs` -> co-located `#[cfg(test)]`
- [x] `apps/server-rust/src/routes/foods.rs` -> co-located `#[cfg(test)]`
- [x] `apps/server-rust/src/routes/games.rs` -> co-located `#[cfg(test)]`
- [x] `apps/server-rust/src/routes/habits.rs` -> co-located `#[cfg(test)]`
- [x] `apps/server-rust/src/routes/mod.rs` -> co-located `#[cfg(test)]`
- [x] `apps/server-rust/src/routes/nutrition.rs` -> co-located `#[cfg(test)]`
- [x] `apps/server-rust/src/routes/projetos.rs` -> co-located `#[cfg(test)]`
- [x] `apps/server-rust/src/routes/today.rs` -> co-located `#[cfg(test)]`
