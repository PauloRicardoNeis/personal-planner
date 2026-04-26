import { useEffect, useState } from 'react';
import { useGames } from '../hooks/useGames.js';

type Feedback =
  | { kind: 'success'; message: string }
  | { kind: 'error'; message: string }
  | null;

export function GamesPage() {
  const { state, saveSettings, syncLibrary, isSyncing } = useGames();

  const [apiKey, setApiKey] = useState('');
  const [profile, setProfile] = useState('');
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (state.status !== 'ok') return;
    setApiKey(state.settings?.apiKey ?? '');
    setProfile(state.settings?.profile ?? '');
  }, [state]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setIsSaving(true);
    setFeedback(null);

    const result = await saveSettings({ apiKey, profile });
    setIsSaving(false);

    if (!result.ok) {
      setFeedback({ kind: 'error', message: result.error });
      return;
    }

    setFeedback({ kind: 'success', message: 'Configuracao da Steam salva.' });
  }

  async function handleSync() {
    setFeedback(null);

    const saveResult = await saveSettings({ apiKey, profile });
    if (!saveResult.ok) {
      setFeedback({ kind: 'error', message: saveResult.error });
      return;
    }

    const syncResult = await syncLibrary();

    if (!syncResult.ok) {
      setFeedback({ kind: 'error', message: syncResult.error });
      return;
    }

    setFeedback({
      kind: 'success',
      message: `${syncResult.data.importedCount} jogos sincronizados da Steam.`,
    });
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <section>
        <h1 style={titleStyle}>Jogos</h1>
        <p style={introStyle}>
          Importe sua biblioteca da Steam para consultar o backlog dentro do planner.
          A chave fica salva apenas nos dados locais deste app.
        </p>
      </section>

      {state.status === 'loading' && <p style={mutedStyle}>Carregando biblioteca...</p>}
      {state.status === 'error' && <p style={errorStyle}>Erro: {state.message}</p>}

      {state.status === 'ok' && (
        <>
          <section style={cardStyle}>
            <div style={{ marginBottom: 18 }}>
              <h2 style={sectionTitleStyle}>Conexao Steam</h2>
              <p style={hintStyle}>
                Use sua chave da Steam Web API e um perfil SteamID64, vanity URL ou URL completa.
              </p>
            </div>

            <form onSubmit={handleSave} style={formStyle}>
              <label style={fieldStyle}>
                <span style={labelStyle}>Steam Web API key</span>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Cole sua chave aqui"
                  autoComplete="off"
                  style={inputStyle}
                />
              </label>

              <label style={fieldStyle}>
                <span style={labelStyle}>Perfil Steam</span>
                <input
                  type="text"
                  value={profile}
                  onChange={(e) => setProfile(e.target.value)}
                  placeholder="7656119... ou https://steamcommunity.com/id/seu-perfil"
                  autoComplete="off"
                  style={inputStyle}
                />
              </label>

              <div style={buttonRowStyle}>
                <button type="submit" disabled={isSaving || isSyncing} style={primaryBtnStyle}>
                  {isSaving ? 'Salvando...' : 'Salvar chave'}
                </button>
                <button
                  type="button"
                  onClick={handleSync}
                  disabled={isSaving || isSyncing}
                  style={secondaryBtnStyle}
                >
                  {isSyncing ? 'Sincronizando...' : 'Sincronizar biblioteca'}
                </button>
              </div>
            </form>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <p style={hintStyle}>
                No navegador puro, a Steam bloqueia essa chamada por CORS. A sincronizacao funciona no app desktop
                ou no modo REST local.
              </p>
              {state.settings?.resolvedSteamId && (
                <p style={metaStyle}>SteamID resolvido: {state.settings.resolvedSteamId}</p>
              )}
              {state.settings?.lastSyncedAt && (
                <p style={metaStyle}>Ultima sincronizacao: {formatDateTime(state.settings.lastSyncedAt)}</p>
              )}
              {feedback && (
                <p style={feedback.kind === 'error' ? errorStyle : successStyle}>{feedback.message}</p>
              )}
            </div>
          </section>

          <section style={cardStyle}>
            <div style={libraryHeaderStyle}>
              <div>
                <h2 style={sectionTitleStyle}>Biblioteca</h2>
                <p style={hintStyle}>
                  {state.games.length === 0
                    ? 'Nenhum jogo importado ainda.'
                    : `${state.games.length} jogos ordenados por tempo jogado.`}
                </p>
              </div>
            </div>

            {state.games.length > 0 && (
              <div style={listStyle}>
                {state.games.map((game) => (
                  <a
                    key={game.id}
                    href={`https://store.steampowered.com/app/${game.steamAppId}/`}
                    target="_blank"
                    rel="noreferrer"
                    style={rowStyle}
                  >
                    <div>
                      <strong style={gameTitleStyle}>{game.name}</strong>
                      <p style={gameMetaStyle}>
                        <span style={steamBadgeStyle}>Steam</span>
                        App ID {game.steamAppId}
                      </p>
                    </div>
                    <span style={playtimeStyle}>{formatPlaytime(game.playtimeMinutes)}</span>
                  </a>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}

function formatPlaytime(minutes: number): string {
  const hours = minutes / 60;
  return `${hours.toFixed(hours >= 10 ? 0 : 1)} h`;
}

function formatDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date);
}

const titleStyle: React.CSSProperties = {
  fontSize: 20,
  fontWeight: 700,
  margin: 0,
  letterSpacing: '-0.3px',
  color: 'var(--text)',
};

const introStyle: React.CSSProperties = {
  margin: '8px 0 0',
  color: 'var(--text-muted)',
  fontSize: 13.5,
  lineHeight: 1.5,
  maxWidth: 720,
};

const cardStyle: React.CSSProperties = {
  padding: '20px 22px',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius-lg)',
  background: 'var(--bg-card)',
  boxShadow: 'var(--shadow-card)',
  display: 'flex',
  flexDirection: 'column',
  gap: 18,
};

const sectionTitleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 13,
  fontWeight: 700,
  color: 'var(--text)',
};

const hintStyle: React.CSSProperties = {
  margin: '4px 0 0',
  color: 'var(--text-muted)',
  fontSize: 12.5,
  lineHeight: 1.5,
};

const formStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
  gap: 14,
};

const fieldStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
};

const labelStyle: React.CSSProperties = {
  fontSize: 12,
  color: 'var(--text-muted)',
  fontWeight: 600,
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--border-input)',
  background: 'var(--bg-input)',
  color: 'var(--text)',
  fontSize: 13.5,
  outline: 'none',
};

const buttonRowStyle: React.CSSProperties = {
  display: 'flex',
  gap: 10,
  alignItems: 'flex-end',
  flexWrap: 'wrap',
};

const primaryBtnStyle: React.CSSProperties = {
  padding: '10px 16px',
  borderRadius: 'var(--radius-md)',
  border: 'none',
  background: 'var(--btn-bg)',
  color: 'var(--btn-text)',
  cursor: 'pointer',
  fontSize: 13,
  fontWeight: 600,
};

const secondaryBtnStyle: React.CSSProperties = {
  padding: '10px 16px',
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--border)',
  background: 'transparent',
  color: 'var(--text)',
  cursor: 'pointer',
  fontSize: 13,
  fontWeight: 600,
};

const mutedStyle: React.CSSProperties = {
  color: 'var(--text-muted)',
  fontSize: 13.5,
};

const errorStyle: React.CSSProperties = {
  color: 'var(--priority-high-text)',
  fontSize: 13,
  margin: 0,
};

const successStyle: React.CSSProperties = {
  color: 'var(--progress-green)',
  fontSize: 13,
  margin: 0,
};

const metaStyle: React.CSSProperties = {
  color: 'var(--text-muted)',
  fontSize: 12.5,
  margin: 0,
};

const libraryHeaderStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 12,
};

const listStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
};

const rowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 12,
  padding: '12px 14px',
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--border)',
  textDecoration: 'none',
  color: 'inherit',
  background: 'var(--bg)',
};

const gameTitleStyle: React.CSSProperties = {
  display: 'block',
  color: 'var(--text)',
  fontSize: 14,
  marginBottom: 2,
};

const gameMetaStyle: React.CSSProperties = {
  margin: 0,
  color: 'var(--text-muted)',
  fontSize: 12,
};

const steamBadgeStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 4,
  padding: '2px 7px',
  marginRight: 8,
  borderRadius: 999,
  background: 'var(--accent-soft)',
  color: 'var(--accent)',
  fontSize: 11,
  fontWeight: 700,
};

const playtimeStyle: React.CSSProperties = {
  color: 'var(--accent)',
  fontWeight: 700,
  fontSize: 12.5,
  whiteSpace: 'nowrap',
};
