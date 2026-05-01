import { describe, expect, it } from 'vitest';
import { normalizeSteamOwnedGamesResponse, parseSteamProfile } from './steam.js';

describe('parseSteamProfile', () => {
  it('accepts a SteamID64 directly', () => {
    expect(parseSteamProfile('76561198000000000')).toEqual({
      kind: 'steamid',
      steamId: '76561198000000000',
    });
  });

  it('extracts a SteamID64 from a profiles URL', () => {
    expect(parseSteamProfile('https://steamcommunity.com/profiles/76561198000000000/')).toEqual({
      kind: 'steamid',
      steamId: '76561198000000000',
    });
  });

  it('extracts a vanity URL slug from a custom profile URL', () => {
    expect(parseSteamProfile('https://steamcommunity.com/id/gaben/')).toEqual({
      kind: 'vanity',
      vanity: 'gaben',
    });
  });

  it('returns null for blank profiles and normalizes plain vanity values', () => {
    expect(parseSteamProfile('   ')).toBeNull();
    expect(parseSteamProfile('@gaben')).toEqual({ kind: 'vanity', vanity: 'gaben' });
    expect(parseSteamProfile('https://example.com/id/gaben')).toEqual({
      kind: 'vanity',
      vanity: 'https://example.com/id/gaben',
    });
  });
});

describe('normalizeSteamOwnedGamesResponse', () => {
  it('maps and sorts valid owned games by playtime descending', () => {
    const result = normalizeSteamOwnedGamesResponse(
      {
        response: {
          game_count: 3,
          games: [
            { appid: 20, name: 'Game B', playtime_forever: 30, img_icon_url: 'icon-b' },
            { appid: 10, name: 'Game A', playtime_forever: 120, img_logo_url: 'logo-a' },
            { appid: 0, name: '', playtime_forever: 500 },
          ],
        },
      },
      '2026-04-06T12:00:00.000Z' as never,
      '76561198000000000',
    );

    expect(result.importedCount).toBe(2);
    expect(result.resolvedSteamId).toBe('76561198000000000');
    expect(result.games.map((game) => game.name)).toEqual(['Game A', 'Game B']);
    expect(result.games[0]).toMatchObject({
      source: 'steam',
      steamAppId: 10,
      playtimeMinutes: 120,
      logoHash: 'logo-a',
    });
    expect(result.games[1]).toMatchObject({
      steamAppId: 20,
      iconHash: 'icon-b',
    });
  });

  it('defaults missing playtime and games arrays', () => {
    const empty = normalizeSteamOwnedGamesResponse(
      { response: {} },
      '2026-04-06T12:00:00.000Z' as never,
      '76561198000000000',
    );

    expect(empty).toMatchObject({
      games: [],
      importedCount: 0,
      resolvedSteamId: '76561198000000000',
    });

    const withDefaultPlaytime = normalizeSteamOwnedGamesResponse(
      { response: { games: [{ appid: 1, name: 'Zero Playtime' }] } },
      '2026-04-06T12:00:00.000Z' as never,
      '76561198000000000',
    );

    expect(withDefaultPlaytime.games[0]).toMatchObject({
      name: 'Zero Playtime',
      playtimeMinutes: 0,
    });
  });

  it('sorts games alphabetically when playtime ties', () => {
    const result = normalizeSteamOwnedGamesResponse(
      {
        response: {
          games: [
            { appid: 2, name: 'Beta', playtime_forever: 60 },
            { appid: 1, name: 'Alpha', playtime_forever: 60 },
          ],
        },
      },
      '2026-04-06T12:00:00.000Z' as never,
      '76561198000000000',
    );

    expect(result.games.map((game) => game.name)).toEqual(['Alpha', 'Beta']);
  });
});
