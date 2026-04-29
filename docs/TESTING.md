# Testing

Este projeto usa uma arquitetura de testes por camadas. A meta e 100% de coverage de `lines`, `statements`, `functions` e `branches`, com threshold por arquivo.

A checklist dos arquivos de producao ja existentes e seus testes esperados fica em `docs/TEST_FILE_CHECKLIST.md`.

## Objetivos

- Cobrir comportamento, nao so execucao de linha
- Manter os testes perto da camada que eles validam
- Reaproveitar suites compartilhadas sem poluir a arvore de runtime
- Garantir que todo codigo novo ou alterado saia com testes no mesmo change

## Arvore recomendada

```text
packages/
  core/
    src/
      domain/
        recurrence.ts
        recurrence.test.ts
      models/
        habit.ts
        habit.test.ts
      contracts/
        DataAdapter.ts

apps/
  web/
    src/
      deverPresentation.ts
      deverPresentation.test.ts
      adapters/
        LocalStorageAdapter.ts
        LocalStorageAdapter.contract.test.ts
        RestApiAdapter.ts
        RestApiAdapter.contract.test.ts
      test/
        setup/
          vitest.setup.ts
        render/
          renderWithApp.tsx
        fakes/
          createMockAdapter.ts
        builders/
          habitBuilder.ts
        hooks/
          useToday.test.tsx
        pages/
          HojePage.test.tsx
        components/
          HojeView.test.tsx

tests/
  contracts/
    dataAdapterContractSuite.ts
    dataAdapterFixtures.ts
  e2e/
    hoje-flow.e2e.ts
    dever-overdue.e2e.ts
```

## Onde cada teste mora

### 1. Unit tests de dominio e schema

Use para:

- funcoes puras de dominio
- schemas Zod
- normalizadores
- helpers sem React e sem browser API

Local:

- `packages/core/src/**/arquivo.test.ts`
- `apps/web/src/**/arquivo.test.ts` quando o helper for puro e local ao frontend

Exemplos:

- `packages/core/src/domain/recurrence.ts` -> `packages/core/src/domain/recurrence.test.ts`
- `apps/web/src/deverPresentation.ts` -> `apps/web/src/deverPresentation.test.ts`

Regra:

- prefira co-location para deixar a manutencao obvia

### 2. Testes de integracao React

Use para:

- hooks com estado e efeitos
- pages com router
- componentes que dependem de provider, adapter ou fluxo de interacao

Local:

- `apps/web/src/test/hooks/*.test.tsx`
- `apps/web/src/test/pages/*.test.tsx`
- `apps/web/src/test/components/*.test.tsx`

Suporte:

- `apps/web/src/test/setup/` para setup do runner
- `apps/web/src/test/render/` para helpers de render
- `apps/web/src/test/fakes/` para doubles do `DataAdapter`
- `apps/web/src/test/builders/` para factories e builders de dados

Regra:

- qualquer teste que precise renderizar React, usar router ou montar providers vai para `apps/web/src/test/`, nao fica espalhado em pasta de runtime arbitraria

### 3. Testes de contrato

Use para:

- validar que uma implementacao obedece ao `DataAdapter`
- rodar a mesma suite contra mais de um adapter

Local da suite compartilhada:

- `tests/contracts/`

Local do arquivo executavel por implementacao:

- ao lado da implementacao, com nome `*.contract.test.ts`

Exemplos:

- `apps/web/src/adapters/LocalStorageAdapter.ts` -> `apps/web/src/adapters/LocalStorageAdapter.contract.test.ts`
- `apps/web/src/adapters/RestApiAdapter.ts` -> `apps/web/src/adapters/RestApiAdapter.contract.test.ts`

Regra:

- a suite compartilhada mora em `tests/contracts/`
- cada adapter mantem seu proprio arquivo de entrada perto do codigo, para facilitar descoberta

### 4. Testes E2E

Use para:

- jornadas principais do usuario
- regressao de fluxos entre telas
- persistencia e integracao real do app

Local:

- `tests/e2e/*.e2e.ts`

Regra:

- E2E cobre poucos fluxos de alto valor; nao substitui unit ou integracao

## Nomenclatura

- `*.test.ts` para unit tests sem JSX
- `*.test.tsx` para testes React
- `*.contract.test.ts` para contrato
- `*.e2e.ts` para Playwright

## Regras obrigatorias

- Todo arquivo de producao novo ou alterado deve sair com testes no mesmo change.
- Todo bugfix deve comecar por um teste de regressao que falha antes da correcao.
- Coverage alvo e 100% de `lines`, `statements`, `functions` e `branches`, com threshold por arquivo.
- Nao usar snapshots cegos como substituto de assertion semantica.
- Mockar tempo, UUID, rede, `localStorage` e ambiente apenas nas fronteiras.
- Em `packages/core`, prefira o minimo de mocking possivel.
- Nao criar novas pastas `__tests__` quando houver uma localizacao definida nesta arquitetura.
- Fixtures compartilhadas nao devem ficar misturadas com codigo de producao sem necessidade.

## Fluxo recomendado para uma mudanca

1. Encontrar ou criar o spec em `specs/`.
2. Escolher a camada correta do teste antes de escrever codigo.
3. Escrever ou atualizar o teste que falha para o comportamento alvo.
4. Implementar a mudanca.
5. Fechar com coverage de 100% no arquivo tocado e atualizar o spec.
