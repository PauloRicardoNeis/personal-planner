# Edição de deveres

## Comportamento

Na lista de deveres, o usuário pode abrir um modo de edição para alterar apenas os campos mutáveis permitidos pelo contrato do adapter, mantendo intactos o tipo, a recorrência e o histórico de conclusões.

## Acceptance Criteria

- [x] Dado um dever ativo listado, quando o usuário clicar em `Editar`, então o app exibe um formulário inline preenchido com o título, a área e a prioridade atuais.
- [x] Dado um dever em edição, quando o usuário salvar mudanças válidas, então o app atualiza os campos editáveis sem alterar tipo, recorrência ou conclusões já registradas.
- [x] Dado um dever em edição, quando o usuário cancelar a edição, então nenhuma alteração é persistida.

## Edge Cases

- Área vazia: o dever continua válido e passa a ser exibido sem badge de área.
- Dever cíclico e dever único usam o mesmo fluxo de edição apenas para campos mutáveis compartilhados.

## Fora do escopo

- Alterar `type`, `recurrence`, `inicio` ou `fim` via edição.
- Editar ou remover conclusões já marcadas.
