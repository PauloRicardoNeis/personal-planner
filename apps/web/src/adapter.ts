import type { DataAdapter } from '@planner/core';
import { LocalStorageAdapter } from './adapters/LocalStorageAdapter.js';
import { RestApiAdapter } from './adapters/RestApiAdapter.js';

/**
 * THE ONLY PLACE where a concrete adapter class is imported and instantiated.
 *
 * Modes:
 * - local: LocalStorageAdapter, only for browser dev/test harnesses.
 * - rest: RestApiAdapter, the canonical desktop product path.
 */
const mode = import.meta.env['VITE_BACKEND_MODE'] ?? 'local';

export const adapter: DataAdapter =
  mode === 'rest'
    ? new RestApiAdapter(import.meta.env['VITE_API_BASE_URL'] as string ?? 'http://localhost:3001')
    : new LocalStorageAdapter();
