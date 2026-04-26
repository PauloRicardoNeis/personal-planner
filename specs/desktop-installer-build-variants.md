# Desktop Installer Build Variants

## Comportamento

Builds desktop usados localmente para testar ou gerar instaladores manuais nao exigem chave privada de assinatura do updater. Builds de release que publicam artefatos de update continuam separados e exigem a chave privada correspondente.

## Acceptance Criteria

- [x] Dado um ambiente local sem `TAURI_SIGNING_PRIVATE_KEY`, quando o desenvolvedor roda o build desktop padrao sem servidor, entao o instalador e gerado sem falhar por assinatura do updater.
- [x] Dado um ambiente local sem `TAURI_SIGNING_PRIVATE_KEY`, quando o desenvolvedor roda o build desktop padrao com servidor, entao o instalador e gerado sem falhar por assinatura do updater.
- [x] Dado que o desenvolvedor quer publicar updates desktop, quando ele usa os scripts de release, entao a configuracao inclui os artefatos do updater e continua dependendo da chave privada de assinatura.

## Edge Cases

- Build local sem servidor: o instalador nao embute o sidecar `planner-server`.
- Build local ou release com servidor: o instalador embute o sidecar `planner-server`.

## Fora do escopo

- Alterar o fluxo de update em runtime no aplicativo.
- Gerar ou rotacionar chaves de assinatura do Tauri.
