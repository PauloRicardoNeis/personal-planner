# AGENTS.md

Leia este arquivo antes de fazer qualquer mudanca no projeto.

## O que e esse projeto

`planner-app` e um app desktop de planejamento pessoal single-user. A UI e React/Vite, mas a versao correta do produto e o desktop empacotado com sidecar `planner-server` e SQLite. Ele rastreia:

- **Habitos** - comportamentos diarios repetidos infinitamente (ex: Anki, exercicio)
- **Deveres** - tarefas a fazer, podendo ser unicas (`once`) ou ciclicas (`cyclic`)
- **Hoje** - view unificada com habitos do dia + deveres devidos/atrasados

O app final nao roda sobre `localStorage`: o desktop usa `RestApiAdapter` falando com o sidecar Rust (`planner-server`) e persiste em SQLite. `localStorage` existe apenas como harness de desenvolvimento/teste do frontend no navegador.

## Fonte de verdade do produto

- **App final/canonico:** desktop Tauri + sidecar `planner-server` + SQLite.
- **Browser/Vite com `localStorage`:** somente para desenvolvimento rapido, testes de UI e isolamento de frontend.
- **Nao entregue comportamento como pronto se ele so foi validado no `LocalStorageAdapter`.** Para feature ou bugfix de produto, valide tambem o caminho desktop/server (`RestApiAdapter` + Rust).

## Mapa de diretorios

| Caminho | Proposito |
|---|---|
| `packages/core/` | Types, schemas Zod, contrato `DataAdapter`, funcoes puras |
| `packages/core/src/contracts/DataAdapter.ts` | **O CONTRATO** - leia antes de tocar em qualquer data flow |
| `packages/core/src/models/` | Interfaces `Habit`, `OnceDever`, `CyclicDever` e schemas Zod |
| `packages/core/src/domain/recurrence.ts` | `isOccurrenceOn()` - logica pura de agendamento, com testes |
| `apps/web/src/adapter.ts` | **UNICO ponto** onde o adapter concreto e instanciado |
| `apps/web/src/adapters/` | `LocalStorageAdapter` (harness dev/teste) e `RestApiAdapter` (produto desktop) |
| `apps/web/src/hooks/` | Hooks React que consomem o adapter |
| `apps/web/src/pages/` | `HojePage`, `HabitsPage`, `DeveresPage` |
| `apps/web/src/test/` | Setup, fakes, builders e testes de integracao React do frontend |
| `docs/` | Arquitetura, data model, MVP spec, roadmap, decisoes |
| `docs/TESTING.md` | Arquitetura de testes, naming e policy de coverage |
| `docs/TEST_FILE_CHECKLIST.md` | Checklist dos arquivos existentes e dos testes esperados |
| `specs/` | Specs de feature no formato Dado/Quando/Entao |
| `tests/contracts/` | Suite compartilhada de contrato e fixtures cross-package |
| `tests/e2e/` | Fluxos ponta a ponta e regressao de jornada |

## Antes de tocar nos modelos de dados

Leia `docs/DATA_MODEL.md`. Os schemas Zod sao co-localizados com as interfaces TypeScript no mesmo arquivo. Ao adicionar um campo a uma interface, atualize o schema Zod correspondente no mesmo arquivo.

## Antes de tocar no data access

Leia `packages/core/src/contracts/DataAdapter.ts`. Todo acesso a dados no frontend passa por essa interface. Nunca importe `LocalStorageAdapter` ou `RestApiAdapter` fora de `apps/web/src/adapter.ts`.

## Antes de tocar nos testes ou no coverage

Leia `docs/TESTING.md`. Ele define onde cada tipo de teste mora, convencoes de naming, doubles permitidos e a policy de 100% de coverage por arquivo.

Use `docs/TEST_FILE_CHECKLIST.md` para escolher o proximo arquivo sem teste e marcar progresso conforme os testes forem criados.

## Antes de criar uma feature nova

Verifique `specs/` para um spec file existente. Se nao existir, crie um usando o formato definido em `specs/README.md` antes de escrever codigo.

## Regras de arquitetura

- `packages/core` tem **zero** dependencias de browser APIs, `localStorage`, `fetch` ou React
- `packages/core` contem apenas modelos, schemas, contratos e funcoes puras
- `apps/web` importa de `packages/core` mas nunca de `apps/server`
- A UI depende apenas de `DataAdapter` - nunca de classes concretas de adapter
- O desktop deve usar `VITE_BACKEND_MODE=rest`; `VITE_BACKEND_MODE=local` e permitido apenas para dev/teste no browser
- Todos os valores de data em modelos sao strings `YYYY-MM-DD` (`ISODate`) ou ISO completo (`ISODateTime`)
- IDs sao `crypto.randomUUID()` - branded types evitam mistura de IDs de entidades distintas
- Todos os metodos do adapter retornam `Promise<Result<T>>` - nunca lancam excecao alem da fronteira do adapter
- `updateDever` nao pode alterar `type` ou `recurrence` - para mudar, arquivar e recriar

## Regras de testes

- Meta obrigatoria: 100% de coverage de `lines`, `statements`, `functions` e `branches`, com threshold por arquivo
- Todo arquivo de producao novo ou alterado deve sair no mesmo change com testes cobrindo o comportamento alterado
- Todo bugfix deve comecar por um teste de regressao que falha antes da correcao
- Testes unitarios de funcoes puras, schemas Zod e helpers sem React ficam co-localizados ao lado do arquivo como `*.test.ts` ou `*.test.tsx`
- Hooks, pages e componentes React que precisem renderizacao, router, provider ou doubles do adapter ficam em `apps/web/src/test/{hooks,pages,components}/`
- Cada implementacao de adapter deve ter um arquivo `*.contract.test.ts` ao lado da implementacao; a suite compartilhada do contrato fica em `tests/contracts/`
- Fluxos ponta a ponta ficam em `tests/e2e/*.e2e.ts`
- Fixtures, builders e fakes compartilhados nao devem ficar misturados com codigo de runtime sem necessidade; use `tests/` ou `apps/web/src/test/`
- Nao criar novas pastas `__tests__` quando houver uma localizacao definida em `docs/TESTING.md`
- Nao usar snapshots cegos como substituto de assertions semanticas
- Mockar rede, tempo, UUID, `localStorage` e ambiente apenas nas fronteiras; manter `packages/core` com o minimo de mocking possivel

## Comandos comuns

```bash
# Instalar todas as dependencias do workspace
pnpm install

# Frontend dev server (porta 5173)
pnpm --filter web dev

# Servidor Rust usado pelo desktop
pnpm dev:server

# Installer desktop canonico (produto final)
pnpm build:desktop

# Typecheck em todos os pacotes
pnpm -r typecheck

# Rodar todos os testes
pnpm -r test

# Build do frontend
pnpm --filter web build

# Typecheck so do core
pnpm --filter core typecheck

# Testes so do core
pnpm --filter core test
```

## Workflow de spec-driven development

Para qualquer mudanca nao-trivial:

1. Verifique `specs/` para um spec existente
2. Se nao existir, crie um spec (formato em `specs/README.md`)
3. Implemente contra os acceptance criteria do spec
4. Marque os criterios como concluidos no spec ao terminar

Mudancas triviais (copy, ajustes de estilo, renomeacoes simples): spec opcional.

## Entrega de installer

- Ao concluir qualquer feature ou bugfix, gere o installer desktop correspondente e avise o usuario que o artefato foi atualizado.
- Use `pnpm build:desktop` como padrao. O desktop sempre embute o sidecar `planner-server` e usa SQLite; nao entregue variante baseada em `localStorage` sem uma migracao explicita.
- Testes em `localStorage` nao substituem validacao do server para comportamento de produto.

## O que esta no MVP

- Habitos: criar, listar, check-off diario, desmarcar, arquivar
- Deveres: criar (`once` e `cyclic`), listar, marcar ocorrencia como feita, desmarcar, arquivar
- Hoje view: habitos ativos + deveres devidos/overdue do dia

## O que NAO esta no MVP

- Servidor remoto (Phase 2)
- Autenticacao
- Sync entre dispositivos
- Progress tracking (%, etapas)
- Streaks de habitos
- Revisao semanal
- Rastreamento de nutricao
- Export CSV

Se voce encontrar referencias a esses topicos, sao features de Phase 2+.
