import { describe, expect, it } from 'vitest';
import {
  GameArraySchema,
  GameSchema,
  SteamLibrarySettingsSchema,
  SteamSyncResultSchema,
} from './game.js';

const game = {
  id: 'steam:10',
  source: 'steam',
  steamAppId: 10,
  name: 'Half-Life',
  playtimeMinutes: 120,
  iconHash: 'icon',
  logoHash: 'logo',
  lastImportedAt: '2026-04-01T10:00:00.000Z',
};

describe('game schemas', () => {
  it('accepts games, settings and sync results', () => {
    expect(GameSchema.parse(game)).toMatchObject({ steamAppId: 10, source: 'steam' });
    expect(GameArraySchema.parse([game])).toHaveLength(1);
    expect(SteamLibrarySettingsSchema.parse({
      apiKey: 'key',
      profile: '76561198000000000',
      resolvedSteamId: '76561198000000000',
      lastSyncedAt: '2026-04-01T10:00:00.000Z',
    })).toMatchObject({ profile: '76561198000000000' });
    expect(SteamSyncResultSchema.parse({
      games: [game],
      importedCount: 1,
      syncedAt: '2026-04-01T10:00:00.000Z',
      resolvedSteamId: '76561198000000000',
    })).toMatchObject({ importedCount: 1 });
  });

  it('accepts minimal settings without sync metadata', () => {
    expect(SteamLibrarySettingsSchema.safeParse({ apiKey: 'key', profile: 'gaben' }).success).toBe(true);
  });

  it('rejects invalid game and steam settings fields', () => {
    expect(GameSchema.safeParse({ ...game, source: 'gog' }).success).toBe(false);
    expect(GameSchema.safeParse({ ...game, steamAppId: 0 }).success).toBe(false);
    expect(GameSchema.safeParse({ ...game, name: '' }).success).toBe(false);
    expect(GameSchema.safeParse({ ...game, playtimeMinutes: -1 }).success).toBe(false);
    expect(GameSchema.safeParse({ ...game, lastImportedAt: '2026-04-01' }).success).toBe(false);
    expect(SteamLibrarySettingsSchema.safeParse({ apiKey: '', profile: 'gaben' }).success).toBe(false);
    expect(SteamLibrarySettingsSchema.safeParse({ apiKey: 'key', profile: '', resolvedSteamId: 'abc' }).success).toBe(false);
    expect(SteamSyncResultSchema.safeParse({
      games: [game],
      importedCount: -1,
      syncedAt: '2026-04-01T10:00:00.000Z',
      resolvedSteamId: 'abc',
    }).success).toBe(false);
  });
});
