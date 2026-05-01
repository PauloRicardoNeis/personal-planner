import { describe, expect, it } from 'vitest';
import {
  CompraIntervalUnitSchema,
  CompraItemSchema,
  CompraPricePointSchema,
  CompraReminderSchema,
  ListaCompraArraySchema,
  ListaCompraSchema,
} from './compra.js';

const pricePoint = {
  price: 12.5,
  date: '2026-04-01',
  store: 'Mercado',
};

const item = {
  id: 'item-1',
  title: 'Cafe',
  checked: false,
  quantity: 2,
  unit: 'pacote',
  preferredStore: 'Mercado',
  url: 'https://example.com/cafe',
  lastPrice: 12.5,
  targetPrice: 10,
  priceHistory: [pricePoint],
  notes: 'Comprar em promocao',
};

const lista = {
  id: 'lista-1',
  title: 'Reposicao',
  notes: 'Despensa',
  active: true,
  createdAt: '2026-04-01T10:00:00.000Z',
  plannedFor: '2026-04-10',
  reminder: {
    mode: 'after_completion_interval',
    unit: 'months',
    value: 1,
    anchorDate: '2026-04-01',
  },
  items: [item],
  lastCompletedAt: '2026-04-10T10:00:00.000Z',
};

describe('compra schemas', () => {
  it('accepts reminder variants and interval units', () => {
    expect(CompraIntervalUnitSchema.parse('days')).toBe('days');
    expect(CompraReminderSchema.parse({ mode: 'none' })).toEqual({ mode: 'none' });
    expect(CompraReminderSchema.parse({ mode: 'manual_next_date', nextDate: '2026-04-12' })).toEqual({
      mode: 'manual_next_date',
      nextDate: '2026-04-12',
    });
    expect(CompraReminderSchema.parse({ mode: 'after_completion_interval', unit: 'weeks', value: 2 })).toEqual({
      mode: 'after_completion_interval',
      unit: 'weeks',
      value: 2,
    });
  });

  it('accepts complete compra item and list payloads', () => {
    expect(CompraPricePointSchema.parse(pricePoint)).toEqual(pricePoint);
    expect(CompraItemSchema.parse(item)).toMatchObject({ title: 'Cafe', checked: false });
    expect(ListaCompraSchema.parse(lista)).toMatchObject({ title: 'Reposicao', items: [expect.any(Object)] });
    expect(ListaCompraArraySchema.parse([lista])).toHaveLength(1);
  });

  it('accepts minimal list payloads', () => {
    expect(ListaCompraSchema.safeParse({
      id: 'lista-2',
      title: 'Sem lembrete',
      active: true,
      createdAt: '2026-04-01T10:00:00.000Z',
      reminder: { mode: 'none' },
      items: [],
    }).success).toBe(true);
  });

  it('rejects invalid compra payloads', () => {
    expect(CompraReminderSchema.safeParse({ mode: 'manual_next_date', nextDate: 'tomorrow' }).success).toBe(false);
    expect(CompraReminderSchema.safeParse({ mode: 'after_completion_interval', unit: 'years', value: 1 }).success).toBe(false);
    expect(CompraReminderSchema.safeParse({ mode: 'after_completion_interval', unit: 'days', value: 0 }).success).toBe(false);
    expect(CompraPricePointSchema.safeParse({ ...pricePoint, price: -1 }).success).toBe(false);
    expect(CompraItemSchema.safeParse({ ...item, title: '' }).success).toBe(false);
    expect(CompraItemSchema.safeParse({ ...item, quantity: 0 }).success).toBe(false);
    expect(CompraItemSchema.safeParse({ ...item, url: 'not-a-url' }).success).toBe(false);
    expect(ListaCompraSchema.safeParse({ ...lista, plannedFor: '10/04/2026' }).success).toBe(false);
  });
});
