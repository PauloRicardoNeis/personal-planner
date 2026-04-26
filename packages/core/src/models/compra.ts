import { z } from 'zod';
import {
  ISODateSchema,
  ISODateTimeSchema,
  type CompraItemId,
  type ISODate,
  type ISODateTime,
  type ListaCompraId,
} from './shared.js';

export type CompraIntervalUnit = 'days' | 'weeks' | 'months';

export type CompraReminder =
  | { mode: 'none' }
  | { mode: 'manual_next_date'; nextDate?: ISODate }
  | { mode: 'after_completion_interval'; unit: CompraIntervalUnit; value: number; anchorDate?: ISODate };

export interface CompraPricePoint {
  price: number;
  date: ISODate;
  store?: string;
}

export interface CompraItem {
  id: CompraItemId;
  title: string;
  checked: boolean;
  quantity?: number;
  unit?: string;
  preferredStore?: string;
  url?: string;
  lastPrice?: number;
  targetPrice?: number;
  priceHistory?: CompraPricePoint[];
  notes?: string;
}

export interface ListaCompra {
  id: ListaCompraId;
  title: string;
  notes?: string;
  active: boolean;
  createdAt: ISODateTime;
  plannedFor?: ISODate;
  reminder: CompraReminder;
  items: CompraItem[];
  lastCompletedAt?: ISODateTime;
}

export interface ListaCompraInput {
  title: string;
  notes?: string;
  plannedFor?: ISODate;
  reminder?: CompraReminder;
}

export type ListaCompraPatch = Partial<ListaCompraInput & { active: boolean }>;

export interface CompraItemInput {
  title: string;
  quantity?: number;
  unit?: string;
  preferredStore?: string;
  url?: string;
  lastPrice?: number;
  targetPrice?: number;
  notes?: string;
}

export type CompraItemPatch = Partial<CompraItemInput & { checked: boolean }>;

export const CompraIntervalUnitSchema = z.enum(['days', 'weeks', 'months']);

export const CompraReminderSchema = z.discriminatedUnion('mode', [
  z.object({ mode: z.literal('none') }),
  z.object({
    mode: z.literal('manual_next_date'),
    nextDate: ISODateSchema.optional(),
  }),
  z.object({
    mode: z.literal('after_completion_interval'),
    unit: CompraIntervalUnitSchema,
    value: z.number().int().positive(),
    anchorDate: ISODateSchema.optional(),
  }),
]);

export const CompraPricePointSchema = z.object({
  price: z.number().nonnegative(),
  date: ISODateSchema,
  store: z.string().optional(),
});

export const CompraItemSchema = z.object({
  id: z.string(),
  title: z.string().min(1),
  checked: z.boolean(),
  quantity: z.number().positive().optional(),
  unit: z.string().optional(),
  preferredStore: z.string().optional(),
  url: z.string().url().optional(),
  lastPrice: z.number().nonnegative().optional(),
  targetPrice: z.number().nonnegative().optional(),
  priceHistory: z.array(CompraPricePointSchema).optional(),
  notes: z.string().optional(),
});

export const ListaCompraSchema = z.object({
  id: z.string(),
  title: z.string().min(1),
  notes: z.string().optional(),
  active: z.boolean(),
  createdAt: ISODateTimeSchema,
  plannedFor: ISODateSchema.optional(),
  reminder: CompraReminderSchema,
  items: z.array(CompraItemSchema),
  lastCompletedAt: ISODateTimeSchema.optional(),
});

export const ListaCompraArraySchema = z.array(ListaCompraSchema);
