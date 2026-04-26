# Aba de saude com acompanhamentos e agendamento irregular

## Comportamento

O sistema oferece uma aba `Saúde` para registrar acompanhamentos como consultas, exames, retornos, medicações e compras de remédios. Cada item de saúde pode ser pontual, recorrente por regra fixa, recorrente com intervalo contado a partir da última conclusão, ou apenas ter uma próxima data manual.

Os itens de saúde persistem no armazenamento do app com seus metadados e histórico. Quando um item possui uma próxima ação vencida ou agendada para hoje, o sistema pode projetá-lo para a visão `Hoje` sem transformar o registro de saúde em um `Dever`.

## Acceptance Criteria

- [x] Dado que o usuário abre a aba `Saúde`, quando a página carrega, então ele vê a lista de acompanhamentos ativos e um formulário para criar um novo item de saúde.
- [x] Dado que o usuário cria um item do tipo `consulta`, `exame`, `retorno`, `medicação` ou `compra de remédio`, quando salva, então o item fica persistido com tipo, título, prioridade, observações e modo de agendamento.
- [x] Dado que o usuário escolhe o modo `once`, quando define uma data e salva, então o item passa a ter uma próxima ação exatamente nessa data.
- [x] Dado que o usuário escolhe o modo `calendar_rule`, quando define uma recorrência válida, então o item gera ações futuras conforme a regra configurada.
- [x] Dado que o usuário escolhe o modo `after_completion_interval`, quando conclui um item, então a próxima ação é recalculada a partir da data de conclusão e não da data originalmente planejada.
- [x] Dado que o usuário escolhe o modo `manual_next_date`, quando define uma próxima data manualmente, então o sistema usa essa data como referência sem assumir uma recorrência automática.
- [x] Dado que existe um item de saúde com ação devida hoje ou atrasada, quando a visão `Hoje` é montada, então o item aparece como lembrete acionável mantendo o registro rico na aba `Saúde`.
- [x] Dado que o usuário registra uma conclusão, compra ou anotação em um item de saúde, quando salva, então o evento fica disponível no histórico do item após recarregar a aplicação.

## Edge Cases

- Item `manual_next_date` sem próxima data definida: o item continua ativo na aba `Saúde`, mas não aparece em `Hoje`.
- Item `after_completion_interval` sem histórico de conclusão: o sistema usa o primeiro vencimento apenas depois que uma data inicial ou conclusão existir.
- Item `once` já concluído: ele sai da lista de pendências de `Hoje`, mas continua acessível no histórico da aba `Saúde`.
- Mudança de modo de agendamento: o sistema preserva o histórico já registrado e recalcula apenas a próxima ação.

## Fora do escopo

- Cadastro completo de convênios, reembolsos e documentos.
- Anexos de exames, laudos e imagens.
- Protocolos médicos complexos com dependência entre vários itens.
- Alertas de horário intradiário para múltiplas doses no mesmo dia.
