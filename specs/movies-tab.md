# Aba de filmes com watchlist, histórico e busca TMDB

## Comportamento

O sistema oferece uma aba `Filmes` onde o usuário pode montar uma watchlist, registrar filmes já assistidos e enriquecer os dados dos filmes por meio da busca na API do TMDB. Quando a chave da API não estiver configurada ou quando o resultado desejado não existir na busca, o usuário ainda consegue cadastrar um filme manualmente.

Cada filme pode ser classificado como `watchlist` ou `watched`, receber tags livres, herdar gêneros sugeridos da busca TMDB e, quando marcado como assistido, registrar nota pessoal de 1 a 5 estrelas. Todos os dados persistem no armazenamento local do app para continuar disponíveis após recarregar a página.

## Acceptance Criteria

- [x] Dado que o usuário abre a aba `Filmes`, quando a página carrega, então ele vê a configuração da API key TMDB, a área de busca/adicionar filme e as tabs `Para Assistir` e `Assistidos`.
- [x] Dado que o usuário configura uma API key TMDB válida, quando recarrega a aplicação, então a chave permanece disponível para novas buscas sem precisar ser digitada novamente.
- [ ] Dado que a API key TMDB está configurada, quando o usuário busca um filme e escolhe um resultado, então o filme é adicionado à watchlist com título, ano, poster, overview e tags sugeridas pelo resultado.
- [x] Dado que o usuário quer cadastrar um filme sem depender do TMDB, quando usa o fluxo de adição manual, então consegue salvar um filme com título obrigatório e metadados opcionais.
- [x] Dado que existe um filme na watchlist, quando o usuário o marca como assistido e define uma nota, então o filme passa para a aba `Assistidos`, registra `watchedAt` e mantém a nota salva.
- [x] Dado que existem filmes com tags diferentes, quando o usuário filtra por uma tag, então a grade mostra apenas filmes da tab atual que possuem essa tag.
- [x] Dado que existem filmes já cadastrados, quando a página é recarregada, então os filmes e suas alterações de status, tags e rating continuam persistidos.
- [x] Dado que o app roda em modo `rest` e o backend ainda não expõe rotas de filmes, quando o usuário abre e usa a aba `Filmes`, então o sistema persiste filmes e API key do TMDB localmente sem exibir erro de implementação pendente.

## Edge Cases

- API key TMDB ausente: a busca retorna erro explícito e o fluxo manual continua disponível.
- Resultado TMDB sem poster, overview ou ano: o filme ainda pode ser adicionado usando apenas os campos disponíveis.
- Filme marcado de volta como `watchlist`: o rating e `watchedAt` são removidos para evitar histórico inconsistente.
- Tags duplicadas ou vazias: o sistema normaliza a lista e persiste apenas valores únicos e não vazios.

## Fora do escopo

- Sincronização de filmes com serviços externos além do TMDB.
- Reviews textuais, listas compartilhadas ou recomendações automáticas.
- Séries, episódios, temporadas ou controle de progresso por tempo assistido.
