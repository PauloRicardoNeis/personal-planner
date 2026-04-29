# Edição de hábitos

## Comportamento

Na lista de hábitos, o usuário pode abrir um modo de edição para ajustar os campos mutáveis de um hábito existente sem perder seu histórico de conclusões.

## Acceptance Criteria

- [x] Dado um hábito ativo listado, quando o usuário clicar em `Editar`, então o app exibe um formulário inline preenchido com o título e a categoria atuais.
- [x] Dado um hábito em edição, quando o usuário salvar mudanças válidas, então o app atualiza os campos editáveis e preserva o histórico de conclusões já registrado.
- [x] Dado um hábito em edição, quando o usuário cancelar a edição, então nenhuma alteração é persistida.

## Edge Cases

- Categoria vazia: o hábito continua válido e passa a ser exibido sem badge de categoria.
- Título com espaços extras: o valor salvo remove espaços no começo e no fim.

## Fora do escopo

- Edição do histórico de conclusões diárias.
- Edição em lote de vários hábitos ao mesmo tempo.
