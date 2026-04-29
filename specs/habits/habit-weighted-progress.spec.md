# Habitos com metas ponderadas

## Comportamento

Cada habito pode definir quantas vezes deve ser feito por dia e quanto vale cada ocorrencia. O app soma a pontuacao conquistada no dia para calcular o progresso do proprio habito e tambem uma barra geral de habitos. Quando a pontuacao ultrapassa a meta do dia, o excedente continua sendo contabilizado como overcharge visual.

## Acceptance Criteria

- [x] Dado a criacao de um novo habito sem configuracoes avancadas, quando ele e salvo, entao o app persiste `timesPerDay = 1` e `valueWeights = [1]`
- [x] Dado um habito com `timesPerDay = 3` e `valueWeights = [5, 2, 1]`, quando o usuario registra duas ocorrencias no mesmo dia, entao `habit.completions[today]` passa a ser `2`, a pontuacao do dia vira `7` e o habito ainda nao e considerado concluido
- [x] Dado esse mesmo habito, quando o usuario registra a terceira ocorrencia do dia, entao o habito atinge a meta diaria e passa a ser exibido com `100%` de progresso
- [x] Dado esse mesmo habito, quando o usuario registra uma quarta ocorrencia no dia, entao a pontuacao excedente continua sendo somada usando o ultimo peso configurado e a UI expoe esse excedente como overcharge separado da barra base
- [x] Dado habitos ativos com pontuacoes no dia, quando a tela de Habitos ou Hoje calcula o resumo diario, entao a barra geral usa a soma de pontos conquistados versus a soma das metas ponderadas e informa quantos habitos bateram a meta
- [x] Dado um habito existente, quando o usuario altera `timesPerDay` ou os `valueWeights`, entao as novas configuracoes sao salvas sem apagar o historico de contagens ja registrado

## Edge Cases

- `valueWeights` com menos entradas do que `timesPerDay`: o app completa automaticamente os pesos faltantes repetindo o ultimo peso informado ou `1` quando nenhum peso foi informado
- `valueWeights` com mais entradas do que `timesPerDay`: o app descarta os pesos excedentes ao salvar
- Remover ocorrencias de um dia com overcharge: a pontuacao volta a diminuir uma ocorrencia por vez, recalculando o excedente corretamente

## Fora do escopo

- Pontuacao compartilhada com deveres, projetos ou nutricao
- Metas semanais, streaks ponderadas ou ranking historico por pontuacao
