import { z } from 'zod';
import { ISODateTimeSchema, type GameId, type ISODateTime } from './shared.js';

export interface Game {
  id: GameId;
  source: 'steam';
  steamAppId: number;
  name: string;
  playtimeMinutes: number;
  iconHash?: string;
  logoHash?: string;
  lastImportedAt: ISODateTime;
}

export type SteamLibrarySettingsInput = {
  apiKey: string;
  profile: string;
};

export interface SteamLibrarySettings {
  apiKey: string;
  profile: string;
  resolvedSteamId?: string;
  lastSyncedAt?: ISODateTime;
}

export interface SteamSyncResult {
  games: Game[];
  importedCount: number;
  syncedAt: ISODateTime;
  resolvedSteamId: string;
}

export const GameSchema = z.object({
  id: z.string(),
  source: z.literal('steam'),
  steamAppId: z.number().int().positive(),
  name: z.string().min(1),
  playtimeMinutes: z.number().int().nonnegative(),
  iconHash: z.string().optional(),
  logoHash: z.string().optional(),
  lastImportedAt: ISODateTimeSchema,
});

export const GameArraySchema = z.array(GameSchema);

export const SteamLibrarySettingsSchema = z.object({
  apiKey: z.string().min(1),
  profile: z.string().min(1),
  resolvedSteamId: z.string().regex(/^\d+$/).optional(),
  lastSyncedAt: ISODateTimeSchema.optional(),
});

export const SteamSyncResultSchema = z.object({
  games: GameArraySchema,
  importedCount: z.number().int().nonnegative(),
  syncedAt: ISODateTimeSchema,
  resolvedSteamId: z.string().regex(/^\d+$/),
});
