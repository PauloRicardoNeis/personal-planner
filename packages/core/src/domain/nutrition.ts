import type {
  NutrientsPer100g,
  NutritionProfile,
  DailyTargets,
  DiaryEntry,
  Food,
} from '../models/nutrition.js';

// ── All DailyTargets keys ────────────────────────────────────────────────────

const DAILY_TARGETS_KEYS: (keyof DailyTargets)[] = [
  'calories', 'protein', 'carbs', 'fat', 'fiber',
  'saturatedFat', 'sugar', 'sodium', 'potassium', 'calcium',
  'iron', 'vitaminA', 'vitaminC', 'vitaminD', 'vitaminB12',
  'magnesium', 'zinc', 'omega3', 'cholesterol',
];

// ── computePortionNutrients ──────────────────────────────────────────────────

/**
 * Multiply each nutrient by grams/100.
 * Returns a DailyTargets with all fields populated (optional ones default to 0 if absent).
 */
export function computePortionNutrients(per100g: NutrientsPer100g, grams: number): DailyTargets {
  const factor = grams / 100;
  const result: Record<string, number> = {};

  for (const key of DAILY_TARGETS_KEYS) {
    const value = per100g[key as keyof NutrientsPer100g];
    if (value !== undefined) {
      result[key] = value * factor;
    }
  }

  return result as unknown as DailyTargets;
}

// ── computeDailyTotals ───────────────────────────────────────────────────────

/**
 * Sum nutrients from all diary entries for a day.
 * For food entries, look up the food by ID. If not found, treat as zero.
 * For quick entries, use the entry's own nutrients.
 */
export function computeDailyTotals(entries: DiaryEntry[], foods: Food[]): DailyTargets {
  const foodMap = new Map(foods.map((f) => [f.id, f]));

  const totals: Record<string, number> = {};
  for (const key of DAILY_TARGETS_KEYS) {
    totals[key] = 0;
  }

  for (const entry of entries) {
    let nutrients: NutrientsPer100g;
    if (entry.type === 'food') {
      const food = foodMap.get(entry.foodId);
      if (!food) continue;
      nutrients = food.nutrients;
    } else {
      nutrients = entry.nutrients;
    }

    const portion = computePortionNutrients(nutrients, entry.grams);
    for (const key of DAILY_TARGETS_KEYS) {
      const val = (portion as unknown as Record<string, number | undefined>)[key];
      if (val !== undefined) {
        totals[key]! += val;
      }
    }
  }

  return totals as unknown as DailyTargets;
}

// ── computeDailyTargets ──────────────────────────────────────────────────────

/**
 * Calculate recommended daily targets based on profile.
 *
 * Formulas by goal:
 * - Cut:      cal = weight*22, protein = weight*2.2, fat = weight*0.8, fiber = 25
 * - Maintain: cal = weight*28, protein = weight*1.8, fat = weight*1.0, fiber = 30
 * - Bulk:     cal = weight*34, protein = weight*2.0, fat = weight*1.2, fiber = 30
 *
 * Carbs = (cal - protein*4 - fat*9) / 4
 *
 * Fixed micros applied, then customTargets override last.
 */
export function computeDailyTargets(profile: NutritionProfile): DailyTargets {
  const { weightKg, goalType } = profile;

  let calories: number;
  let protein: number;
  let fat: number;
  let fiber: number;

  switch (goalType) {
    case 'cut':
      calories = weightKg * 22;
      protein = weightKg * 2.2;
      fat = weightKg * 0.8;
      fiber = 25;
      break;
    case 'maintain':
      calories = weightKg * 28;
      protein = weightKg * 1.8;
      fat = weightKg * 1.0;
      fiber = 30;
      break;
    case 'bulk':
      calories = weightKg * 34;
      protein = weightKg * 2.0;
      fat = weightKg * 1.2;
      fiber = 30;
      break;
  }

  const carbs = (calories - protein * 4 - fat * 9) / 4;

  const targets: DailyTargets = {
    calories,
    protein,
    carbs,
    fat,
    fiber,
    saturatedFat: (calories * 0.10) / 9,
    sugar: (calories * 0.10) / 4,
    sodium: 2300,
    potassium: 3500,
    calcium: 1000,
    iron: 8,
    vitaminA: 900,
    vitaminC: 90,
    vitaminD: 15,
    vitaminB12: 2.4,
    magnesium: 400,
    zinc: 11,
    omega3: 1.6,
    cholesterol: 300,
  };

  // Apply custom overrides
  if (profile.customTargets) {
    for (const key of DAILY_TARGETS_KEYS) {
      const customValue = profile.customTargets[key];
      if (customValue !== undefined) {
        (targets as unknown as Record<string, number>)[key] = customValue;
      }
    }
  }

  return targets;
}

// ── computePercentages ───────────────────────────────────────────────────────

/**
 * For each key: round(totals[key] / targets[key] * 100).
 * If target is 0 or undefined, percentage is 0.
 */
export function computePercentages(
  totals: DailyTargets,
  targets: DailyTargets,
): Record<keyof DailyTargets, number> {
  const result: Record<string, number> = {};

  for (const key of DAILY_TARGETS_KEYS) {
    const total = (totals as unknown as Record<string, number | undefined>)[key] ?? 0;
    const target = (targets as unknown as Record<string, number | undefined>)[key];
    if (!target) {
      result[key] = 0;
    } else {
      result[key] = Math.round((total / target) * 100);
    }
  }

  return result as Record<keyof DailyTargets, number>;
}
