import type { DataAdapter } from '@planner/core';
import { LocalStorageAdapter } from './adapters/LocalStorageAdapter.js';
import { RestApiAdapter } from './adapters/RestApiAdapter.js';

/**
 * THE ONLY PLACE where a concrete adapter class is imported and instantiated.
 * Toggle backend via VITE_BACKEND_MODE env variable:
 *   'local' (default) → LocalStorageAdapter
 *   'rest'            → RestApiAdapter (Phase 2)
 */
const mode = import.meta.env['VITE_BACKEND_MODE'] ?? 'local';

export const adapter: DataAdapter =
  mode === 'rest'
    ? new RestApiAdapter(import.meta.env['VITE_API_BASE_URL'] as string ?? 'http://localhost:3001')
    : new LocalStorageAdapter();
