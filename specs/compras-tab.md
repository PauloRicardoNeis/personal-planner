# Descontinuado: compras via projetos e deveres

## Status

Este spec foi substituido por decisao de produto em 2026-04-28.

Nao havera uma aba `Compras` separada no produto. Necessidades desse dominio devem ser modeladas usando os fluxos ja existentes de `Deveres` e `Projetos`.

## Direcao

- [x] Dado uma compra pontual ou um lembrete simples de reposicao, quando ela for planejada no app, entao deve ser especificada como `Dever`.
- [x] Dado uma compra com varios itens, preparacao ou acompanhamento em varias etapas, quando ela for planejada no app, entao deve ser especificada como `Projeto`.
- [x] Dado o escopo atual do produto, entao nao existe mais requisito de UX, armazenamento ou visao `Hoje` para uma aba `Compras` dedicada.

## Fora do escopo

- Manter uma entidade de produto separada chamada `Compras`.
- Criar ou evoluir uma aba propria de listas de compra.
- Projetar cards dedicados de `Compras` na view `Hoje`.
