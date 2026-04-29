# Hoje View Assembly

## Comportamento

A view Hoje agrega em uma única tela todos os hábitos ativos com o status do dia, os deveres que devem ser feitos hoje (devidos ou atrasados) e, quando disponível, um resumo compacto de nutrição. O usuário pode interagir diretamente nessa view sem navegar para outras páginas.

## Acceptance Criteria

- [x] Dado a data de hoje, a view exibe todos os hábitos com `active: true` e o status de conclusão para hoje
- [x] Dado a data de hoje, a view exibe todos os `OnceDever` com `fim === hoje` e `active: true`
- [x] Dado a data de hoje, a view exibe todos os `OnceDever` com `fim < hoje`, não concluídos e `active: true` (overdue)
- [x] Dado um `OnceDever` sem `fim`, quando ele ainda não foi concluído, então a view Hoje o mantém visível usando a ocorrência ancorada em `inicio`
- [x] Dado a data de hoje, a view exibe todos os `CyclicDever` cuja recorrência dispara hoje e `active: true`
- [x] Deveres overdue aparecem antes dos devidos hoje na listagem
- [x] Dentro de cada grupo (overdue / hoje), deveres são ordenados: `high` → `medium` → `low`
- [x] Usuário pode marcar/desmarcar hábitos diretamente na view Hoje
- [x] Usuário pode marcar/desmarcar ocorrências de deveres diretamente na view Hoje
- [x] Dado que o snapshot inclui `nutritionSummary`, então a view Hoje exibe um card compacto de calorias, proteína, carbs e gordura com navegação para `Nutrição`
- [x] Quando não há hábitos, deveres nem resumo de nutrição para hoje, a view exibe mensagem de vazio
- [x] Enquanto os dados carregam, a view exibe indicador de loading
- [x] Quando o adapter retorna erro, a view exibe mensagem de erro

## Edge Cases

- Hábito arquivado: não aparece mesmo que tenha completions
- Dever `once` concluído com `fim` hoje: não aparece (já feito)
- Dever `once` overdue concluído: não aparece (já feito, independente de quando foi concluído)
- Dever `once` sem `fim`: aparece diariamente até ser concluído
- Dever `cyclic` marcado hoje: aparece como feito; amanhã aparece como não feito

## Fora do escopo

- Navegar para datas passadas ou futuras
- Agrupamento por área ou categoria na view Hoje
- Reordenar manualmente os itens
- Exibir blocos dedicados de `Saude` ou `Compras` na view Hoje
