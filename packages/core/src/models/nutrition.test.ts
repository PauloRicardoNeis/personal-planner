import { describe, expect, it } from 'vitest';
import {
  DiaryEntryArraySchema,
  DiaryEntrySchema,
  FoodArraySchema,
  FoodDiaryEntrySchema,
  FoodSchema,
  NutrientsPer100gSchema,
  NutritionProfileSchema,
  QuickDiaryEntrySchema,
} from './nutrition.js';

const nutrients = {
  calories: 100,
  protein: 10,
  carbs: 12,
  fat: 3,
  fiber: 2,
  saturatedFat: 1,
  transFat: 0,
  sugar: 4,
  sodium: 120,
  potassium: 200,
  calcium: 40,
  iron: 2,
  vitaminA: 1,
  vitaminC: 2,
  vitaminD: 3,
  vitaminB12: 4,
  magnesium: 5,
  zinc: 6,
  omega3: 7,
  cholesterol: 8,
  folate: 9,
  vitaminB6: 10,
  vitaminE: 11,
  vitaminK: 12,
  iodine: 13,
  selenium: 14,
  choline: 15,
};

const food = {
  id: 'food-1',
  name: 'Iogurte',
  brand: 'Marca',
  category: 'Laticinios',
  servingDescription: '1 pote',
  servingGrams: 170,
  nutrients,
  active: true,
  createdAt: '2026-04-01T10:00:00.000Z',
};

const foodEntry = {
  type: 'food',
  id: 'entry-1',
  date: '2026-04-10',
  foodId: 'food-1',
  grams: 170,
  meal: 'breakfast',
  createdAt: '2026-04-10T10:00:00.000Z',
};

const quickEntry = {
  type: 'quick',
  id: 'entry-2',
  date: '2026-04-10',
  description: 'Snack',
  grams: 50,
  nutrients,
  meal: 'snack',
  createdAt: '2026-04-10T12:00:00.000Z',
};

describe('nutrition schemas', () => {
  it('accepts nutrients with all optional micronutrients', () => {
    expect(NutrientsPer100gSchema.parse(nutrients)).toEqual(nutrients);
  });

  it('accepts food and diary entries', () => {
    expect(FoodSchema.parse(food)).toMatchObject({ name: 'Iogurte', active: true });
    expect(FoodArraySchema.parse([food])).toHaveLength(1);
    expect(FoodDiaryEntrySchema.parse(foodEntry)).toMatchObject({ type: 'food', foodId: 'food-1' });
    expect(QuickDiaryEntrySchema.parse(quickEntry)).toMatchObject({ type: 'quick', description: 'Snack' });
    expect(DiaryEntrySchema.parse(foodEntry)).toMatchObject({ id: 'entry-1' });
    expect(DiaryEntrySchema.parse(quickEntry)).toMatchObject({ id: 'entry-2' });
    expect(DiaryEntryArraySchema.parse([foodEntry, quickEntry])).toHaveLength(2);
  });

  it('accepts nutrition profiles with custom targets', () => {
    expect(NutritionProfileSchema.parse({
      weightKg: 80,
      goalType: 'maintain',
      customTargets: {
        calories: 2400,
        protein: 160,
        fiber: 30,
        sodium: 2300,
        choline: 550,
      },
    })).toMatchObject({ weightKg: 80, goalType: 'maintain' });
  });

  it('rejects invalid nutrition payloads', () => {
    expect(NutrientsPer100gSchema.safeParse({ ...nutrients, calories: '100' }).success).toBe(false);
    expect(FoodSchema.safeParse({ ...food, name: '' }).success).toBe(false);
    expect(FoodSchema.safeParse({ ...food, createdAt: '2026-04-01' }).success).toBe(false);
    expect(DiaryEntrySchema.safeParse({ ...foodEntry, type: 'unknown' }).success).toBe(false);
    expect(DiaryEntrySchema.safeParse({ ...foodEntry, date: '10/04/2026' }).success).toBe(false);
    expect(QuickDiaryEntrySchema.safeParse({ ...quickEntry, description: '' }).success).toBe(false);
    expect(NutritionProfileSchema.safeParse({ weightKg: 0, goalType: 'maintain' }).success).toBe(false);
    expect(NutritionProfileSchema.safeParse({ weightKg: 80, goalType: 'recomp' }).success).toBe(false);
    expect(NutritionProfileSchema.safeParse({
      weightKg: 80,
      goalType: 'cut',
      customTargets: { calories: 'many' },
    }).success).toBe(false);
  });
});
