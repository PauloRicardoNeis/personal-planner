import { z } from 'zod';
import { ISODateSchema, ISODateTimeSchema, type HabitId, type ISODate, type ISODateTime } from './shared.js';

// ── Interface ─────────────────────────────────────────────────────────────────

export interface Habit {
  id: HabitId;
  title: string;
  category?: string;
  active: boolean;
  createdAt: ISODateTime;
  /**
   * Sparse map of completed dates.
   * habit.completions["2026-03-10"] === true → done that day
   * habit.completions["2026-03-10"] === undefined → not done
   * Only truthy values are stored — absence means not done.
   */
  completions: Record<ISODate, true>;
}

export type HabitInput = {
  title: string;
  category?: string;
};

// ── Zod schema ────────────────────────────────────────────────────────────────
// Zod infers plain `string` — the adapter casts to branded types via `as unknown as Habit`

export const HabitSchema = z.object({
  id: z.string(),
  title: z.string().min(1),
  category: z.string().optional(),
  active: z.boolean(),
  createdAt: ISODateTimeSchema,
  completions: z.record(ISODateSchema, z.literal(true)),
});

export const HabitArraySchema = z.array(HabitSchema);

export type HabitRaw = z.infer<typeof HabitSchema>;
