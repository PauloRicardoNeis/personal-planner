# Aba de compras com listas, links e preco

## Comportamento

O sistema oferece uma aba `Compras` para manter listas de compra com itens checkáveis e metadados por item, como quantidade, link, loja preferida e preço. A lista pode servir tanto para uma compra pontual quanto para reposições recorrentes planejadas manualmente ou a partir da última compra concluída.

As listas e seus itens persistem no armazenamento do app. Quando uma lista tem uma data planejada ou lembrete vencido, o sistema pode projetá-la para a visão `Hoje` como ação pendente, sem reduzi-la a um único `Dever`.

## Acceptance Criteria

- [x] Dado que o usuário abre a aba `Compras`, quando a página carrega, então ele vê as listas ativas e um fluxo para criar uma nova lista.
- [x] Dado que o usuário cria uma lista de compras, quando salva, então a lista fica persistida com título, observações, itens e configuração opcional de lembrete.
- [x] Dado que o usuário adiciona um item a uma lista, quando salva, então o item pode armazenar título, quantidade, unidade, link, loja preferida, último preço, preço-alvo e observações.
- [x] Dado que existem itens em uma lista, quando o usuário marca ou desmarca um item, então o estado do item é persistido individualmente após recarregar a aplicação.
- [x] Dado que a lista tem `plannedFor`, quando a data chega ou fica atrasada, então a lista pode aparecer em `Hoje` como compra pendente.
- [x] Dado que a lista usa lembrete `manual_next_date`, quando o usuário define uma próxima data manual, então essa data passa a dirigir a próxima aparição da lista em `Hoje`.
- [x] Dado que a lista usa lembrete `after_completion_interval`, quando o usuário conclui a compra, então a próxima data é recalculada a partir da conclusão mais recente.
- [x] Dado que o usuário informa preço de um item, quando salva, então o valor fica associado ao item e continua disponível em sessões futuras.

## Edge Cases

- Item com link mas sem preço: o item continua válido e utilizável na lista.
- Item com preço-alvo menor que o último preço: o sistema trata isso como informação, sem bloquear o salvamento.
- Lista sem lembrete nem data planejada: a lista continua disponível em `Compras`, mas não aparece em `Hoje`.
- Lista concluída e depois reaberta: os itens podem ser reutilizados sem perder metadados como link e preço.

## Fora do escopo

- Integração automática com lojas, scraping de preços ou carrinho online.
- Comparação de preço entre mercados em tempo real.
- Compartilhamento de listas com outras pessoas.
- Controle de estoque doméstico detalhado.
