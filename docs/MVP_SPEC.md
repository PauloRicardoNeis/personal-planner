# MVP Spec

Acceptance criteria do MVP. Cada item e verificavel manualmente ou via teste.

## Alvo De Produto

O MVP de produto e o desktop Tauri com sidecar `planner-server` e SQLite. O frontend web em Vite e o `LocalStorageAdapter` sao auxiliares de desenvolvimento/teste e nao definem a versao final do app.

---

## Feature: Habitos

### Criar Habito

- Usuario fornece titulo obrigatorio e categoria opcional.
- Habito criado aparece imediatamente na lista de habitos ativos.
- Habito criado com `active: true`, `completions: {}`, `timesPerDay` normalizado e `valueWeights` normalizado.

### Listar Habitos

- Apenas habitos com `active: true` aparecem na lista.
- Lista exibe titulo, categoria se houver, contagem do dia, meta e pontos.

### Check-off Diario

- Usuario pode registrar uma ou mais ocorrencias de um habito para o dia atual.
- Marcacao persiste apos reiniciar o desktop.
- Usuario pode remover uma ocorrencia do dia atual.

### Arquivar Habito

- Usuario pode arquivar um habito (`active: false`).
- Habito arquivado nao aparece na lista de habitos ativos.
- Habito arquivado nao aparece na view Hoje.

---

## Feature: Deveres

### Criar Dever `once`

- Usuario fornece titulo obrigatorio, janela de inicio/fim quando aplicavel, area opcional e prioridade.
- Dever criado aparece na lista de deveres ativos.

### Criar Dever `cyclic`

- Usuario fornece titulo obrigatorio, tipo de recorrencia (`daily`, `weekly` ou `monthly`), area opcional e prioridade.
- Para `weekly`, usuario seleciona ao menos um dia da semana.
- Para `monthly`, usuario informa o dia do mes.
- Dever criado aparece na lista de deveres ativos.

### Listar Deveres

- Apenas deveres com `active: true` aparecem na lista.
- Lista exibe titulo, tipo, prioridade e area se houver.

### Marcar Ocorrencia Como Feita

- Usuario pode marcar uma ocorrencia especifica de um dever como feita.
- A completion e armazenada com `occurrenceDate` e `completedAt`.
- Marcacao persiste apos reiniciar o desktop.
- Usuario pode desmarcar uma ocorrencia.

### Arquivar Dever

- Usuario pode arquivar um dever (`active: false`).
- Dever arquivado nao aparece na lista ativa nem na view Hoje.

---

## Feature: Hoje

### Montagem Da View

- Exibe todos os habitos ativos com o status do dia atual.
- Exibe todos os deveres devidos hoje e overdue.

### Habitos Na View Hoje

- Cada habito exibe titulo e progresso do dia.
- Usuario pode registrar ocorrencias diretamente na view Hoje.

### Deveres Na View Hoje

- Dever `once` devido hoje aparece com `isOverdue: false`.
- Dever `once` overdue aparece com `isOverdue: true` ate ser concluido ou arquivado.
- Dever `cyclic daily` aparece todo dia dentro da janela ativa.
- Dever `cyclic weekly` aparece apenas nos dias da semana configurados.
- Dever `cyclic monthly` aparece no dia ou janela do mes configurado.

### Ordenacao

- Deveres overdue aparecem antes dos devidos hoje.
- Dentro de cada grupo: `high` -> `medium` -> `low`.

### Estados De UI Obrigatorios

- Loading exibido enquanto o adapter busca os dados.
- Estado vazio quando nao ha nada para o dia.
- Erro quando o adapter retorna `{ ok: false }`.

---

## Armazenamento

- No produto final, todo estado persistente passa pelo desktop Tauri, `RestApiAdapter`, sidecar Rust `planner-server` e SQLite.
- Apos reiniciar o desktop, o estado completo e restaurado do SQLite.
- `localStorage` e `LocalStorageAdapter` existem apenas para desenvolvimento/teste de frontend no browser.
- Dados invalidos em adapters auxiliares devem resultar em fallback seguro, sem crash.

---

## Fora Do Escopo Do MVP

- Editar tipo ou recorrencia de um dever sem arquivar + recriar.
- Progresso em deveres por percentual/etapas.
- Filtros e ordenacao customizada.
- Busca.
- Servidor remoto multiusuario.
