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
  /** When the dever enters its active window. Defaults to createdAt if not provided. */
  inicio: ISODateTime;
  /** End date of the active window (date only). If absent, no expiry (cyclic). */
  fim?: ISODate;
  completions: DeverCompletion[];
}

export interface OnceDever extends DeverBase {
  type: 'once';
  /** Deadline date. When absent the dever is "indefinite" — shown daily until completed. */
  fim?: ISODate;
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
      /** When omitted the dever is indefinite — no deadline. */
      fim?: ISODate;
      inicio?: ISODateTime;
      area?: string;
      priority: 'low' | 'medium' | 'high';
    }
  | {
      type: 'cyclic';
      title: string;
      recurrence: RecurrenceConfig;
      inicio?: ISODateTime;
      fim?: ISODate;
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
  // inicio optional in schema to handle legacy data (migration in adapter)
  inicio: ISODateTimeSchema.optional(),
  // fim and legacy deadline both date-only; fim takes precedence
  fim: ISODateSchema.optional(),
  // Legacy field — kept in schema so old data parses; adapter migrates to fim
  deadline: ISODateSchema.optional(),
  completions: z.array(DeverCompletionSchema),
});

export const OnceDeverSchema = DeverBaseSchema.extend({
  type: z.literal('once'),
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
