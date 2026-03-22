# MVP Spec

Acceptance criteria do MVP. Cada item é verificável manualmente ou via teste.

---

## Feature: Hábitos

### Criar hábito
- Usuário fornece título (obrigatório) e categoria (opcional)
- Hábito criado aparece imediatamente na lista de hábitos ativos
- Hábito criado com `active: true` e `completions: {}`

### Listar hábitos
- Apenas hábitos com `active: true` aparecem na lista
- Lista exibe título e categoria (se houver)

### Check-off diário
- Usuário pode marcar um hábito como feito para o dia atual
- Marcação persiste após reload da página
- Usuário pode desmarcar um hábito marcado para o dia atual

### Arquivar hábito
- Usuário pode arquivar um hábito (`active: false`)
- Hábito arquivado não aparece na lista de hábitos ativos
- Hábito arquivado não aparece na view Hoje

---

## Feature: Deveres

### Criar dever `once`
- Usuário fornece: título (obrigatório), deadline (obrigatório), área (opcional), prioridade
- Dever criado aparece na lista de deveres ativos

### Criar dever `cyclic`
- Usuário fornece: título (obrigatório), tipo de recorrência (daily/weekly/monthly), área (opcional), prioridade
- Para `weekly`: usuário seleciona ao menos um dia da semana
- Para `monthly`: usuário informa o dia do mês (1–31)
- Dever criado aparece na lista de deveres ativos

### Listar deveres
- Apenas deveres com `active: true` aparecem na lista
- Lista exibe título, tipo, prioridade e área (se houver)

### Marcar ocorrência como feita
- Usuário pode marcar uma ocorrência específica de um dever como feita
- A completion é armazenada com `occurrenceDate` e `completedAt`
- Marcar como feito persiste após reload
- Usuário pode desmarcar uma ocorrência

### Dever `once` concluído
- Dever `once` com todas as ocorrências concluídas não aparece mais na view Hoje
- Dever `once` concluído continua na lista de deveres (apenas `active: false` o remove)

### Arquivar dever
- Usuário pode arquivar um dever (`active: false`)
- Dever arquivado não aparece na lista ativa nem na view Hoje

---

## Feature: Hoje

### Montagem da view
- Exibe todos os hábitos ativos com o status do dia atual
- Exibe todos os deveres devidos hoje (via recorrência calculada) e overdue

### Hábitos na view Hoje
- Cada hábito exibe o título e se está feito hoje
- Usuário pode fazer check-off diretamente na view Hoje

### Deveres na view Hoje

**Dever `once` today:** `deadline === hoje` → aparece com `isOverdue: false`
**Dever `once` overdue:** `deadline < hoje` e não concluído → aparece com `isOverdue: true`
**Dever `cyclic` daily:** aparece todo dia
**Dever `cyclic` weekly:** aparece apenas nos dias da semana configurados
**Dever `cyclic` monthly:** aparece no dia do mês configurado; se o mês não tem esse dia, não aparece

### Ordenação
- Deveres overdue aparecem antes dos devidos hoje
- Dentro de cada grupo: `high` → `medium` → `low`

### Estados de UI obrigatórios
- **Loading:** exibido enquanto o adapter busca os dados
- **Vazio:** mensagem quando não há nada para o dia
- **Erro:** mensagem quando o adapter retorna `{ ok: false }`

---

## Armazenamento

- Todo estado persiste em `localStorage` nas chaves `planner_habits` e `planner_deveres`
- Após reload, o estado completo é restaurado
- Dados inválidos no localStorage resultam em fallback para array vazio, sem crash

---

## Fora do escopo do MVP

- Editar tipo ou recorrência de um dever (arquivar + recriar)
- Progresso em deveres (%, etapas)
- Streaks de hábitos
- Filtros e ordenação customizada
- Busca
- Servidor remoto
