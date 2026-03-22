# Hoje View Assembly

## Comportamento

A view Hoje agrega em uma única tela todos os hábitos ativos com o status do dia e todos os deveres que devem ser feitos hoje (devidos ou atrasados). O usuário pode interagir diretamente nessa view sem navegar para outras páginas.

## Acceptance Criteria

- [ ] Dado a data de hoje, a view exibe todos os hábitos com `active: true` e o status de conclusão para hoje
- [ ] Dado a data de hoje, a view exibe todos os `OnceDever` com `deadline === hoje` e `active: true`
- [ ] Dado a data de hoje, a view exibe todos os `OnceDever` com `deadline < hoje`, não concluídos e `active: true` (overdue)
- [ ] Dado a data de hoje, a view exibe todos os `CyclicDever` cuja recorrência dispara hoje e `active: true`
- [ ] Deveres overdue aparecem antes dos devidos hoje na listagem
- [ ] Dentro de cada grupo (overdue / hoje), deveres são ordenados: `high` → `medium` → `low`
- [ ] Usuário pode marcar/desmarcar hábitos diretamente na view Hoje
- [ ] Usuário pode marcar/desmarcar ocorrências de deveres diretamente na view Hoje
- [ ] Quando não há nada para hoje, a view exibe mensagem de vazio
- [ ] Enquanto os dados carregam, a view exibe indicador de loading
- [ ] Quando o adapter retorna erro, a view exibe mensagem de erro

## Edge Cases

- Hábito arquivado: não aparece mesmo que tenha completions
- Dever `once` concluído com deadline hoje: não aparece (já feito)
- Dever `once` overdue concluído: não aparece (já feito, independente de quando foi concluído)
- Dever `cyclic` marcado hoje: aparece como feito; amanhã aparece como não feito

## Fora do escopo

- Navegar para datas passadas ou futuras
- Agrupamento por área ou categoria na view Hoje
- Reordenar manualmente os itens
