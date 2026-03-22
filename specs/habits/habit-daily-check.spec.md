# Habit Daily Check-off

## Comportamento

O usuário pode marcar e desmarcar um hábito como feito para um dia específico. O estado de conclusão é independente por dia — marcar hoje não afeta ontem ou amanhã. O estado persiste após reload.

## Acceptance Criteria

- [ ] Dado um hábito ativo, quando o usuário o marca como feito para hoje, então `habit.completions[today]` é `true`
- [ ] Dado um hábito marcado como feito hoje, quando o usuário o desmarca, então `habit.completions[today]` é removido
- [ ] Dado um hábito marcado hoje, quando a página é recarregada, então o hábito ainda aparece como feito
- [ ] Dado um hábito marcado ontem, quando hoje abre a view Hoje, então o hábito aparece como não feito (novo dia)
- [ ] Dado um hábito arquivado, ele não aparece na view Hoje mesmo que tenha completions passadas

## Edge Cases

- Marcar um hábito já marcado no mesmo dia: idempotente, não duplica nem gera erro
- Desmarcar um hábito não marcado: idempotente, sem erro
- Hábito com `active: false`: não aparece, check-off não deve ser possível via UI

## Fora do escopo

- Marcar hábito para datas passadas ou futuras
- Streaks e métricas de consistência (Phase 3)
