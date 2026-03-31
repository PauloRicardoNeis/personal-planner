#!/usr/bin/env npx tsx
/**
 * Import foods from a JSON file into the planner-app backend.
 *
 * Usage:
 *   npx tsx scripts/import-foods.ts <path-to-foods.json>
 *
 * The JSON file must be an array of FoodInput objects.
 * Required fields per item: name, nutrients.calories, nutrients.protein,
 *   nutrients.carbs, nutrients.fat, nutrients.fiber
 *
 * The API URL defaults to http://localhost:3001 and can be overridden
 * via the API_URL environment variable.
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const API_URL = process.env['API_URL'] ?? 'http://localhost:3001';

interface NutrientsPer100g {
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
  folate?: number;
  vitaminB6?: number;
  vitaminE?: number;
  vitaminK?: number;
  iodine?: number;
  selenium?: number;
  choline?: number;
}

interface FoodInput {
  name: string;
  brand?: string;
  category?: string;
  servingDescription?: string;
  servingGrams?: number;
  nutrients: NutrientsPer100g;
}

function validate(item: unknown, index: number): item is FoodInput {
  if (typeof item !== 'object' || item === null) {
    console.error(`  [${index}] ✗ não é um objeto`);
    return false;
  }
  const obj = item as Record<string, unknown>;
  if (typeof obj['name'] !== 'string' || obj['name'].trim() === '') {
    console.error(`  [${index}] ✗ campo "name" obrigatório`);
    return false;
  }
  const n = obj['nutrients'];
  if (typeof n !== 'object' || n === null) {
    console.error(`  [${index}] ✗ campo "nutrients" obrigatório`);
    return false;
  }
  const nutrients = n as Record<string, unknown>;
  for (const field of ['calories', 'protein', 'carbs', 'fat', 'fiber']) {
    if (typeof nutrients[field] !== 'number') {
      console.error(`  [${index}] ✗ nutrients.${field} obrigatório (number)`);
      return false;
    }
  }
  return true;
}

async function importFood(food: FoodInput): Promise<void> {
  const res = await fetch(`${API_URL}/foods`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(food),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`HTTP ${res.status}: ${body}`);
  }
}

async function main(): Promise<void> {
  const filePath = process.argv[2];
  if (!filePath) {
    console.error('Uso: npx tsx scripts/import-foods.ts <arquivo.json>');
    process.exit(1);
  }

  let raw: unknown;
  try {
    raw = JSON.parse(readFileSync(resolve(filePath), 'utf-8'));
  } catch (err) {
    console.error(`Erro ao ler "${filePath}": ${err instanceof Error ? err.message : err}`);
    process.exit(1);
  }

  if (!Array.isArray(raw)) {
    console.error('O JSON deve ser um array de alimentos.');
    process.exit(1);
  }

  console.log(`Importando ${raw.length} alimento(s) para ${API_URL}...\n`);

  let ok = 0;
  let fail = 0;

  for (let i = 0; i < raw.length; i++) {
    const item = raw[i];
    if (!validate(item, i)) {
      fail++;
      continue;
    }
    try {
      await importFood(item);
      console.log(`  [${i}] ✓ ${item.name}`);
      ok++;
    } catch (err) {
      console.error(`  [${i}] ✗ ${item.name} — ${err instanceof Error ? err.message : err}`);
      fail++;
    }
  }

  console.log(`\nConcluído: ${ok} criado(s), ${fail} falha(s).`);
  if (fail > 0) process.exit(1);
}

main();
