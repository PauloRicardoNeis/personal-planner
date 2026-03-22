import { z } from 'zod';
import { ISODateSchema, ISODateTimeSchema, type ISODate, type ISODateTime } from './shared.js';

// ── Branded types ────────────────────────────────────────────────────────────

export type FoodId = string & { readonly __brand: 'FoodId' };
export type DiaryEntryId = string & { readonly __brand: 'DiaryEntryId' };

// ── NutrientsPer100g ─────────────────────────────────────────────────────────

export interface NutrientsPer100g {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  saturatedFat?: number;
  transFat?: number;
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

export const NutrientsPer100gSchema = z.object({
  calories: z.number(),
  protein: z.number(),
  carbs: z.number(),
  fat: z.number(),
  fiber: z.number(),
  saturatedFat: z.number().optional(),
  transFat: z.number().optional(),
  sugar: z.number().optional(),
  sodium: z.number().optional(),
  potassium: z.number().optional(),
  calcium: z.number().optional(),
  iron: z.number().optional(),
  vitaminA: z.number().optional(),
  vitaminC: z.number().optional(),
  vitaminD: z.number().optional(),
  vitaminB12: z.number().optional(),
  magnesium: z.number().optional(),
  zinc: z.number().optional(),
  omega3: z.number().optional(),
  cholesterol: z.number().optional(),
});

// ── Food ─────────────────────────────────────────────────────────────────────

export interface Food {
  id: FoodId;
  name: string;
  brand?: string;
  category?: string;
  servingDescription?: string;
  servingGrams?: number;
  nutrients: NutrientsPer100g;
  active: boolean;
  createdAt: ISODateTime;
}

export type FoodInput = {
  name: string;
  brand?: string;
  category?: string;
  servingDescription?: string;
  servingGrams?: number;
  nutrients: NutrientsPer100g;
};

export const FoodSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  brand: z.string().optional(),
  category: z.string().optional(),
  servingDescription: z.string().optional(),
  servingGrams: z.number().optional(),
  nutrients: NutrientsPer100gSchema,
  active: z.boolean(),
  createdAt: ISODateTimeSchema,
});

export const FoodArraySchema = z.array(FoodSchema);

// ── Diary entries ────────────────────────────────────────────────────────────

export interface FoodDiaryEntry {
  type: 'food';
  id: DiaryEntryId;
  date: ISODate;
  foodId: FoodId;
  grams: number;
  meal?: string;
  createdAt: ISODateTime;
}

export interface QuickDiaryEntry {
  type: 'quick';
  id: DiaryEntryId;
  date: ISODate;
  description: string;
  grams: number;
  nutrients: NutrientsPer100g;
  meal?: string;
  createdAt: ISODateTime;
}

export type DiaryEntry = FoodDiaryEntry | QuickDiaryEntry;

export type DiaryEntryInput =
  | { type: 'food'; foodId: FoodId; grams: number; meal?: string }
  | { type: 'quick'; description: string; grams: number; nutrients: NutrientsPer100g; meal?: string };

export const FoodDiaryEntrySchema = z.object({
  type: z.literal('food'),
  id: z.string(),
  date: ISODateSchema,
  foodId: z.string(),
  grams: z.number(),
  meal: z.string().optional(),
  createdAt: ISODateTimeSchema,
});

export const QuickDiaryEntrySchema = z.object({
  type: z.literal('quick'),
  id: z.string(),
  date: ISODateSchema,
  description: z.string().min(1),
  grams: z.number(),
  nutrients: NutrientsPer100gSchema,
  meal: z.string().optional(),
  createdAt: ISODateTimeSchema,
});

export const DiaryEntrySchema = z.discriminatedUnion('type', [
  FoodDiaryEntrySchema,
  QuickDiaryEntrySchema,
]);

export const DiaryEntryArraySchema = z.array(DiaryEntrySchema);

// ── Nutrition Profile ────────────────────────────────────────────────────────

export interface NutritionProfile {
  weightKg: number;
  goalType: 'cut' | 'maintain' | 'bulk';
  customTargets?: Partial<DailyTargets>;
}

export interface DailyTargets {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
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

export const NutritionProfileSchema = z.object({
  weightKg: z.number().positive(),
  goalType: z.enum(['cut', 'maintain', 'bulk']),
  customTargets: z.object({
    calories: z.number().optional(),
    protein: z.number().optional(),
    carbs: z.number().optional(),
    fat: z.number().optional(),
    fiber: z.number().optional(),
    saturatedFat: z.number().optional(),
    sugar: z.number().optional(),
    sodium: z.number().optional(),
    potassium: z.number().optional(),
    calcium: z.number().optional(),
    iron: z.number().optional(),
    vitaminA: z.number().optional(),
    vitaminC: z.number().optional(),
    vitaminD: z.number().optional(),
    vitaminB12: z.number().optional(),
    magnesium: z.number().optional(),
    zinc: z.number().optional(),
    omega3: z.number().optional(),
    cholesterol: z.number().optional(),
  }).optional(),
});

// ── Daily Nutrition Summary ──────────────────────────────────────────────────

export interface DailyNutritionSummary {
  date: ISODate;
  entries: DiaryEntry[];
  totals: DailyTargets;
  targets: DailyTargets;
  percentages: Record<keyof DailyTargets, number>;
}
