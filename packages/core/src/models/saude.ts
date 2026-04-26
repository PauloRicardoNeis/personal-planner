import { z } from 'zod';
import {
  ISODateSchema,
  ISODateTimeSchema,
  RecurrenceConfigSchema,
  type ISODate,
  type ISODateTime,
  type RecurrenceConfig,
  type SaudeEventId,
  type SaudeItemId,
} from './shared.js';

export type SaudeItemType =
  | 'consulta'
  | 'exame'
  | 'retorno'
  | 'medicacao'
  | 'compra_medicacao';

export type SaudeEventKind = 'completed' | 'purchased' | 'note';
export type SaudeIntervalUnit = 'days' | 'weeks' | 'months';

export type SaudeSchedule =
  | { mode: 'once'; date: ISODate }
  | { mode: 'calendar_rule'; recurrence: RecurrenceConfig }
  | { mode: 'after_completion_interval'; unit: SaudeIntervalUnit; value: number; anchorDate?: ISODate }
  | { mode: 'manual_next_date'; nextDate?: ISODate };

export interface SaudeEvent {
  id: SaudeEventId;
  kind: SaudeEventKind;
  date: ISODate;
  createdAt: ISODateTime;
  notes?: string;
  cost?: number;
}

export interface SaudeItem {
  id: SaudeItemId;
  type: SaudeItemType;
  title: string;
  specialty?: string;
  providerName?: string;
  clinicName?: string;
  location?: string;
  notes?: string;
  costEstimate?: number;
  priority: 'low' | 'medium' | 'high';
  active: boolean;
  createdAt: ISODateTime;
  schedule: SaudeSchedule;
  lastCompletedAt?: ISODateTime;
  events: SaudeEvent[];
}

export interface SaudeItemInput {
  type: SaudeItemType;
  title: string;
  specialty?: string;
  providerName?: string;
  clinicName?: string;
  location?: string;
  notes?: string;
  costEstimate?: number;
  priority: 'low' | 'medium' | 'high';
  schedule: SaudeSchedule;
}

export type SaudeItemPatch = Partial<SaudeItemInput & { active: boolean }>;

export interface SaudeEventInput {
  kind: SaudeEventKind;
  date: ISODate;
  notes?: string;
  cost?: number;
}

export const SaudeItemTypeSchema = z.enum([
  'consulta',
  'exame',
  'retorno',
  'medicacao',
  'compra_medicacao',
]);

export const SaudeEventKindSchema = z.enum(['completed', 'purchased', 'note']);
export const SaudeIntervalUnitSchema = z.enum(['days', 'weeks', 'months']);

export const SaudeScheduleSchema = z.discriminatedUnion('mode', [
  z.object({
    mode: z.literal('once'),
    date: ISODateSchema,
  }),
  z.object({
    mode: z.literal('calendar_rule'),
    recurrence: RecurrenceConfigSchema,
  }),
  z.object({
    mode: z.literal('after_completion_interval'),
    unit: SaudeIntervalUnitSchema,
    value: z.number().int().positive(),
    anchorDate: ISODateSchema.optional(),
  }),
  z.object({
    mode: z.literal('manual_next_date'),
    nextDate: ISODateSchema.optional(),
  }),
]);

export const SaudeEventSchema = z.object({
  id: z.string(),
  kind: SaudeEventKindSchema,
  date: ISODateSchema,
  createdAt: ISODateTimeSchema,
  notes: z.string().optional(),
  cost: z.number().nonnegative().optional(),
});

export const SaudeItemSchema = z.object({
  id: z.string(),
  type: SaudeItemTypeSchema,
  title: z.string().min(1),
  specialty: z.string().optional(),
  providerName: z.string().optional(),
  clinicName: z.string().optional(),
  location: z.string().optional(),
  notes: z.string().optional(),
  costEstimate: z.number().nonnegative().optional(),
  priority: z.enum(['low', 'medium', 'high']),
  active: z.boolean(),
  createdAt: ISODateTimeSchema,
  schedule: SaudeScheduleSchema,
  lastCompletedAt: ISODateTimeSchema.optional(),
  events: z.array(SaudeEventSchema),
});

export const SaudeItemArraySchema = z.array(SaudeItemSchema);
