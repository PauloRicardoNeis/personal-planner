# Setup Windows

Este guia cobre o setup de uma maquina Windows nova para trabalhar no `planner-app`.

## Regra De Produto

O alvo final do projeto e o desktop Tauri com sidecar Rust `planner-server` e SQLite. O modo web com `localStorage` existe apenas para desenvolvimento rapido e testes de frontend.

Para validar comportamento de produto, use o caminho REST/server:

```powershell
pnpm dev:server
pnpm --filter web dev
```

ou gere o installer:

```powershell
pnpm build:desktop
```

## Obrigatorio Para Frontend Dev

- Git for Windows
- Node.js 20 ou superior
- pnpm 9 ou superior

## Obrigatorio Para Produto Desktop

- Rust com toolchain `stable-msvc`
- Microsoft C++ Build Tools
- Microsoft Edge WebView2

## Setup Minimo

1. Instale o Git: https://git-scm.com/install/windows
2. Instale Node.js 20+: https://nodejs.org/en/download
3. Instale pnpm:

```powershell
npm install -g pnpm@9
pnpm -v
```

4. Instale dependencias do workspace:

```powershell
pnpm install
pnpm typecheck
pnpm test
```

5. Rode o frontend em modo auxiliar localStorage, se quiser iterar so na UI:

```powershell
pnpm dev:web
```

Esse modo nao e a versao final do app.

## Setup Completo Para Desktop

1. Instale Rust: https://rustup.rs/

```powershell
rustup default stable-msvc
rustc --version
cargo --version
```

2. Instale os requisitos do Tauri no Windows: https://v2.tauri.app/start/prerequisites/

Para `apps/desktop`, o Tauri exige:

- Microsoft C++ Build Tools com a opcao `Desktop development with C++`
- Microsoft Edge WebView2

3. Rode o backend local:

```powershell
pnpm dev:server
```

4. Gere o binario do servidor:

```powershell
pnpm build:server-bin
```

5. Gere o installer desktop canonico:

```powershell
pnpm build:desktop
```

6. Rode o desktop em dev:

```powershell
pnpm --filter desktop dev
```

## Limpeza De Dependencias Restauradas

Se este repo voltou para a maquina com `node_modules` antigo copiado de backup, remova essas pastas antes de reinstalar:

```powershell
Remove-Item -Recurse -Force node_modules, apps\desktop\node_modules
```

## Recuperacao Apos Incidente De Seguranca

Se a maquina anterior pode ter sido comprometida, trate credenciais locais como potencialmente expostas:

- rotacione tokens do GitHub, npm e qualquer outro acesso de desenvolvimento
- restaure `.env.local` e arquivos parecidos apenas de uma fonte confiavel
- se voce faz release desktop, revise a chave de assinatura do Tauri referenciada em `NOTES_LOCAL.md`
