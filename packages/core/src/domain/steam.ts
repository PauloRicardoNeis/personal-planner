import { z } from 'zod';
import type { Game, SteamSyncResult } from '../models/game.js';
import type { GameId, ISODateTime } from '../models/shared.js';

const SteamOwnedGameSchema = z.object({
  appid: z.number().int().nonnegative(),
  name: z.string().default(''),
  playtime_forever: z.number().nonnegative().optional(),
  img_icon_url: z.string().optional(),
  img_logo_url: z.string().optional(),
});

const SteamOwnedGamesResponseSchema = z.object({
  response: z.object({
    game_count: z.number().int().nonnegative().optional(),
    games: z.array(SteamOwnedGameSchema).optional(),
  }),
});

export type ParsedSteamProfile =
  | { kind: 'steamid'; steamId: string }
  | { kind: 'vanity'; vanity: string };

export function parseSteamProfile(profile: string): ParsedSteamProfile | null {
  const trimmed = profile.trim();
  if (!trimmed) return null;

  try {
    const url = new URL(trimmed);
    const parts = url.pathname.split('/').filter(Boolean);
    if (url.hostname.includes('steamcommunity.com')) {
      if (parts[0] === 'profiles' && parts[1] && /^\d+$/.test(parts[1])) {
        return { kind: 'steamid', steamId: parts[1] };
      }
      if (parts[0] === 'id' && parts[1]) {
        return { kind: 'vanity', vanity: parts[1] };
      }
    }
  } catch {
    // Not a URL, continue with plain value parsing.
  }

  if (/^\d+$/.test(trimmed)) {
    return { kind: 'steamid', steamId: trimmed };
  }

  return { kind: 'vanity', vanity: trimmed.replace(/^@/, '') };
}

export function normalizeSteamOwnedGamesResponse(
  payload: unknown,
  importedAt: ISODateTime,
  resolvedSteamId: string,
): SteamSyncResult {
  const parsed = SteamOwnedGamesResponseSchema.parse(payload);

  const games: Game[] = (parsed.response.games ?? [])
    .filter((game) => game.appid > 0 && game.name.trim().length > 0)
    .map((game) => ({
      id: `steam:${game.appid}` as GameId,
      source: 'steam' as const,
      steamAppId: game.appid,
      name: game.name,
      playtimeMinutes: Math.round(game.playtime_forever ?? 0),
      ...(game.img_icon_url ? { iconHash: game.img_icon_url } : {}),
      ...(game.img_logo_url ? { logoHash: game.img_logo_url } : {}),
      lastImportedAt: importedAt,
    }))
    .sort((a, b) => b.playtimeMinutes - a.playtimeMinutes || a.name.localeCompare(b.name));

  return {
    games,
    importedCount: games.length,
    syncedAt: importedAt,
    resolvedSteamId,
  };
}
