# Desktop Installer com servidor unico

## Comportamento

O desktop sempre e gerado com o sidecar `planner-server` e usa SQLite como armazenamento persistente. Nao ha variante `no-server`/`localStorage` para instalador, evitando que uma atualizacao troque silenciosamente o backend e esconda os dados ja existentes.

Builds desktop usados localmente para testar ou gerar instaladores manuais nao exigem chave privada de assinatura do updater. Builds de release que publicam artefatos de update continuam separados e exigem a chave privada correspondente.

Esta e a versao final/canonica do aplicativo. O modo browser com `localStorage` existe apenas para desenvolvimento e teste de frontend.

## Acceptance Criteria

- [x] Dado um ambiente local sem `TAURI_SIGNING_PRIVATE_KEY`, quando o desenvolvedor roda `pnpm build:desktop`, entao o instalador e gerado sem falhar por assinatura do updater.
- [x] Dado o build desktop padrao, quando o frontend e compilado, entao ele usa `VITE_BACKEND_MODE=rest` para falar com o sidecar `planner-server`.
- [x] Dado o build desktop padrao, quando o Tauri empacota o app, entao o bundle inclui `binaries/planner-server`.
- [x] Dado que um `planner-server.exe` antigo ficou rodando de uma instalacao anterior, quando o desktop inicia, entao ele encerra o processo antigo antes de subir o sidecar empacotado atual.
- [x] Dado uma feature ou bugfix de produto, quando ela e validada, entao a validacao cobre o caminho desktop/server e nao apenas `LocalStorageAdapter`.
- [x] Dado a configuracao de scripts, nao existem comandos `desktop-no-server` nem configs `tauri.conf.*no-server*`.
- [x] Dado que o desenvolvedor quer publicar updates desktop, quando ele usa os scripts de release, entao a configuracao inclui os artefatos do updater e continua dependendo da chave privada de assinatura.

## Edge Cases

- Build local: gera NSIS com sidecar e sem artefatos de updater assinados.
- Build de release: gera NSIS com sidecar e artefatos de updater.

## Fora do escopo

- Migrar dados de `localStorage` para SQLite.
- Gerar ou rotacionar chaves de assinatura do Tauri.
