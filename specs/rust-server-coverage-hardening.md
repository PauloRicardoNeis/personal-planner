# Rust Server Coverage Hardening

## Comportamento

O servidor Rust deve manter paridade de comportamento com os modelos e fluxos principais do app, com testes cobrindo persistencia SQLite, serializacao dos modelos e regras puras usadas pelas rotas.

## Acceptance Criteria

- [x] Dado um banco SQLite em memoria, quando os repositorios gravam e leem entidades principais, entao os dados retornam intactos e registros invalidos nao derrubam a leitura.
- [x] Dado modelos Rust serializados no contrato JSON do frontend, quando eles sao desserializados ou serializados, entao nomes camelCase, aliases legados e discriminadores continuam compativeis.
- [x] Dado regras puras de recorrencia, streak, projeto e nutricao, quando recebem casos normais e limites, entao retornam os mesmos resultados esperados pelo app.
- [x] Dado a suite Rust atualizada, quando `cargo test` roda, entao todos os testes passam.
- [x] Dado o relatorio `cargo llvm-cov`, quando a suite roda, entao a cobertura Rust sobe em relacao ao baseline de 15.73% de linhas.

## Edge Cases

- JSON invalido em linhas persistidas: deve ser ignorado por leitores agregados e retornar `None` em leitura por id.
- Habitos ponderados malformados: devem normalizar para um alvo minimo seguro.
- Datas invalidas: devem ser rejeitadas pelas regras de recorrencia/streak sem panic.
- Perfil nutricional ausente: deve ter fallback seguro nas rotas de resumo.

## Fora do escopo

- Mutation testing Rust.
- Testes com chamadas reais para API da Steam.
- Mudancas no contrato HTTP ou no schema do banco.
