import { useCallback, useEffect, useState } from 'react';
import type { Game, SteamLibrarySettings, SteamLibrarySettingsInput } from '@planner/core';
import { adapter } from '../adapter.js';

type GamesState =
  | { status: 'loading' }
  | { status: 'ok'; games: Game[]; settings: SteamLibrarySettings | null }
  | { status: 'error'; message: string };

export function useGames() {
  const [state, setState] = useState<GamesState>({ status: 'loading' });
  const [isSyncing, setIsSyncing] = useState(false);

  const load = useCallback(async () => {
    const [gamesResult, settingsResult] = await Promise.all([
      adapter.getGames(),
      adapter.getSteamLibrarySettings(),
    ]);

    if (!gamesResult.ok) {
      setState({ status: 'error', message: gamesResult.error });
      return;
    }

    if (!settingsResult.ok) {
      setState({ status: 'error', message: settingsResult.error });
      return;
    }

    setState({
      status: 'ok',
      games: gamesResult.data,
      settings: settingsResult.data,
    });
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const saveSettings = useCallback(async (settings: SteamLibrarySettingsInput) => {
    const result = await adapter.saveSteamLibrarySettings(settings);
    if (result.ok) {
      await load();
    }
    return result;
  }, [load]);

  const syncLibrary = useCallback(async () => {
    setIsSyncing(true);
    const result = await adapter.syncSteamLibrary();
    if (result.ok) {
      await load();
    }
    setIsSyncing(false);
    return result;
  }, [load]);

  return { state, saveSettings, syncLibrary, reload: load, isSyncing };
}
