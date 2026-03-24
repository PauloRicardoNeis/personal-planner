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
      background: '#3b82f6',
      color: '#fff',
      padding: '10px 16px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
      fontSize: 14,
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
          color: '#3b82f6',
          border: 'none',
          borderRadius: 4,
          padding: '4px 12px',
          cursor: installing ? 'default' : 'pointer',
          fontWeight: 600,
          opacity: installing ? 0.7 : 1,
        }}
      >
        {installing ? 'Instalando...' : 'Instalar e reiniciar'}
      </button>
    </div>
  );
}
