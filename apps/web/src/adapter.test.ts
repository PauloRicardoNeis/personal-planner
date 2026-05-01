import { afterEach, describe, expect, it, vi } from 'vitest';
import rootPackageJson from '../../../package.json';
import webPackageJson from '../package.json';
import desktopPackageJson from '../../desktop/package.json';
import desktopEnv from '../.env.desktop?raw';

type PackageJson = {
  scripts: Record<string, string>;
};

describe('adapter selection', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it('uses localStorage when the backend mode is local', async () => {
    vi.stubEnv('VITE_BACKEND_MODE', 'local');

    const { adapter } = await import('./adapter.js');
    const { LocalStorageAdapter } = await import('./adapters/LocalStorageAdapter.js');

    expect(adapter).toBeInstanceOf(LocalStorageAdapter);
  });

  it('uses the REST adapter when the backend mode is rest', async () => {
    vi.stubEnv('VITE_BACKEND_MODE', 'rest');
    vi.stubEnv('VITE_API_BASE_URL', 'http://127.0.0.1:3001');

    const { adapter } = await import('./adapter.js');
    const { RestApiAdapter } = await import('./adapters/RestApiAdapter.js');

    expect(adapter).toBeInstanceOf(RestApiAdapter);
  });

  it('builds desktop with the server-backed REST adapter only', () => {
    const rootScripts = (rootPackageJson as PackageJson).scripts;
    const webScripts = (webPackageJson as PackageJson).scripts;
    const desktopScripts = (desktopPackageJson as PackageJson).scripts;

    expect(rootScripts).not.toHaveProperty('build:desktop-no-server');
    expect(rootScripts).not.toHaveProperty('build:desktop-with-server');
    expect(rootScripts['build:desktop']).toContain('build:server-bin');
    expect(rootScripts['build:desktop']).toContain('copy:server-bin');
    expect(rootScripts['build:desktop']).toContain('--filter web build:desktop');
    expect(rootScripts['build:desktop']).toContain('--filter desktop build');
    expect(rootScripts['build:desktop-release']).toContain('--filter desktop build:release');
    expect(webScripts).not.toHaveProperty('build:desktop:no-server');
    expect(webScripts).not.toHaveProperty('build:desktop:with-server');
    expect(webScripts['build:desktop']).toContain('--mode desktop');
    expect(desktopScripts).not.toHaveProperty('build:no-server');
    expect(desktopScripts).not.toHaveProperty('build:with-server');
    expect(desktopScripts['build']).toBe('tauri build');
    expect(parseEnv(desktopEnv)['VITE_BACKEND_MODE']).toBe('rest');
  });
});

function parseEnv(contents: string): Record<string, string> {
  return Object.fromEntries(
    contents
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#'))
      .map((line) => {
        const separatorIndex = line.indexOf('=');
        return [
          line.slice(0, separatorIndex),
          line.slice(separatorIndex + 1),
        ];
      }),
  );
}
