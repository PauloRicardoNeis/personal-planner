import { z } from 'zod';
import {
  ISODateSchema,
  ISODateTimeSchema,
  type EtapaId,
  type ProjetoId,
  type ISODate,
  type ISODateTime,
} from './shared.js';

// ── Status types ─────────────────────────────────────────────────────────────

export type EtapaStatus = 'pending' | 'in_progress' | 'done' | 'blocked';
export type ProjetoStatus = 'planning' | 'active' | 'paused' | 'done' | 'archived';

// ── Interfaces ───────────────────────────────────────────────────────────────

export interface Etapa {
  id: EtapaId;
  title: string;
  description?: string;
  status: EtapaStatus;
  /** Position in the ordered list */
  order: number;
  /** Optional deadline for this specific etapa */
  deadline?: ISODate;
  /** Estimated effort in hours */
  effortHours?: number;
  /** IDs of etapas that must be 'done' before this one can start */
  dependsOn?: EtapaId[];
  /** When the etapa was marked done */
  completedAt?: ISODateTime;
  createdAt: ISODateTime;
}

export interface Projeto {
  id: ProjetoId;
  title: string;
  description?: string;
  area?: string;
  priority: 'low' | 'medium' | 'high';
  status: ProjetoStatus;
  createdAt: ISODateTime;
  /** Planned start date */
  inicio?: ISODate;
  /** Planned end/delivery date */
  fim?: ISODate;
  etapas: Etapa[];
}

// ── Input types ──────────────────────────────────────────────────────────────

export interface EtapaInput {
  title: string;
  description?: string;
  deadline?: ISODate;
  effortHours?: number;
  dependsOn?: EtapaId[];
  order?: number;
}

export interface ProjetoInput {
  title: string;
  description?: string;
  area?: string;
  priority: 'low' | 'medium' | 'high';
  inicio?: ISODate;
  fim?: ISODate;
  etapas?: EtapaInput[];
}

// ── Patch types ──────────────────────────────────────────────────────────────

export type ProjetoPatch = Partial<Pick<Projeto, 'title' | 'description' | 'area' | 'priority' | 'status' | 'inicio' | 'fim'>>;
export type EtapaPatch = Partial<Pick<Etapa, 'title' | 'description' | 'status' | 'deadline' | 'effortHours' | 'order' | 'dependsOn'>>;

// ── Zod schemas ──────────────────────────────────────────────────────────────
// Zod infers plain `string` — the adapter casts to branded types via `as unknown as T`

export const EtapaSchema = z.object({
  id: z.string(),
  title: z.string().min(1),
  description: z.string().optional(),
  status: z.enum(['pending', 'in_progress', 'done', 'blocked']),
  order: z.number().int(),
  deadline: ISODateSchema.optional(),
  effortHours: z.number().positive().optional(),
  dependsOn: z.array(z.string()).optional(),
  completedAt: ISODateTimeSchema.optional(),
  createdAt: ISODateTimeSchema,
});

export const ProjetoSchema = z.object({
  id: z.string(),
  title: z.string().min(1),
  description: z.string().optional(),
  area: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high']),
  status: z.enum(['planning', 'active', 'paused', 'done', 'archived']),
  createdAt: ISODateTimeSchema,
  inicio: ISODateSchema.optional(),
  fim: ISODateSchema.optional(),
  etapas: z.array(EtapaSchema),
});

export const ProjetoArraySchema = z.array(ProjetoSchema);

export type ProjetoRaw = z.infer<typeof ProjetoSchema>;
