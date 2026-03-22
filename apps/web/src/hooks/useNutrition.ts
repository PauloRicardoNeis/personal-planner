import { useState, useEffect, useCallback } from 'react';
import type {
  DailyNutritionSummary,
  DiaryEntry,
  DiaryEntryInput,
  Food,
  FoodInput,
  FoodId,
  DiaryEntryId,
  NutritionProfile,
  ISODate,
} from '@planner/core';
import { adapter } from '../adapter.js';

// ── useFoods ────────────────────────────────────────────────────────────────

type FoodsState =
  | { status: 'loading' }
  | { status: 'ok'; foods: Food[] }
  | { status: 'error'; message: string };

export function useFoods() {
  const [state, setState] = useState<FoodsState>({ status: 'loading' });

  const load = useCallback(async () => {
    const result = await adapter.getFoods();
    if (result.ok) {
      setState({ status: 'ok', foods: result.data });
    } else {
      setState({ status: 'error', message: result.error });
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const createFood = useCallback(async (input: FoodInput) => {
    await adapter.createFood(input);
    void load();
  }, [load]);

  const updateFood = useCallback(async (id: FoodId, patch: Partial<FoodInput & { active: boolean }>) => {
    await adapter.updateFood(id, patch);
    void load();
  }, [load]);

  const archiveFood = useCallback(async (id: FoodId) => {
    await adapter.archiveFood(id);
    void load();
  }, [load]);

  return { state, createFood, updateFood, archiveFood };
}

// ── useDiary ────────────────────────────────────────────────────────────────

type DiaryState =
  | { status: 'loading' }
  | { status: 'ok'; entries: DiaryEntry[] }
  | { status: 'error'; message: string };

export function useDiary(date: ISODate) {
  const [state, setState] = useState<DiaryState>({ status: 'loading' });

  const load = useCallback(async () => {
    const result = await adapter.getDiaryEntries(date);
    if (result.ok) {
      setState({ status: 'ok', entries: result.data });
    } else {
      setState({ status: 'error', message: result.error });
    }
  }, [date]);

  useEffect(() => { void load(); }, [load]);

  const createEntry = useCallback(async (input: DiaryEntryInput) => {
    await adapter.createDiaryEntry({ ...input, date });
    void load();
  }, [date, load]);

  const updateEntry = useCallback(async (id: DiaryEntryId, patch: { grams?: number; meal?: string }) => {
    await adapter.updateDiaryEntry(id, patch);
    void load();
  }, [load]);

  const deleteEntry = useCallback(async (id: DiaryEntryId) => {
    await adapter.deleteDiaryEntry(id);
    void load();
  }, [load]);

  return { state, createEntry, updateEntry, deleteEntry };
}

// ── useNutritionProfile ─────────────────────────────────────────────────────

type ProfileState =
  | { status: 'loading' }
  | { status: 'ok'; profile: NutritionProfile | null }
  | { status: 'error'; message: string };

export function useNutritionProfile() {
  const [state, setState] = useState<ProfileState>({ status: 'loading' });

  const load = useCallback(async () => {
    const result = await adapter.getNutritionProfile();
    if (result.ok) {
      setState({ status: 'ok', profile: result.data });
    } else {
      setState({ status: 'error', message: result.error });
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const save = useCallback(async (profile: NutritionProfile) => {
    await adapter.saveNutritionProfile(profile);
    void load();
  }, [load]);

  return { state, save };
}

// ── useNutritionSummary ─────────────────────────────────────────────────────

type SummaryState =
  | { status: 'loading' }
  | { status: 'ok'; summary: DailyNutritionSummary }
  | { status: 'error'; message: string };

export function useNutritionSummary(date: ISODate) {
  const [state, setState] = useState<SummaryState>({ status: 'loading' });

  const load = useCallback(async () => {
    const result = await adapter.getNutritionSummary(date);
    if (result.ok) {
      setState({ status: 'ok', summary: result.data });
    } else {
      setState({ status: 'error', message: result.error });
    }
  }, [date]);

  useEffect(() => { void load(); }, [load]);

  return { state, reload: load };
}
