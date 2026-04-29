# Habit Streaks

## Comportamento

O sistema calcula e exibe métricas de consistência para cada hábito ativo. A métrica principal é o **streak atual** — número de dias consecutivos em que o hábito bateu a meta diária, terminando em hoje (ou ontem, se hoje ainda não bateu a meta). Métricas secundárias incluem o maior streak histórico e a taxa de consistência dos últimos 30 dias.

O streak é derivado de `habit.completions` e das configurações de meta/peso do hábito — nenhum campo novo de streak é persistido. A lógica de cálculo é pura e testável, vivendo em `packages/core`.

## Definições

- **Streak atual**: número de dias consecutivos em que a meta ponderada foi batida, contando de hoje para trás. Se hoje ainda não bateu a meta mas ontem sim, o streak conta de ontem para trás (streak está "em risco", não perdido).
- **Streak em risco**: quando o streak atual é calculado a partir de ontem (hoje ainda não foi marcado). O usuário vê um indicador visual de que pode perder o streak se não completar hoje.
- **Maior streak**: o maior número de dias consecutivos já alcançado na história do hábito.
- **Taxa 30d**: proporção de dias marcados nos últimos 30 dias (0–100%).

## Acceptance Criteria

### Cálculo do streak atual

- [x] Dado um hábito marcado nos dias 11, 12, 13, 14 (hoje = 14), então o streak atual é 4
- [x] Dado um hábito marcado nos dias 11, 12, 13 (hoje = 14, hoje não marcado), então o streak atual é 3 e está "em risco"
- [x] Dado um hábito marcado nos dias 11, 12, 14 (gap no dia 13, hoje = 14), então o streak atual é 1
- [x] Dado um hábito marcado nos dias 11, 12 (hoje = 14, gap nos dias 13–14), então o streak atual é 0
- [x] Dado um hábito sem nenhuma completion, então o streak atual é 0
- [x] Dado um hábito marcado apenas hoje, então o streak atual é 1

### Streak em risco

- [x] Dado um hábito com streak > 0 calculado a partir de ontem (hoje não marcado), então `atRisk` é `true`
- [x] Dado um hábito com streak > 0 calculado a partir de hoje (hoje já marcado), então `atRisk` é `false`
- [x] Dado um hábito com streak 0, então `atRisk` é `false` (não há nada a perder)

### Maior streak

- [x] Dado um hábito marcado nos dias 1–5, 10–17, 20–22, então o maior streak é 8 (dias 10–17)
- [x] Dado um hábito cujo streak atual é o maior da história, `bestStreak === currentStreak`
- [x] Dado um hábito sem completions, o maior streak é 0

### Taxa 30d

- [x] Dado um hábito marcado em 15 dos últimos 30 dias, a taxa é 50%
- [x] Dado um hábito criado há 10 dias e marcado em 7, a taxa é 70% (base = min(30, dias desde criação))
- [x] Dado um hábito sem completions, a taxa é 0%

### Exibição na UI

- [ ] Na view Hábitos, cada card exibe o streak atual (ex: "🔥 12 dias")
- [ ] Na view Hábitos, se o streak está em risco, o indicador muda visualmente (ex: "⚠️ 12 dias" ou cor diferente)
- [x] Na view Hoje, cada hábito exibe o streak atual ao lado do contador diário
- [ ] Ao clicar/expandir o card de um hábito, o usuário vê: streak atual, maior streak, e taxa 30d
- [x] Streak de 0 dias não exibe indicador visual extra

### Exibição no backend (API/adapter)

- [x] O endpoint `GET /today` retorna um objeto `streak` com `currentStreak`, `bestStreak`, `atRisk` e `rate30d` para cada hábito do snapshot
- [x] Quando uma resposta do adapter não inclui `streak`, `progress` ou `habitProgress`, a camada de compatibilidade da UI recalcula esses campos antes de renderizar
- [x] Os campos de streak são calculados on-the-fly pelo core/servidor, não persistidos no banco

## Tipo de retorno

```typescript
interface HabitStreakInfo {
  currentStreak: number;  // dias consecutivos até hoje (ou ontem se atRisk)
  bestStreak: number;     // maior sequência histórica
  atRisk: boolean;        // true se hoje não foi marcado mas ontem sim
  rate30d: number;        // 0–100 (percentual de dias feitos nos últimos 30 dias)
}
```

A função de cálculo vive em `packages/core`:

```typescript
function computeStreaks(
  completions: Record<ISODate, true>,
  today: ISODate,
  createdAt: ISODateTime
): HabitStreakInfo;
```

Para hábitos com múltiplas ocorrências, `computeHabitGoalCompletions(habit)` produz o mapa `Record<ISODate, true>` usado por `computeStreaks()`, incluindo apenas dias em que a pontuação bateu a meta.

## Edge Cases

- Hábito criado hoje sem completions: streak 0, bestStreak 0, rate30d 0%, atRisk false
- Hábito criado hoje e já marcado: streak 1, bestStreak 1, rate30d 100%, atRisk false
- Hábito com gap de meses e depois um check hoje: streak 1 (não conecta com checks antigos)
- Hábito marcado todos os dias desde a criação (200 dias): streak 200, bestStreak 200, rate30d 100%
- Hábito arquivado (`active: false`): streaks não são calculados nem exibidos (hábito não aparece)
- Fusos horários: a data é sempre `ISODate` (YYYY-MM-DD), sem componente de horário — o fuso do usuário é irrelevante no cálculo
- Completions em datas futuras (bug ou manipulação manual): ignoradas no cálculo do streak
- Completions antes de `createdAt` (dados migrados): contam normalmente para streak e best streak, mas rate30d usa apenas os últimos 30 dias

## Fora do escopo

- Notificações push de streak em risco
- Streak freezes (pular um dia sem perder o streak)
- Streak por hábitos com recorrência customizada (ex: só dias úteis — hábitos são sempre diários)
- Gamificação (badges, milestones, XP)
- Gráfico de heatmap de completions
