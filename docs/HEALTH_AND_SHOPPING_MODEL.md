# Health And Shopping Model

## Objetivo

Definir uma modelagem concreta para os domínios `Saúde` e `Compras` sem forçá-los a caber em `Dever` ou `Projeto`.

No estado atual do app:

- `Dever` representa uma ação genérica com data pontual ou recorrência simples
- `Projeto` representa um resultado finito com etapas
- `Hoje` é uma projeção montada pelo adapter, não a fonte de verdade

`Saúde` e `Compras` têm comportamento próprio, histórico e metadados que extrapolam esses modelos.

## Regra de produto

- Use `Dever` para ações genéricas sem dados ricos de domínio
- Use `Projeto` para objetivos finitos com progresso por etapas
- Use `Saúde` e `Compras` como entidades próprias quando o item precisar de:
  - campos específicos
  - histórico próprio
  - regras de agendamento que não cabem no `RecurrenceConfig`
  - UI própria para consulta e edição

## Princípio de arquitetura

`Saúde` e `Compras` devem ser a fonte de verdade dos próprios dados.

`Hoje` e `Calendário` recebem apenas projeções acionáveis desses domínios, da mesma forma que hoje recebem `deveres` e `projetos`.

Isso evita duplicar estado entre:

- o registro rico do domínio
- o lembrete operacional mostrado para o dia

## Domínio: Saúde

### O que precisa cobrir

- consultas
- exames
- retornos
- medicações
- compra de remédios
- casos periódicos, pontuais e esporádicos

### Entidade recomendada

Começar com uma entidade única `SaudeItem`, sem normalizar médicos ou clínicas em tabelas separadas no MVP.

Isso combina melhor com o padrão atual de JSON blob + app single-user.

```ts
type SaudeItemType =
  | 'consulta'
  | 'exame'
  | 'retorno'
  | 'medicacao'
  | 'compra_medicacao';

type SaudeSchedule =
  | { mode: 'once'; date: ISODate }
  | { mode: 'calendar_rule'; recurrence: RecurrenceConfig }
  | { mode: 'after_completion_interval'; unit: 'days' | 'weeks' | 'months'; value: number }
  | { mode: 'manual_next_date'; nextDate?: ISODate };

interface SaudeEvent {
  id: string;
  itemId: string;
  kind: 'scheduled' | 'completed' | 'purchased' | 'skipped' | 'note';
  date: ISODate;
  createdAt: ISODateTime;
  notes?: string;
  cost?: number;
}

interface SaudeItem {
  id: string;
  type: SaudeItemType;
  title: string;
  specialty?: string;
  providerName?: string;
  clinicName?: string;
  location?: string;
  notes?: string;
  costEstimate?: number;
  priority: 'low' | 'medium' | 'high';
  active: boolean;
  createdAt: ISODateTime;
  schedule: SaudeSchedule;
  lastCompletedAt?: ISODateTime;
  events: SaudeEvent[];
}
```

### Por que essa forma

- `once` cobre consultas e exames já marcados
- `calendar_rule` cobre casos fixos como check-up anual ou medicação semanal
- `after_completion_interval` cobre retornos do tipo "voltar 45 dias depois"
- `manual_next_date` cobre casos esporádicos, sem regra automática estável

### Projeção para Hoje

O adapter deve derivar um item acionável para `Hoje` quando:

- `mode: 'once'` e a data for hoje ou estiver atrasada
- `mode: 'calendar_rule'` disparar na data
- `mode: 'after_completion_interval'` vencer com base na última conclusão
- `mode: 'manual_next_date'` estiver definida e for hoje ou anterior

O lembrete em `Hoje` não substitui o `SaudeItem`; ele apenas aponta para a próxima ação.

### O que não modelar no início

- cadastro separado de convênios
- anexos de exames
- múltiplas doses por dia com horários detalhados
- protocolo clínico complexo com dependências entre itens

Esses casos podem ser adicionados depois, se houver uso real.

## Domínio: Compras

### O que precisa cobrir

- listas de compras
- itens checkáveis
- links
- loja preferida
- preço
- lembrete opcional de reposição

### Entidades recomendadas

Começar com `ListaCompra` contendo `CompraItem[]`.

```ts
type CompraReminder =
  | { mode: 'none' }
  | { mode: 'manual_next_date'; nextDate?: ISODate }
  | { mode: 'after_completion_interval'; unit: 'days' | 'weeks' | 'months'; value: number };

interface CompraPricePoint {
  price: number;
  date: ISODate;
  store?: string;
}

interface CompraItem {
  id: string;
  title: string;
  checked: boolean;
  quantity?: number;
  unit?: string;
  preferredStore?: string;
  url?: string;
  lastPrice?: number;
  targetPrice?: number;
  priceHistory?: CompraPricePoint[];
  notes?: string;
}

interface ListaCompra {
  id: string;
  title: string;
  notes?: string;
  active: boolean;
  createdAt: ISODateTime;
  plannedFor?: ISODate;
  reminder: CompraReminder;
  items: CompraItem[];
  lastCompletedAt?: ISODateTime;
}
```

### Por que essa forma

- uma compra é uma coleção de itens, não uma tarefa isolada
- preço e link pertencem ao item, não ao conjunto
- reposição recorrente costuma depender da última compra, não de uma regra semanal fixa

### Projeção para Hoje

O adapter deve gerar lembrete de compra quando:

- `plannedFor` for hoje ou estiver atrasado
- `reminder.mode: 'manual_next_date'` estiver vencido
- `reminder.mode: 'after_completion_interval'` vencer com base em `lastCompletedAt`

`Hoje` mostra a lista como ação pendente, com contagem resumida de itens.

### O que não modelar no início

- scraping automático de preços
- comparação entre várias lojas
- carrinho online integrado
- compartilhamento de lista com outras pessoas

## Navegação

Modelo de dados e navegação não precisam ser a mesma decisão.

Opções válidas:

- duas abas dedicadas: `Saúde` e `Compras`
- uma aba única `Listas` com seções internas para `Saúde` e `Compras`

Se a preocupação principal for manter a sidebar enxuta, a segunda opção é melhor no começo.

Se a prioridade for clareza conceitual, as duas abas dedicadas são melhores.

## Recomendação incremental

1. Criar os modelos próprios de `Saúde` e `Compras`
2. Expor CRUD no `DataAdapter`
3. Criar páginas dedicadas ou uma página `Listas`
4. Projetar itens vencidos ou acionáveis em `Hoje`
5. Só depois decidir se `Calendário` também mostra esses itens

## Resumo

- Não usar `Projeto` como fonte de verdade para compras ou saúde
- Não usar `Dever` como estrutura principal para casos médicos assimétricos
- Usar domínios próprios com projeção para `Hoje`
- Começar simples: um modelo por domínio, sem normalização excessiva
