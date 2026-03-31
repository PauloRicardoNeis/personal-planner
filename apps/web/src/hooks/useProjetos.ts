import { useState, useEffect, useCallback } from 'react';
import {
  type Projeto,
  type ProjetoInput,
  type ProjetoPatch,
  type EtapaInput,
  type EtapaPatch,
  type ProjetoId,
  type EtapaId,
} from '@planner/core';
import { adapter } from '../adapter.js';

type State =
  | { status: 'loading' }
  | { status: 'ok'; projetos: Projeto[] }
  | { status: 'error'; message: string };

export function useProjetos() {
  const [state, setState] = useState<State>({ status: 'loading' });

  const load = useCallback(async () => {
    const result = await adapter.getProjetos();
    if (result.ok) {
      setState({ status: 'ok', projetos: result.data.filter((p) => p.status !== 'archived') });
    } else {
      setState({ status: 'error', message: result.error });
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const createProjeto = useCallback(async (input: ProjetoInput) => {
    await adapter.createProjeto(input);
    void load();
  }, [load]);

  const updateProjeto = useCallback(async (id: ProjetoId, patch: ProjetoPatch) => {
    await adapter.updateProjeto(id, patch);
    void load();
  }, [load]);

  const archiveProjeto = useCallback(async (id: ProjetoId) => {
    await adapter.archiveProjeto(id);
    void load();
  }, [load]);

  const addEtapa = useCallback(async (projetoId: ProjetoId, input: EtapaInput) => {
    await adapter.addEtapa(projetoId, input);
    void load();
  }, [load]);

  const updateEtapa = useCallback(async (projetoId: ProjetoId, etapaId: EtapaId, patch: EtapaPatch) => {
    await adapter.updateEtapa(projetoId, etapaId, patch);
    void load();
  }, [load]);

  const removeEtapa = useCallback(async (projetoId: ProjetoId, etapaId: EtapaId) => {
    await adapter.removeEtapa(projetoId, etapaId);
    void load();
  }, [load]);

  const reorderEtapas = useCallback(async (projetoId: ProjetoId, etapaIds: EtapaId[]) => {
    await adapter.reorderEtapas(projetoId, etapaIds);
    void load();
  }, [load]);

  return {
    state,
    createProjeto,
    updateProjeto,
    archiveProjeto,
    addEtapa,
    updateEtapa,
    removeEtapa,
    reorderEtapas,
  };
}
