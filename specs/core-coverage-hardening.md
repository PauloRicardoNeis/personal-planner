# Core Coverage Hardening

## Comportamento

O pacote `packages/core` deve ter testes semanticos suficientes para que cada arquivo de producao fique coberto em `lines`, `statements`, `functions` e `branches`. Os testes validam contratos publicos, schemas Zod e funcoes puras, sem depender de browser APIs, React, rede real ou `localStorage`.

Baseline do snapshot de coverage em 2026-04-29:

- `All files`: 60.65% statements, 86% branches, 72.85% functions, 60.65% lines.
- Maiores gaps: modelos Zod sem testes, `domain/openLibrary.ts`, `domain/saude.ts`, `domain/recurrence.ts`, `domain/compras.ts`, `src/index.ts` e contrato `DataAdapter`.
- Comando de verificacao: `pnpm --filter core test:coverage`.

## Prioridade de execucao

1. Cobrir os arquivos com 0% de coverage e APIs publicas do pacote: `src/index.ts`, `models/book.ts`, `models/compra.ts`, `models/dever.ts`, `models/game.ts`, `models/movie.ts`, `models/nutrition.ts`, `models/projeto.ts`, `models/saude.ts` e `domain/openLibrary.ts`.
2. Fechar branches de funcoes puras ja testadas parcialmente: `domain/recurrence.ts`, `domain/saude.ts`, `domain/compras.ts`, `domain/habits.ts`, `domain/steam.ts` e `domain/projeto.ts`.
3. Cobrir schemas e helpers compartilhados em `models/shared.ts`, incluindo formatos invalidos e recorrencias discriminadas.
4. Atualizar `docs/TEST_FILE_CHECKLIST.md` conforme cada arquivo de teste for criado no local esperado.
5. So marcar este spec como concluido quando `pnpm --filter core test:coverage` reportar 100% por arquivo no pacote `core`.

## Acceptance Criteria

- [x] Dado o arquivo `packages/core/src/domain/openLibrary.ts`, quando receber uma resposta vazia, sem `docs`, com `docs` invalido ou com documentos sem `key`/`title`, entao `parseOpenLibraryResponse()` retorna uma lista vazia ou filtra apenas documentos validos.
- [x] Dado uma resposta valida da Open Library, quando houver autor, capa e numero medio de paginas, entao o parser retorna `author`, `coverUrl`, `openLibraryKey` e `totalPages` corretamente; quando autor ou paginas faltarem, entao usa `Desconhecido` e omite campos opcionais invalidos.
- [x] Dado `packages/core/src/domain/recurrence.ts`, quando testar recorrencia diaria, semanal e mensal, entao a suite cobre ocorrencias positivas e negativas, semanas sem match, dias inexistentes no mes e janelas mensais com `monthDayEnd`.
- [x] Dado uma janela mensal em `getMonthlyWindowInfo()`, quando a data estiver antes, dentro e depois da janela, entao o retorno diferencia `active`, `overdue` e `null`, incluindo o ciclo vencido do mes anterior e meses sem o dia inicial.
- [x] Dado `packages/core/src/domain/saude.ts`, quando um item tiver agenda `once`, `manual_next_date`, `after_completion_interval` ou `calendar_rule`, entao `getSaudeDueInfo()` retorna `null`, due ou overdue conforme a data atual, `lastCompletedAt` e a regra configurada.
- [x] Dado agendas de saude por intervalo em dias, semanas e meses, quando a soma cruza fim de mes ou ano, entao a data calculada e normalizada como `YYYY-MM-DD` e meses curtos fazem clamp para o ultimo dia valido.
- [x] Dado `packages/core/src/domain/compras.ts`, quando `plannedFor` e `reminder` gerarem datas candidatas, entao `getListaCompraDueInfo()` escolhe a menor data devida, ignora datas futuras e ignora datas ja cobertas por `lastCompletedAt`.
- [x] Dado lembretes de compra `none`, `manual_next_date` e `after_completion_interval`, quando testar dias, semanas, meses e ausencia de ancora, entao a suite cobre todos os retornos de due, overdue e `null`.
- [x] Dado os schemas em `packages/core/src/models/*.ts`, quando receber objetos validos completos e minimos, entao cada schema aceita o payload esperado e preserva defaults/optionals definidos pelo modelo.
- [x] Dado os schemas em `packages/core/src/models/*.ts`, quando receber discriminantes invalidos, datas invalidas, enums fora da lista, numeros fora de range ou campos obrigatorios ausentes, entao cada schema rejeita o payload com `safeParse().success === false`.
- [x] Dado `packages/core/src/models/shared.ts`, quando testar `ISODateSchema`, `ISODateTimeSchema`, `WeekdayNameSchema`, `RecurrenceConfigSchema`, `toISODate()`, `todayISODate()` e `nowISODateTime()`, entao formatos validos sao aceitos, formatos invalidos sao rejeitados e os helpers retornam strings ISO no formato esperado.
- [x] Dado `packages/core/src/index.ts`, quando importar a entrada publica `@planner/core`, entao os tipos, schemas, constantes e funcoes publicas usadas pelos apps estao exportados e apontam para as mesmas referencias dos modulos de origem.
- [ ] Dado `packages/core/src/contracts/DataAdapter.ts`, quando validar coverage do contrato, entao a solucao usa testes de contrato em `tests/contracts/` e arquivos `*.contract.test.ts` por adapter, sem testar tipos TypeScript em runtime de forma artificial.
- [ ] Dado arquivos ja parcialmente testados como `domain/habits.ts`, `domain/steam.ts` e `domain/projeto.ts`, quando fechar branches restantes, entao os novos testes cobrem os edge cases indicados no relatorio sem alterar comportamento de producao.
- [ ] Dado todos os testes novos, quando executar `pnpm --filter core test:coverage`, entao o pacote `core` reporta 100% em `lines`, `statements`, `functions` e `branches` por arquivo.

## Edge Cases

- Modelos com unions discriminadas: testar ao menos um caso valido e um discriminante invalido por variante.
- Campos opcionais: testar ausencia do campo e valor invalido quando o campo existe.
- Datas: manter todos os valores de modelos como `YYYY-MM-DD` ou ISO datetime completo; nao aceitar objetos `Date` em schemas.
- Funcoes puras de dominio: testar comportamento por entrada e saida, sem mockar implementacao interna.
- Coverage de arquivos type-only: preferir cobrir efeitos observaveis por exports e suites de contrato; nao adicionar codigo dummy apenas para inflar metricas.
- Fixtures: criar builders pequenos e locais quando reduzirem repeticao, mantendo-os fora do runtime de producao.

## Fora do escopo

- Aumentar coverage de `apps/web` neste spec.
- Criar novas features ou alterar regras de negocio apenas para facilitar testes.
- Adicionar snapshots cegos como substituto de assertions semanticas.
- Configurar CI, trocar runner de testes ou mudar thresholds globais.
- Gerar installer desktop; este spec cobre planejamento de testes, nao uma feature ou bugfix entregue.
