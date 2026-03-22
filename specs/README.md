# Spec Format

Specs descrevem comportamento observável — o quê, não o como. Escreva specs antes de escrever código.

## Quando criar um spec

- Qualquer feature nova não-trivial
- Qualquer mudança de comportamento existente
- Qualquer edge case que não está documentado

Mudanças triviais (copy, ajustes de estilo): spec opcional.

## Template

```markdown
# [Nome da feature ou comportamento]

## Comportamento

[Descrição em prosa do que o sistema faz nesse contexto. Foco em resultado para o usuário, não em implementação.]

## Acceptance Criteria

- [ ] Dado [estado inicial], quando [ação], então [resultado esperado]
- [ ] Dado [estado inicial], quando [ação], então [resultado esperado]

## Edge Cases

- [Caso limite]: [comportamento esperado]
- [Caso limite]: [comportamento esperado]

## Fora do escopo

- [O que esse spec explicitamente não cobre]
```

## Regras

1. Acceptance criteria devem ser verificáveis — evite subjetividade
2. Marque `[x]` quando o critério estiver implementado e testado
3. Edge cases devem ter comportamento explícito, não "TBD"
4. Mantenha specs atualizados quando o comportamento mudar
