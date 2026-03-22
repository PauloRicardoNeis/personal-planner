import { z } from 'zod';
import {
  ISODateSchema,
  ISODateTimeSchema,
  RecurrenceConfigSchema,
  type DeverId,
  type ISODate,
  type ISODateTime,
  type RecurrenceConfig,
} from './shared.js';

// ── Interfaces ────────────────────────────────────────────────────────────────

export interface DeverCompletion {
  /** The scheduled occurrence date (deadline for once, calculated date for cyclic) */
  occurrenceDate: ISODate;
  /** When the user marked this occurrence as done */
  completedAt: ISODateTime;
}

export interface DeverBase {
  id: DeverId;
  title: string;
  area?: string;
  priority: 'low' | 'medium' | 'high';
  active: boolean;
  createdAt: ISODateTime;
  completions: DeverCompletion[];
}

export interface OnceDever extends DeverBase {
  type: 'once';
  /** Required for once deveres — TypeScript enforces this via the union */
  deadline: ISODate;
}

export interface CyclicDever extends DeverBase {
  type: 'cyclic';
  /** Required for cyclic deveres — TypeScript enforces this via the union */
  recurrence: RecurrenceConfig;
}

export type Dever = OnceDever | CyclicDever;

export type DeverInput =
  | {
      type: 'once';
      title: string;
      deadline: ISODate;
      area?: string;
      priority: 'low' | 'medium' | 'high';
    }
  | {
      type: 'cyclic';
      title: string;
      recurrence: RecurrenceConfig;
      area?: string;
      priority: 'low' | 'medium' | 'high';
    };

// ── Zod schemas ───────────────────────────────────────────────────────────────
// Zod infers plain `string` — the adapter casts to branded types via `as unknown as Dever`

const DeverCompletionSchema = z.object({
  occurrenceDate: ISODateSchema,
  completedAt: ISODateTimeSchema,
});

const DeverBaseSchema = z.object({
  id: z.string(),
  title: z.string().min(1),
  area: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high']),
  active: z.boolean(),
  createdAt: ISODateTimeSchema,
  completions: z.array(DeverCompletionSchema),
});

export const OnceDeverSchema = DeverBaseSchema.extend({
  type: z.literal('once'),
  deadline: ISODateSchema,
});

export const CyclicDeverSchema = DeverBaseSchema.extend({
  type: z.literal('cyclic'),
  recurrence: RecurrenceConfigSchema,
});

export const DeverSchema = z.discriminatedUnion('type', [
  OnceDeverSchema,
  CyclicDeverSchema,
]);

export const DeverArraySchema = z.array(DeverSchema);

export type DeverRaw = z.infer<typeof DeverSchema>;
