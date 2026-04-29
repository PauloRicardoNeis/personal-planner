# Edição de projetos

## Comportamento

Na lista de projetos, o usuário pode editar os dados principais de um projeto existente sem impactar suas etapas ou o status atual.

## Acceptance Criteria

- [x] Dado um projeto listado, quando o usuário expandir o card e clicar em `Editar`, então o app exibe um formulário inline preenchido com os dados atuais do projeto.
- [x] Dado um projeto em edição, quando o usuário salvar mudanças válidas, então o app atualiza os campos principais do projeto e preserva etapas e status já existentes.
- [x] Dado um projeto em edição, quando o usuário cancelar a edição, então nenhuma alteração é persistida.

## Edge Cases

- Descrição e área vazias: o projeto continua válido e pode ser exibido sem esses campos auxiliares.
- Datas não preenchidas no formulário de criação continuam opcionais no fluxo de edição.

## Fora do escopo

- Edição das etapas dentro deste fluxo.
- Mudanças automáticas de status ao salvar um projeto.
