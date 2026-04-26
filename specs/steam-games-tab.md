# Aba de jogos com importação da biblioteca Steam

## Comportamento

O sistema oferece uma aba `Jogos` onde o usuário pode salvar sua chave da Steam Web API e o identificador do perfil Steam, sincronizar a própria biblioteca e visualizar a lista de jogos importados. A biblioteca sincronizada fica persistida nos dados locais do app, para que a lista continue visível entre sessões.

Quando a sincronização roda em um ambiente com backend local ou comando desktop disponível, o sistema busca a biblioteca na Steam, normaliza os dados recebidos e atualiza a lista de jogos no app. Quando o app está rodando apenas no navegador sem esse suporte, o sistema exibe um erro explícito informando que a sincronização direta não é possível nesse modo.

## Acceptance Criteria

- [x] Dado que o usuário abre a aba `Jogos`, quando a página carrega, então ele vê um formulário com campo de chave da Steam Web API e campo de identificador do perfil Steam para configurar a sincronização.
- [x] Dado que o usuário salva as credenciais da Steam, quando recarrega a aplicação, então os campos previamente salvos continuam preenchidos a partir do armazenamento do app.
- [x] Dado que há credenciais válidas e um ambiente de sincronização suportado, quando o usuário clica em sincronizar, então o sistema importa a biblioteca Steam, persiste a lista de jogos e mostra os jogos importados ordenados por maior tempo jogado.
- [x] Dado que o app está em modo local somente navegador, quando o usuário tenta sincronizar com a Steam, então o sistema retorna uma mensagem clara explicando que a sincronização requer backend REST local ou app desktop.

## Edge Cases

- Perfil Steam privado ou biblioteca invisível: a sincronização falha com erro explícito e não apaga a biblioteca já salva.
- Identificador de perfil em formato URL personalizada ou vanity URL: o sistema resolve o identificador para SteamID64 antes de buscar a biblioteca.
- Resposta inválida ou parcial da Steam: itens sem `appid` ou `name` são ignorados, mantendo apenas jogos válidos na biblioteca importada.

## Fora do escopo

- Importar conquistas, screenshots, wishlist ou amigos da Steam.
- Editar metadados do jogo manualmente dentro da aba.
- Sincronização automática em background.
