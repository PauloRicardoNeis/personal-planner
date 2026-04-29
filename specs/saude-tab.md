# Descontinuado: saude via projetos e deveres

## Status

Este spec foi substituido por decisao de produto em 2026-04-28.

Nao havera uma aba `Saude` separada no produto. Necessidades desse dominio devem ser modeladas usando os fluxos ja existentes de `Deveres` e `Projetos`.

## Direcao

- [x] Dado um acompanhamento simples com data unica ou recorrencia, quando ele for planejado no app, entao deve ser especificado como `Dever`.
- [x] Dado um acompanhamento com varias etapas, dependencias ou contexto mais rico, quando ele for planejado no app, entao deve ser especificado como `Projeto`.
- [x] Dado o escopo atual do produto, entao nao existe mais requisito de UX, armazenamento ou visao `Hoje` para uma aba `Saude` dedicada.

## Fora do escopo

- Manter uma entidade de produto separada chamada `Saude`.
- Criar ou evoluir uma aba propria para consultas, exames, retornos ou medicacoes.
- Projetar cards dedicados de `Saude` na view `Hoje`.
