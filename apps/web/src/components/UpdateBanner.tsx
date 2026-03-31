import { useEffect, useState } from 'react';

interface UpdateInfo {
  version: string;
  notes?: string;
}

export function UpdateBanner() {
  const [update, setUpdate] = useState<UpdateInfo | null>(null);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    // Only available when running inside Tauri
    if (!('__TAURI_INTERNALS__' in window)) return;

    import('@tauri-apps/api/event').then(({ listen }) => {
      listen<UpdateInfo>('update-available', (e) => {
        setUpdate(e.payload);
      }).catch(() => {/* not in tauri */});
    });
  }, []);

  if (!update) return null;

  async function handleInstall() {
    setInstalling(true);
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      await invoke('install_update');
    } catch (e) {
      console.error('Update failed:', e);
      setInstalling(false);
    }
  }

  return (
    <div style={{
      background: 'var(--accent)',
      color: 'var(--accent-text)',
      padding: '9px 16px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
      fontSize: 13,
      fontFamily: 'var(--font-sans)',
    }}>
      <span>
        Nova versão disponível: <strong>v{update.version}</strong>
        {update.notes && <> — {update.notes}</>}
      </span>
      <button
        onClick={handleInstall}
        disabled={installing}
        style={{
          background: '#fff',
          color: 'var(--accent)',
          border: 'none',
          borderRadius: 'var(--radius-sm)',
          padding: '4px 12px',
          cursor: installing ? 'default' : 'pointer',
          fontWeight: 600,
          fontSize: 12,
          opacity: installing ? 0.7 : 1,
          transition: 'opacity var(--transition)',
        }}
      >
        {installing ? 'Instalando...' : 'Instalar e reiniciar'}
      </button>
    </div>
  );
}
