# Dever `once` com Início Agendado

## Comportamento

Quando um dever `once` é criado sem `fim`, mas com um `inicio` agendado no futuro, o sistema usa esse `inicio` como referência da ocorrência única. A lista de deveres deve exibir a data e hora agendadas, o calendário deve marcar o dia correto, e a conclusão do dever deve continuar associada a essa ocorrência em vez de variar por dia.

## Acceptance Criteria

- [x] Dado um dever `once` sem `fim` e com `inicio = 2026-04-28T09:40`, quando o calendário do mês de abril de 2026 é exibido, então o dever aparece no dia `2026-04-28`
- [x] Dado um dever `once` sem `fim` e com `inicio` explícito, quando a lista de deveres é exibida, então a UI mostra a data e a hora agendadas desse dever
- [x] Dado um dever `once` sem `fim`, quando ele é marcado como concluído, então a conclusão fica ancorada na data da ocorrência única e o dever não volta a reaparecer como um novo “hoje”
- [x] Dado um dever `once` legado com campo `deadline`, quando ele é lido pelo adapter, então `deadline` continua sendo migrado para `fim` sem inventar um novo prazo para deveres que realmente não têm `fim`

## Edge Cases

- Dever `once` sem `fim` e sem `inicio` explícito: não cria um ponto artificial no calendário, mas continua aparecendo na lista como “sem prazo”
- Dever `once` com `fim` e `inicio` explícito: o calendário usa `fim` como dia do evento e a lista pode exibir também o `inicio`

## Fora do escopo

- Ordenação por hora dentro do dia no calendário
- Edição de dever existente para trocar `inicio` ou `fim`
