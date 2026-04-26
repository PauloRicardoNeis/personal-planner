import { useCallback, useEffect, useState } from 'react';
import type {
  CompraItem,
  CompraItemId,
  CompraItemInput,
  CompraItemPatch,
  ISODate,
  ListaCompra,
  ListaCompraId,
  ListaCompraInput,
  ListaCompraPatch,
} from '@planner/core';
import { adapter } from '../adapter.js';

type State =
  | { status: 'loading' }
  | { status: 'ok'; listas: ListaCompra[] }
  | { status: 'error'; message: string };

export function useCompras() {
  const [state, setState] = useState<State>({ status: 'loading' });

  const load = useCallback(async () => {
    const result = await adapter.getListasCompra();
    if (result.ok) {
      setState({ status: 'ok', listas: result.data.filter((lista) => lista.active) });
    } else {
      setState({ status: 'error', message: result.error });
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const createListaCompra = useCallback(async (input: ListaCompraInput) => {
    await adapter.createListaCompra(input);
    void load();
  }, [load]);

  const updateListaCompra = useCallback(async (id: ListaCompraId, patch: ListaCompraPatch) => {
    await adapter.updateListaCompra(id, patch);
    void load();
  }, [load]);

  const archiveListaCompra = useCallback(async (id: ListaCompraId) => {
    await adapter.archiveListaCompra(id);
    void load();
  }, [load]);

  const addCompraItem = useCallback(async (listaId: ListaCompraId, input: CompraItemInput) => {
    await adapter.addCompraItem(listaId, input);
    void load();
  }, [load]);

  const updateCompraItem = useCallback(async (
    listaId: ListaCompraId,
    itemId: CompraItemId,
    patch: CompraItemPatch,
  ) => {
    await adapter.updateCompraItem(listaId, itemId, patch);
    void load();
  }, [load]);

  const removeCompraItem = useCallback(async (listaId: ListaCompraId, itemId: CompraItemId) => {
    await adapter.removeCompraItem(listaId, itemId);
    void load();
  }, [load]);

  const completeListaCompra = useCallback(async (listaId: ListaCompraId, date: ISODate) => {
    await adapter.completeListaCompra(listaId, date);
    void load();
  }, [load]);

  return {
    state,
    createListaCompra,
    updateListaCompra,
    archiveListaCompra,
    addCompraItem,
    updateCompraItem,
    removeCompraItem,
    completeListaCompra,
  };
}
