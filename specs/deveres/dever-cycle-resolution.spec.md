# Dever Cycle Resolution

## Comportamento

Para deveres cíclicos, o sistema calcula se uma ocorrência deve aparecer em uma data específica com base na configuração de recorrência. Essa lógica é executada pelo adapter em `getTodaySnapshot`, não pela UI.

## Acceptance Criteria

- [ ] Dado um `CyclicDever` com `type: 'daily'`, então `isOccurrenceOn` retorna `true` para qualquer data
- [ ] Dado um `CyclicDever` com `type: 'weekly', weekdays: ['monday']`, então aparece apenas nas segundas-feiras
- [ ] Dado um `CyclicDever` com `type: 'weekly', weekdays: ['monday', 'wednesday']`, então aparece nas segundas e quartas
- [ ] Dado um `CyclicDever` com `type: 'monthly', monthDay: 10`, então aparece todo dia 10 do mês
- [ ] Dado um `CyclicDever` com `type: 'monthly', monthDay: 31` e o mês é fevereiro (28 dias), então NÃO aparece nesse mês
- [ ] Dado um `CyclicDever` marcado como feito numa ocorrência, quando a próxima ocorrência chega, ele aparece novamente como não feito

## Edge Cases

- `monthDay: 31` em meses com 30 dias (abril, junho, setembro, novembro): skip silencioso, sem erro
- `monthDay: 29, 30, 31` em fevereiro de anos não-bissextos: skip silencioso
- `monthDay: 29` em fevereiro de ano bissexto: aparece normalmente
- Dever cíclico arquivado: não aparece em nenhuma ocorrência futura

## Fora do escopo

- Recorrência com intervalo (ex: a cada 2 semanas) — Phase 3
- Recorrência com data de início ou fim — Phase 3
