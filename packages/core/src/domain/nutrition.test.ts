import { describe, it, expect } from 'vitest';
import {
  computePortionNutrients,
  computeDailyTargets,
  computePercentages,
  computeDailyTotals,
} from './nutrition.js';
import type { NutrientsPer100g, Food, DiaryEntry, DailyTargets } from '../models/nutrition.js';
import type { ISODate, ISODateTime } from '../models/shared.js';

const d = (s: string) => s as ISODate;
const dt = (s: string) => s as ISODateTime;

const makeNutrients = (overrides: Partial<NutrientsPer100g> = {}): NutrientsPer100g => ({
  calories: 0,
  protein: 0,
  carbs: 0,
  fat: 0,
  fiber: 0,
  ...overrides,
});

describe('computePortionNutrients', () => {
  it('scales nutrients by grams/100', () => {
    const per100g = makeNutrients({ calories: 200, protein: 10, carbs: 30, fat: 5, fiber: 3 });
    const result = computePortionNutrients(per100g, 150);
    expect(result.calories).toBe(300);
    expect(result.protein).toBe(15);
    expect(result.carbs).toBe(45);
    expect(result.fat).toBe(7.5);
    expect(result.fiber).toBe(4.5);
  });

  it('returns zeros for 0 grams', () => {
    const per100g = makeNutrients({ calories: 200, protein: 10, carbs: 30, fat: 5, fiber: 3 });
    const result = computePortionNutrients(per100g, 0);
    expect(result.calories).toBe(0);
    expect(result.protein).toBe(0);
  });

  it('handles exactly 100g (identity)', () => {
    const per100g = makeNutrients({ calories: 165, protein: 31, carbs: 0, fat: 3.6, fiber: 0 });
    const result = computePortionNutrients(per100g, 100);
    expect(result.calories).toBe(165);
    expect(result.protein).toBe(31);
    expect(result.fat).toBe(3.6);
  });

  it('handles very small portions (1g)', () => {
    const per100g = makeNutrients({ calories: 200, protein: 10 });
    const result = computePortionNutrients(per100g, 1);
    expect(result.calories).toBe(2);
    expect(result.protein).toBe(0.1);
  });

  it('handles large portions (500g)', () => {
    const per100g = makeNutrients({ calories: 100, protein: 5, carbs: 20 });
    const result = computePortionNutrients(per100g, 500);
    expect(result.calories).toBe(500);
    expect(result.protein).toBe(25);
    expect(result.carbs).toBe(100);
  });

  it('scales optional micronutrients when present', () => {
    const per100g = makeNutrients({ calories: 50, protein: 1, carbs: 10, fat: 0.5, fiber: 2, sodium: 400, calcium: 120 });
    const result = computePortionNutrients(per100g, 200);
    expect(result.sodium).toBe(800);
    expect(result.calcium).toBe(240);
  });

  it('does not include micronutrients when absent from input', () => {
    const per100g = makeNutrients({ calories: 100 });
    const result = computePortionNutrients(per100g, 100);
    expect(result.calories).toBe(100);
    expect(result.sodium).toBeUndefined();
    expect(result.calcium).toBeUndefined();
  });
});

describe('computeDailyTargets', () => {
  it('calculates maintain targets for 80kg', () => {
    const result = computeDailyTargets({ weightKg: 80, goalType: 'maintain' });
    expect(result.calories).toBe(2240);   // 80*28
    expect(result.protein).toBe(144);     // 80*1.8
    expect(result.fat).toBe(80);          // 80*1.0
    // carbs = (2240 - 144*4 - 80*9) / 4 = (2240 - 576 - 720) / 4 = 944/4 = 236
    expect(result.carbs).toBe(236);
  });

  it('calculates cut targets for 80kg', () => {
    const result = computeDailyTargets({ weightKg: 80, goalType: 'cut' });
    expect(result.calories).toBe(1760);   // 80*22
    expect(result.protein).toBe(176);     // 80*2.2
    expect(result.fat).toBe(64);          // 80*0.8
  });

  it('applies customTargets overrides', () => {
    const result = computeDailyTargets({
      weightKg: 80,
      goalType: 'maintain',
      customTargets: { protein: 200 },
    });
    expect(result.protein).toBe(200);
    expect(result.calories).toBe(2240);
  });

  it('calculates bulk targets for 80kg', () => {
    const result = computeDailyTargets({ weightKg: 80, goalType: 'bulk' });
    expect(result.calories).toBe(2720);   // 80*34
    expect(result.protein).toBe(160);     // 80*2.0
    expect(result.fat).toBe(96);          // 80*1.2
    expect(result.fiber).toBe(30);
    // carbs = (2720 - 160*4 - 96*9) / 4 = (2720 - 640 - 864) / 4 = 1216/4 = 304
    expect(result.carbs).toBe(304);
  });

  it('calculates fixed micros correctly', () => {
    const result = computeDailyTargets({ weightKg: 70, goalType: 'maintain' });
    expect(result.sodium).toBe(2300);
    expect(result.potassium).toBe(3500);
    expect(result.calcium).toBe(1000);
    expect(result.iron).toBe(8);
    expect(result.vitaminA).toBe(900);
    expect(result.vitaminC).toBe(90);
    expect(result.vitaminD).toBe(15);
    expect(result.vitaminB12).toBe(2.4);
    expect(result.magnesium).toBe(400);
    expect(result.zinc).toBe(11);
    expect(result.omega3).toBe(1.6);
    expect(result.cholesterol).toBe(300);
  });

  it('calculates saturatedFat and sugar from calories', () => {
    const result = computeDailyTargets({ weightKg: 80, goalType: 'maintain' });
    // cal=2240, saturatedFat = (2240*0.10)/9 ≈ 24.89
    expect(result.saturatedFat).toBeCloseTo(24.89, 1);
    // sugar = (2240*0.10)/4 = 56
    expect(result.sugar).toBe(56);
  });

  it('handles very light person (40kg cut)', () => {
    const result = computeDailyTargets({ weightKg: 40, goalType: 'cut' });
    expect(result.calories).toBe(880);
    expect(result.protein).toBe(88);
    expect(result.fat).toBe(32);
    expect(result.fiber).toBe(25);
    // carbs = (880 - 88*4 - 32*9)/4 = (880 - 352 - 288)/4 = 240/4 = 60
    expect(result.carbs).toBe(60);
  });

  it('handles heavy person (120kg bulk)', () => {
    const result = computeDailyTargets({ weightKg: 120, goalType: 'bulk' });
    expect(result.calories).toBe(4080);  // 120*34
    expect(result.protein).toBe(240);    // 120*2.0
    expect(result.fat).toBe(144);        // 120*1.2
  });

  it('applies multiple customTargets overrides', () => {
    const result = computeDailyTargets({
      weightKg: 70,
      goalType: 'cut',
      customTargets: { calories: 2000, protein: 180, carbs: 200, fat: 60, fiber: 35, sodium: 1500 },
    });
    expect(result.calories).toBe(2000);
    expect(result.protein).toBe(180);
    expect(result.carbs).toBe(200);
    expect(result.fat).toBe(60);
    expect(result.fiber).toBe(35);
    expect(result.sodium).toBe(1500);
    // Non-overridden micros still calculated
    expect(result.potassium).toBe(3500);
  });

  it('no customTargets field means no overrides', () => {
    const result = computeDailyTargets({ weightKg: 80, goalType: 'maintain' });
    expect(result.calories).toBe(2240);
    expect(result.protein).toBe(144);
  });
});

describe('computePercentages', () => {
  it('calculates percentage of totals vs targets', () => {
    const totals: DailyTargets = { calories: 1500, protein: 100, carbs: 200, fat: 50, fiber: 20 };
    const targets: DailyTargets = { calories: 2000, protein: 150, carbs: 250, fat: 80, fiber: 30 };
    const result = computePercentages(totals, targets);
    expect(result.calories).toBe(75);
    expect(result.protein).toBe(67);
    expect(result.carbs).toBe(80);
    expect(result.fat).toBe(63);
    expect(result.fiber).toBe(67);
  });

  it('returns 0 when target is 0', () => {
    const totals: DailyTargets = { calories: 500, protein: 50, carbs: 100, fat: 20, fiber: 10 };
    const targets: DailyTargets = { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 };
    const result = computePercentages(totals, targets);
    expect(result.calories).toBe(0);
    expect(result.protein).toBe(0);
  });

  it('returns 100 when totals equal targets', () => {
    const targets: DailyTargets = { calories: 2000, protein: 150, carbs: 250, fat: 80, fiber: 30 };
    const result = computePercentages(targets, targets);
    expect(result.calories).toBe(100);
    expect(result.protein).toBe(100);
    expect(result.carbs).toBe(100);
    expect(result.fat).toBe(100);
    expect(result.fiber).toBe(100);
  });

  it('allows percentages over 100 (exceeded targets)', () => {
    const totals: DailyTargets = { calories: 3000, protein: 200, carbs: 300, fat: 120, fiber: 50 };
    const targets: DailyTargets = { calories: 2000, protein: 150, carbs: 250, fat: 80, fiber: 30 };
    const result = computePercentages(totals, targets);
    expect(result.calories).toBe(150);
    expect(result.protein).toBe(133);
    expect(result.fat).toBe(150);
    expect(result.fiber).toBe(167);
  });

  it('returns 0 when totals are all zeros', () => {
    const totals: DailyTargets = { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 };
    const targets: DailyTargets = { calories: 2000, protein: 150, carbs: 250, fat: 80, fiber: 30 };
    const result = computePercentages(totals, targets);
    expect(result.calories).toBe(0);
    expect(result.protein).toBe(0);
  });

  it('rounds percentages correctly', () => {
    const totals: DailyTargets = { calories: 1333, protein: 0, carbs: 0, fat: 0, fiber: 0 };
    const targets: DailyTargets = { calories: 2000, protein: 1, carbs: 1, fat: 1, fiber: 1 };
    const result = computePercentages(totals, targets);
    // 1333/2000*100 = 66.65 → 67
    expect(result.calories).toBe(67);
  });
});

describe('computeDailyTotals', () => {
  it('sums nutrients from multiple entries', () => {
    const foods: Food[] = [
      {
        id: 'food-1' as Food['id'],
        name: 'Chicken',
        nutrients: makeNutrients({ calories: 165, protein: 31, carbs: 0, fat: 3.6, fiber: 0 }),
        active: true,
        createdAt: dt('2026-03-01T00:00:00.000Z'),
      },
    ];

    const entries: DiaryEntry[] = [
      {
        type: 'food',
        id: 'entry-1' as DiaryEntry['id'],
        date: d('2026-03-14'),
        foodId: 'food-1' as Food['id'],
        grams: 200,
        createdAt: dt('2026-03-14T12:00:00.000Z'),
      },
      {
        type: 'quick',
        id: 'entry-2' as DiaryEntry['id'],
        date: d('2026-03-14'),
        description: 'Rice',
        grams: 100,
        nutrients: makeNutrients({ calories: 130, protein: 2.7, carbs: 28, fat: 0.3, fiber: 0.4 }),
        createdAt: dt('2026-03-14T12:00:00.000Z'),
      },
    ];

    const result = computeDailyTotals(entries, foods);
    // Chicken 200g: calories=330, protein=62
    // Rice 100g: calories=130, protein=2.7
    expect(result.calories).toBe(460);
    expect(result.protein).toBeCloseTo(64.7);
  });

  it('returns zeros when no entries', () => {
    const result = computeDailyTotals([], []);
    expect(result.calories).toBe(0);
    expect(result.protein).toBe(0);
    expect(result.carbs).toBe(0);
    expect(result.fat).toBe(0);
    expect(result.fiber).toBe(0);
  });

  it('skips food entries with unknown foodId', () => {
    const entries: DiaryEntry[] = [
      {
        type: 'food',
        id: 'entry-1' as DiaryEntry['id'],
        date: d('2026-03-14'),
        foodId: 'nonexistent' as Food['id'],
        grams: 200,
        createdAt: dt('2026-03-14T12:00:00.000Z'),
      },
    ];
    const result = computeDailyTotals(entries, []);
    expect(result.calories).toBe(0);
    expect(result.protein).toBe(0);
  });

  it('handles only quick entries (no food bank needed)', () => {
    const entries: DiaryEntry[] = [
      {
        type: 'quick',
        id: 'e1' as DiaryEntry['id'],
        date: d('2026-03-14'),
        description: 'Protein shake',
        grams: 300,
        nutrients: makeNutrients({ calories: 50, protein: 10, carbs: 5, fat: 1, fiber: 0 }),
        createdAt: dt('2026-03-14T08:00:00.000Z'),
      },
      {
        type: 'quick',
        id: 'e2' as DiaryEntry['id'],
        date: d('2026-03-14'),
        description: 'Banana',
        grams: 120,
        nutrients: makeNutrients({ calories: 89, protein: 1.1, carbs: 23, fat: 0.3, fiber: 2.6 }),
        createdAt: dt('2026-03-14T10:00:00.000Z'),
      },
    ];
    const result = computeDailyTotals(entries, []);
    // Shake 300g: cal=150, prot=30, carbs=15, fat=3
    // Banana 120g: cal=106.8, prot=1.32, carbs=27.6, fat=0.36
    expect(result.calories).toBeCloseTo(256.8);
    expect(result.protein).toBeCloseTo(31.32);
    expect(result.carbs).toBeCloseTo(42.6);
  });

  it('sums micronutrients when present', () => {
    const foods: Food[] = [
      {
        id: 'f1' as Food['id'],
        name: 'Milk',
        nutrients: makeNutrients({ calories: 42, protein: 3.4, carbs: 5, fat: 1, fiber: 0, calcium: 125, vitaminD: 1.5 }),
        active: true,
        createdAt: dt('2026-03-01T00:00:00.000Z'),
      },
    ];
    const entries: DiaryEntry[] = [
      {
        type: 'food',
        id: 'e1' as DiaryEntry['id'],
        date: d('2026-03-14'),
        foodId: 'f1' as Food['id'],
        grams: 200,
        createdAt: dt('2026-03-14T08:00:00.000Z'),
      },
    ];
    const result = computeDailyTotals(entries, foods);
    expect(result.calcium).toBe(250);     // 125 * 2
    expect(result.vitaminD).toBe(3);      // 1.5 * 2
  });
});
