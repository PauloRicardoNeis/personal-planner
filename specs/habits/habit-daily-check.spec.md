# Habit Daily Check-off

## Comportamento

O usuario pode registrar e remover ocorrencias de um habito para um dia especifico. O contador de ocorrencias e independente por dia: registrar hoje nao afeta ontem ou amanha. O estado persiste apos reload.

## Acceptance Criteria

- [x] Dado um habito ativo, quando o usuario registra a primeira ocorrencia para hoje, entao `habit.completions[today]` passa a ser `1`
- [x] Dado um habito com ocorrencias registradas hoje, quando o usuario remove a ultima ocorrencia do dia, entao `habit.completions[today]` e removido
- [x] Dado um habito com ocorrencias registradas hoje, quando a pagina e recarregada, entao o contador do dia continua preservado
- [x] Dado um habito com ocorrencias registradas ontem, quando hoje abre a view Hoje, entao o habito aparece como nao feito para o novo dia
- [x] Dado um habito arquivado, ele nao aparece na view Hoje mesmo que tenha historico passado

## Edge Cases

- Registrar novas ocorrencias no mesmo dia: incrementa o contador daquele dia sem afetar outros dias
- Desmarcar um habito sem ocorrencias registradas no dia: no-op, sem erro
- Habito com `active: false`: nao aparece, e o check-off nao deve ser possivel via UI

## Fora do escopo

- Marcar habito para datas passadas ou futuras
- Streaks e metricas de consistencia detalhadas (cobertas em `habit-streaks.spec.md`)
