# Dever Cycle Resolution

## Comportamento

Para deveres cíclicos, o sistema calcula se uma ocorrência deve aparecer em uma data específica com base na configuração de recorrência. Essa lógica é executada pelo adapter em `getTodaySnapshot`, não pela UI.

## Acceptance Criteria

- [x] Dado um `CyclicDever` com `type: 'daily'`, então `isOccurrenceOn` retorna `true` para qualquer data
- [x] Dado um `CyclicDever` com `type: 'weekly', weekdays: ['monday']`, então aparece apenas nas segundas-feiras
- [x] Dado um `CyclicDever` com `type: 'weekly', weekdays: ['monday', 'wednesday']`, então aparece nas segundas e quartas
- [x] Dado um `CyclicDever` com `type: 'monthly', monthDay: 10`, então aparece todo dia 10 do mês
- [x] Dado um `CyclicDever` com `type: 'monthly', monthDay: 31` e o mês é fevereiro (28 dias), então NÃO aparece nesse mês
- [ ] Dado um `CyclicDever` marcado como feito numa ocorrência, quando a próxima ocorrência chega, ele aparece novamente como não feito

## Edge Cases

- `monthDay: 31` em meses com 30 dias (abril, junho, setembro, novembro): skip silencioso, sem erro
- `monthDay: 29, 30, 31` em fevereiro de anos não-bissextos: skip silencioso
- `monthDay: 29` em fevereiro de ano bissexto: aparece normalmente
- Recorrência mensal com `monthDayEnd`: a janela ativa e o overdue são resolvidos na montagem da view Hoje, não por `isOccurrenceOn`
- Dever cíclico arquivado: não aparece em nenhuma ocorrência futura

## Fora do escopo

- Recorrência com intervalo (ex: a cada 2 semanas)
- Recorrência com regras avançadas além da data de início/fim já suportada no modelo
