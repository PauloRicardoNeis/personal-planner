# Test Architecture And Coverage Policy

## Comportamento

O projeto organiza os testes por camada, seguindo a arquitetura do repositorio. Cada mudanca de comportamento entrega testes na camada correta e preserva a meta de 100% de coverage por arquivo.

## Acceptance Criteria

- [x] Dado uma funcao pura, schema ou regra de negocio em `packages/core/src`, quando escrever testes, entao eles ficam co-localizados ao lado do arquivo testado como `*.test.ts`.
- [x] Dado um helper puro em `apps/web/src`, quando escrever testes unitarios, entao eles ficam co-localizados ao lado do arquivo testado como `*.test.ts` ou `*.test.tsx`.
- [x] Dado um hook, page ou componente React que precise renderizacao, router, provider ou doubles do adapter, quando escrever testes, entao eles ficam em `apps/web/src/test/` separados por `hooks`, `pages` ou `components`.
- [x] Dado uma implementacao de `DataAdapter`, quando validar o contrato, entao o arquivo executavel do teste fica ao lado da implementacao como `*.contract.test.ts` e a suite compartilhada fica em `tests/contracts/`.
- [x] Dado um fluxo ponta a ponta, quando automatizado, entao ele fica em `tests/e2e/*.e2e.ts`.
- [x] Dado qualquer mudanca nao-trivial de comportamento, quando concluida, entao a documentacao do projeto deixa explicito que a meta e 100% de coverage de `lines`, `statements`, `functions` e `branches`, com threshold por arquivo.

## Edge Cases

- Arquivos de suporte compartilhados para testes, como fixtures, builders e fakes, ficam fora da arvore de runtime sempre que possivel, em `tests/` ou `apps/web/src/test/`.
- Suites de contrato reutilizadas por mais de um adapter compartilham a logica em `tests/contracts/`, mas cada implementacao mantem seu proprio arquivo `*.contract.test.ts` ao lado do codigo.
- Nao criar novas pastas `__tests__` ou uma pasta raiz generica de testes quando existir uma localizacao padrao mais especifica para aquela camada.

## Fora do escopo

- Configurar runners, bibliotecas ou pipelines de CI neste spec.
- Migrar imediatamente toda a suite existente para o novo padrao sem necessidade funcional.
