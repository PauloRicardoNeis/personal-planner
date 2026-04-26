import { useCallback, useEffect, useState } from 'react';
import type {
  SaudeEventInput,
  SaudeItem,
  SaudeItemId,
  SaudeItemInput,
  SaudeItemPatch,
} from '@planner/core';
import { adapter } from '../adapter.js';

type State =
  | { status: 'loading' }
  | { status: 'ok'; items: SaudeItem[] }
  | { status: 'error'; message: string };

export function useSaude() {
  const [state, setState] = useState<State>({ status: 'loading' });

  const load = useCallback(async () => {
    const result = await adapter.getSaudeItems();
    if (result.ok) {
      setState({ status: 'ok', items: result.data.filter((item) => item.active) });
    } else {
      setState({ status: 'error', message: result.error });
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const createSaudeItem = useCallback(async (input: SaudeItemInput) => {
    await adapter.createSaudeItem(input);
    void load();
  }, [load]);

  const updateSaudeItem = useCallback(async (id: SaudeItemId, patch: SaudeItemPatch) => {
    await adapter.updateSaudeItem(id, patch);
    void load();
  }, [load]);

  const recordSaudeEvent = useCallback(async (id: SaudeItemId, input: SaudeEventInput) => {
    await adapter.recordSaudeEvent(id, input);
    void load();
  }, [load]);

  const archiveSaudeItem = useCallback(async (id: SaudeItemId) => {
    await adapter.archiveSaudeItem(id);
    void load();
  }, [load]);

  return { state, createSaudeItem, updateSaudeItem, recordSaudeEvent, archiveSaudeItem };
}
