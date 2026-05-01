import { describe, expect, it } from 'vitest';
import {
  EtapaSchema,
  ProjetoArraySchema,
  ProjetoSchema,
} from './projeto.js';

const etapa = {
  id: 'etapa-1',
  title: 'Planejar',
  description: 'Definir escopo',
  status: 'in_progress',
  order: 1,
  deadline: '2026-04-20',
  effortHours: 3,
  dependsOn: ['etapa-0'],
  completedAt: '2026-04-19T10:00:00.000Z',
  createdAt: '2026-04-01T10:00:00.000Z',
};

const projeto = {
  id: 'projeto-1',
  title: 'Planner',
  description: 'Melhorar app',
  area: 'dev',
  priority: 'high',
  status: 'active',
  createdAt: '2026-04-01T10:00:00.000Z',
  inicio: '2026-04-01',
  fim: '2026-04-30',
  etapas: [etapa],
};

describe('projeto schemas', () => {
  it('accepts complete etapa and projeto payloads', () => {
    expect(EtapaSchema.parse(etapa)).toMatchObject({ id: 'etapa-1', status: 'in_progress' });
    expect(ProjetoSchema.parse(projeto)).toMatchObject({ id: 'projeto-1', etapas: [expect.any(Object)] });
    expect(ProjetoArraySchema.parse([projeto])).toHaveLength(1);
  });

  it('accepts minimal projeto payloads', () => {
    expect(ProjetoSchema.safeParse({
      id: 'projeto-2',
      title: 'Projeto simples',
      priority: 'medium',
      status: 'planning',
      createdAt: '2026-04-01T10:00:00.000Z',
      etapas: [],
    }).success).toBe(true);
  });

  it('rejects invalid projeto and etapa fields', () => {
    expect(EtapaSchema.safeParse({ ...etapa, title: '' }).success).toBe(false);
    expect(EtapaSchema.safeParse({ ...etapa, status: 'waiting' }).success).toBe(false);
    expect(EtapaSchema.safeParse({ ...etapa, order: 1.5 }).success).toBe(false);
    expect(EtapaSchema.safeParse({ ...etapa, deadline: '2026/04/20' }).success).toBe(false);
    expect(EtapaSchema.safeParse({ ...etapa, effortHours: 0 }).success).toBe(false);
    expect(EtapaSchema.safeParse({ ...etapa, completedAt: '2026-04-19' }).success).toBe(false);
    expect(ProjetoSchema.safeParse({ ...projeto, priority: 'urgent' }).success).toBe(false);
    expect(ProjetoSchema.safeParse({ ...projeto, status: 'deleted' }).success).toBe(false);
    expect(ProjetoSchema.safeParse({ ...projeto, inicio: '01/04/2026' }).success).toBe(false);
  });
});
