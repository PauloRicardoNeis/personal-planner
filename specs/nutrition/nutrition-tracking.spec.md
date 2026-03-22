# Nutrition Tracking

## Comportamento

O sistema permite ao usuário monitorar sua nutrição diária. Existem três conceitos centrais:

1. **Banco de Comidas** — catálogo pessoal de alimentos com informações nutricionais completas (por 100g). O usuário cadastra uma vez e reutiliza ao registrar refeições.
2. **Diário Nutricional** — registro do que o usuário comeu em cada dia, com porções em gramas. Cada entrada referencia uma comida do banco OU é uma entrada avulsa (sem salvar no banco).
3. **Metas e % Ideal** — com base no peso corporal do usuário, o sistema calcula valores diários ideais de cada nutriente e exibe a porcentagem atingida no dia.

## Modelo de Dados

### Nutrientes rastreados

```typescript
interface NutrientsPer100g {
  // ── Macros (obrigatórios) ──
  calories: number;       // kcal
  protein: number;        // g
  carbs: number;          // g
  fat: number;            // g
  fiber: number;          // g

  // ── Detalhamento de gorduras (opcionais) ──
  saturatedFat?: number;  // g
  transFat?: number;      // g

  // ── Detalhamento de carboidratos (opcionais) ──
  sugar?: number;         // g

  // ── Micronutrientes (opcionais) ──
  sodium?: number;        // mg
  potassium?: number;     // mg
  calcium?: number;       // mg
  iron?: number;          // mg
  vitaminA?: number;      // mcg (RAE)
  vitaminC?: number;      // mg
  vitaminD?: number;      // mcg
  vitaminB12?: number;    // mcg
  magnesium?: number;     // mg
  zinc?: number;          // mg
  omega3?: number;        // g (EPA + DHA + ALA)
  cholesterol?: number;   // mg
}
```

### Comida (banco pessoal)

```typescript
type FoodId = string & { readonly __brand: 'FoodId' };

interface Food {
  id: FoodId;
  name: string;                   // ex: "Arroz branco cozido"
  brand?: string;                 // ex: "Tio João"
  category?: string;              // ex: "grãos", "proteína", "laticínio"
  servingDescription?: string;    // ex: "1 colher de sopa", "1 fatia"
  servingGrams?: number;          // gramas da porção descrita acima (ex: 25)
  nutrients: NutrientsPer100g;    // valores SEMPRE por 100g
  active: boolean;                // false = oculto das buscas
  createdAt: ISODateTime;
}

type FoodInput = Omit<Food, 'id' | 'active' | 'createdAt'>;
```

### Entrada do diário

```typescript
type DiaryEntryId = string & { readonly __brand: 'DiaryEntryId' };

// Entrada vinculada a uma comida do banco
interface FoodDiaryEntry {
  type: 'food';
  id: DiaryEntryId;
  date: ISODate;
  foodId: FoodId;               // referência ao banco de comidas
  grams: number;                // porção em gramas consumida
  meal?: string;                // "café", "almoço", "jantar", "lanche" (livre)
  createdAt: ISODateTime;
}

// Entrada avulsa (quick entry) — não salva no banco de comidas
interface QuickDiaryEntry {
  type: 'quick';
  id: DiaryEntryId;
  date: ISODate;
  description: string;          // ex: "Almoço no restaurante ~500kcal"
  grams: number;                // porção consumida
  nutrients: NutrientsPer100g;  // valores por 100g informados manualmente
  meal?: string;
  createdAt: ISODateTime;
}

type DiaryEntry = FoodDiaryEntry | QuickDiaryEntry;

type DiaryEntryInput =
  | { type: 'food'; foodId: FoodId; grams: number; meal?: string }
  | { type: 'quick'; description: string; grams: number; nutrients: NutrientsPer100g; meal?: string };
```

### Perfil nutricional do usuário

```typescript
interface NutritionProfile {
  weightKg: number;               // peso corporal em kg
  goalType: 'cut' | 'maintain' | 'bulk';
  customTargets?: Partial<DailyTargets>;  // override manual dos valores calculados
}

interface DailyTargets {
  calories: number;       // kcal
  protein: number;        // g
  carbs: number;          // g
  fat: number;            // g
  fiber: number;          // g
  saturatedFat?: number;
  sugar?: number;
  sodium?: number;
  potassium?: number;
  calcium?: number;
  iron?: number;
  vitaminA?: number;
  vitaminC?: number;
  vitaminD?: number;
  vitaminB12?: number;
  magnesium?: number;
  zinc?: number;
  omega3?: number;
  cholesterol?: number;
}
```

### Resumo diário (calculado, não persistido)

```typescript
interface DailyNutritionSummary {
  date: ISODate;
  entries: DiaryEntry[];
  totals: DailyTargets;                          // soma de todos os nutrientes do dia
  targets: DailyTargets;                          // metas baseadas no peso/goal
  percentages: Record<keyof DailyTargets, number>; // 0–100+ (pode ultrapassar 100%)
}
```

## Fórmulas de metas diárias por peso

As metas são calculadas com base no peso e objetivo. O usuário pode fazer override de qualquer valor via `customTargets`.

| Nutriente | Cut | Maintain | Bulk | Unidade |
|---|---|---|---|---|
| Calorias | peso × 22 | peso × 28 | peso × 34 | kcal |
| Proteína | peso × 2.2 | peso × 1.8 | peso × 2.0 | g |
| Carboidratos | (cal restante após prot+fat) / 4 | idem | idem | g |
| Gordura | peso × 0.8 | peso × 1.0 | peso × 1.2 | g |
| Fibra | 25 (fixo) | 30 (fixo) | 30 (fixo) | g |
| Sódio | — | — | — | ≤ 2300 mg |
| Potássio | — | — | — | 3500 mg |
| Cálcio | — | — | — | 1000 mg |
| Ferro | — | — | — | 8 mg (homem) |
| Vitamina A | — | — | — | 900 mcg |
| Vitamina C | — | — | — | 90 mg |
| Vitamina D | — | — | — | 15 mcg |
| Vitamina B12 | — | — | — | 2.4 mcg |
| Magnésio | — | — | — | 400 mg |
| Zinco | — | — | — | 11 mg |
| Omega-3 | — | — | — | 1.6 g |
| Colesterol | — | — | — | ≤ 300 mg |
| Gordura saturada | — | — | — | ≤ (cal × 0.10) / 9 g |
| Açúcar | — | — | — | ≤ (cal × 0.10) / 4 g |

**Cálculo de carbs:**
```
carbsTarget = (caloriesTarget - (proteinTarget × 4) - (fatTarget × 9)) / 4
```

A função de cálculo vive em `packages/core`:

```typescript
function computeDailyTargets(profile: NutritionProfile): DailyTargets;
```

## Acceptance Criteria

### Banco de comidas — CRUD

- [ ] Dado que o usuário preenche nome e pelo menos calorias/proteína/carbs/fat/fibra por 100g, quando salva, então uma comida é criada no banco com ID gerado
- [ ] Dado uma comida existente, quando o usuário edita nome ou nutrientes e salva, então a comida é atualizada
- [ ] Dado uma comida existente, quando o usuário arquiva, então ela não aparece mais nas buscas mas entradas do diário que a referenciam continuam funcionando
- [ ] Dado o banco de comidas, quando o usuário acessa a lista, então vê todas as comidas ativas ordenadas por nome
- [ ] Dado o banco de comidas com 50+ itens, quando o usuário digita no campo de busca, então a lista filtra por nome em tempo real (client-side)
- [ ] Dado uma comida com `servingDescription: "1 fatia"` e `servingGrams: 30`, quando o usuário a seleciona para adicionar ao diário, então o campo de gramas é pré-preenchido com 30g

### Diário nutricional — adicionar comida do banco

- [ ] Dado uma comida do banco, quando o usuário a adiciona ao diário de hoje com 150g, então uma `FoodDiaryEntry` é criada com `grams: 150`
- [ ] Dado uma entrada do diário referenciando uma comida de 200kcal/100g com porção de 150g, então os nutrientes calculados para essa entrada são 300kcal (200 × 150/100)
- [ ] Dado múltiplas entradas no mesmo dia, quando o usuário visualiza o diário, então vê a lista de entradas agrupadas por refeição (meal) e o total acumulado
- [ ] Dado uma entrada existente, quando o usuário altera a porção de 150g para 200g, então os totais recalculam automaticamente
- [ ] Dado uma entrada existente, quando o usuário a remove, então ela desaparece e os totais recalculam

### Diário nutricional — entrada avulsa (quick entry)

- [ ] Dado que o usuário quer registrar algo sem salvar no banco, quando preenche descrição + nutrientes por 100g + gramas consumidas, então uma `QuickDiaryEntry` é criada
- [ ] Dado uma quick entry com 250kcal/100g e porção de 200g, então os nutrientes calculados são 500kcal
- [ ] Dado uma quick entry, ela aparece no diário do dia junto com as entradas de comida do banco, sem distinção visual na listagem (apenas ícone diferente ao expandir)
- [ ] Dado uma quick entry, o usuário pode editar descrição, nutrientes e gramas a qualquer momento

### Metas e porcentagens

- [ ] Dado um usuário com peso 80kg e goal "maintain", quando o sistema calcula as metas, então calorias = 2240, proteína = 144g, gordura = 80g, carbs = (2240 - 144×4 - 80×9) / 4 = 236g
- [ ] Dado um usuário com peso 80kg e goal "cut", quando o sistema calcula as metas, então calorias = 1760, proteína = 176g, gordura = 64g
- [ ] Dado que o usuário tem `customTargets.protein = 200`, então proteína usa 200g em vez do valor calculado; os outros continuam calculados
- [ ] Dado o diário de hoje com total de 1500kcal e meta de 2000kcal, então `percentages.calories = 75`
- [ ] Dado o diário de hoje com total de 2500kcal e meta de 2000kcal, então `percentages.calories = 125` (pode ultrapassar 100%)
- [ ] Dado um dia sem entradas, todas as porcentagens são 0%

### Exibição na UI

- [ ] Na view Nutrição do dia, o usuário vê uma barra de progresso para cada macro (calorias, proteína, carbs, gordura, fibra) com o valor atual, meta, e %
- [ ] Barras de macro que ultrapassem 100% mudam de cor (verde → amarelo em calorias/carbs/fat; verde → verde escuro em proteína/fibra)
- [ ] Abaixo dos macros, uma seção expansível "Micronutrientes" lista os opcionais que têm meta ou valor > 0
- [ ] Na view Hoje, um card resumo de nutrição exibe calorias e macros do dia (proteína, carbs, fat) com porcentagens
- [ ] Na view do banco de comidas, ao clicar numa comida, o usuário vê a tabela nutricional completa por 100g e por porção padrão

### Exibição no backend (API)

- [ ] `GET /api/foods` retorna todas as comidas ativas do banco
- [ ] `POST /api/foods` cria uma comida; `PUT /api/foods/:id` atualiza; `DELETE /api/foods/:id` arquiva
- [ ] `GET /api/diary?date=YYYY-MM-DD` retorna todas as entradas do dia
- [ ] `POST /api/diary` cria uma entrada; `PUT /api/diary/:id` atualiza; `DELETE /api/diary/:id` remove
- [ ] `GET /api/nutrition/summary?date=YYYY-MM-DD` retorna `DailyNutritionSummary` com totais, metas e porcentagens calculados
- [ ] `GET /api/nutrition/profile` retorna o perfil nutricional; `PUT /api/nutrition/profile` atualiza peso/goal/customTargets
- [ ] Todos os endpoints retornam `Result<T>` no formato padrão `{ ok, data } | { ok, error }`

### Integração com view Hoje

- [ ] Dado que o usuário tem entradas no diário de hoje, quando abre a view Hoje, então vê um card "Nutrição" com calorias consumidas/meta e barras compactas de P/C/F
- [ ] Dado que o usuário não configurou o perfil nutricional, o card de nutrição exibe apenas totais sem porcentagens e um link "Configurar perfil"
- [ ] Dado que o usuário clica no card de nutrição na view Hoje, navega para a view Nutrição do dia completa

## Funções puras em `packages/core`

```typescript
/** Calcula nutrientes de uma porção a partir dos valores por 100g */
function computePortionNutrients(per100g: NutrientsPer100g, grams: number): DailyTargets;

/** Soma nutrientes de todas as entradas de um dia */
function computeDailyTotals(entries: DiaryEntry[], foods: Food[]): DailyTargets;

/** Calcula metas diárias baseadas no perfil */
function computeDailyTargets(profile: NutritionProfile): DailyTargets;

/** Calcula porcentagem de cada nutriente atingido */
function computePercentages(totals: DailyTargets, targets: DailyTargets): Record<keyof DailyTargets, number>;
```

## Edge Cases

- Comida do banco deletada/arquivada: entradas antigas do diário que referenciam essa comida continuam funcionando (dados nutricionais são lidos da comida no momento da consulta; se a comida não existe mais, a entrada mostra "Comida removida" com os totais zerados)
- Porção de 0g: validação impede — mínimo 1g
- Nutrientes negativos: validação impede — mínimo 0 para todos os campos
- Peso corporal de 0 ou negativo: validação impede — mínimo 30kg, máximo 300kg
- Dia sem entradas: summary retorna totals zerados, percentages zerados
- Nutriente opcional não informado na comida: tratado como 0 nos cálculos, mas não exibe barra de progresso (diferente de informar 0 explicitamente)
- Quick entry com apenas calorias preenchidas: aceito — macros ficam 0, o cálculo continua funcional
- Mudar peso no perfil: recalcula metas imediatamente; não afeta dias passados (histórico mostra as % com as metas da época? — **decisão: recalcula retroativamente** para simplicidade)
- Comida com `servingGrams` mas sem `servingDescription`: servingGrams ignorado na UI, campo de gramas não é pré-preenchido
- Dois ou mais entries com a mesma comida no mesmo dia e mesma refeição: permitido (ex: comeu arroz no almoço duas vezes)
- Override de `customTargets.carbs`: se o usuário sobrescreve carbs, o cálculo residual é ignorado para carbs, mas continua valendo para os outros se não sobrescritos

## Fora do escopo

- Scanner de código de barras para buscar alimentos
- Integração com APIs externas de nutrientes (USDA, FatSecret, etc.)
- Planejamento de refeições futuras (meal prep)
- Receitas compostas (combinar várias comidas em uma receita)
- Tracking de água / hidratação
- Metas por refeição (só meta diária)
- Histórico de peso corporal / gráficos de evolução
- Ajuste automático de metas baseado em progresso
- Distinção de sexo biológico nas metas de micronutrientes (usa valores masculinos como default)
