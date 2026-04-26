# Setup Windows

Este guia cobre o setup de uma maquina Windows nova para rodar o `planner-app`.

## O que e obrigatorio

Para voltar a trabalhar no frontend web hoje, voce precisa de:

- Git for Windows
- Node.js 20 ou superior
- pnpm 9 ou superior

Para trabalhar tambem com `apps/server-rust` e `apps/desktop`, voce precisa de:

- Rust com toolchain `stable-msvc`
- Microsoft C++ Build Tools
- Microsoft Edge WebView2

## Setup minimo para rodar o web

### 1. Instale o Git

Baixe o instalador oficial:

- https://git-scm.com/install/windows

Depois abra um novo PowerShell e confira:

```powershell
git --version
```

### 2. Instale o Node.js

O repo exige `node >=20`. Se voce quiser a menor chance de diferenca em relacao ao CI atual, use Node 20.x. O site oficial de downloads fica em:

- https://nodejs.org/en/download

Depois feche e abra o terminal novamente e confira:

```powershell
node -v
npm -v
```

### 3. Instale o pnpm

Depois que o Node estiver instalado, rode:

```powershell
npm install -g pnpm@9
pnpm -v
```

### 4. Limpe dependencias restauradas de backup

Se este repo voltou para a maquina com `node_modules` antigo copiado do backup, remova essas pastas antes de reinstalar:

```powershell
Remove-Item -Recurse -Force node_modules, apps\desktop\node_modules
```

### 5. Instale as dependencias do workspace

Na raiz do repo:

```powershell
pnpm install
pnpm typecheck
pnpm test
pnpm dev:web
```

O frontend usa `localStorage` por padrao, entao nao precisa de backend para subir a interface localmente.

## Setup completo para server-rust e desktop

### 6. Instale o Rust

Instalador oficial:

- https://rustup.rs/

No Windows, escolha o host `*-pc-windows-msvc` no instalador. Depois abra um novo terminal e rode:

```powershell
rustup default stable-msvc
rustc --version
cargo --version
```

### 7. Instale as dependencias do Tauri no Windows

Documentacao oficial:

- https://v2.tauri.app/start/prerequisites/

Para `apps/desktop`, o Tauri exige:

- Microsoft C++ Build Tools com a opcao `Desktop development with C++`
- Microsoft Edge WebView2

Observacao: em Windows 10 a partir da versao 1803 e no Windows 11, o WebView2 normalmente ja vem instalado.

### 8. Rode os alvos extras

Backend Rust:

```powershell
pnpm dev:server
```

Build do binario do servidor:

```powershell
pnpm build:server-bin
```

Desktop sem sidecar do servidor:

```powershell
pnpm --filter web build:desktop
pnpm --filter desktop dev:no-server
```

Desktop com sidecar do servidor:

```powershell
pnpm build:desktop-with-server
```

## Verificacao rapida

Depois do setup, rode:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\check-dev-setup.ps1
```

## Recuperacao apos incidente de seguranca

Se a maquina anterior pode ter sido comprometida, trate credenciais locais como potencialmente expostas:

- rotacione tokens do GitHub, npm e qualquer outro acesso de desenvolvimento
- restaure `.env.local` e arquivos parecidos apenas de uma fonte confiavel
- se voce faz release desktop, revise a chave de assinatura do Tauri referenciada em `NOTES_LOCAL.md`; se houver duvida sobre exposicao, gere uma chave nova e atualize os secrets relacionados
