import { useEffect, useState } from 'react';
import type { Result } from '@planner/core';

type Feedback =
  | { kind: 'success'; message: string }
  | { kind: 'error'; message: string }
  | null;

type Props = {
  apiKey: string;
  onSave: (apiKey: string) => Promise<Result<string>>;
};

export function TmdbSettings({ apiKey, onSave }: Props) {
  const [value, setValue] = useState(apiKey);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);

  useEffect(() => {
    setValue(apiKey);
  }, [apiKey]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSaving(true);
    setFeedback(null);

    const result = await onSave(value);
    setIsSaving(false);

    if (!result.ok) {
      setFeedback({ kind: 'error', message: result.error });
      return;
    }

    setFeedback({
      kind: 'success',
      message: result.data ? 'API key TMDB salva localmente.' : 'API key TMDB removida.',
    });
  }

  return (
    <section style={cardStyle}>
      <div>
        <h2 style={titleStyle}>TMDB</h2>
        <p style={hintStyle}>
          A busca de filmes usa sua API key do TMDB e salva esse valor apenas no armazenamento local deste app.
        </p>
      </div>

      <form onSubmit={handleSubmit} style={formStyle}>
        <label style={fieldStyle}>
          <span style={labelStyle}>API key</span>
          <input
            type="password"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Cole sua chave do TMDB"
            autoComplete="off"
            style={inputStyle}
          />
        </label>

        <button type="submit" disabled={isSaving} style={buttonStyle}>
          {isSaving ? 'Salvando...' : 'Salvar chave'}
        </button>
      </form>

      {feedback && (
        <p style={feedback.kind === 'error' ? errorStyle : successStyle}>
          {feedback.message}
        </p>
      )}
    </section>
  );
}

const cardStyle: React.CSSProperties = {
  padding: '20px 22px',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius-lg)',
  background: 'var(--bg-card)',
  boxShadow: 'var(--shadow-card)',
  display: 'flex',
  flexDirection: 'column',
  gap: 14,
};

const titleStyle: React.CSSProperties = {
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
  display: 'flex',
  gap: 12,
  flexWrap: 'wrap',
  alignItems: 'flex-end',
};

const fieldStyle: React.CSSProperties = {
  flex: 1,
  minWidth: 240,
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
};

const labelStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 600,
  color: 'var(--text-muted)',
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

const buttonStyle: React.CSSProperties = {
  padding: '10px 16px',
  borderRadius: 'var(--radius-md)',
  border: 'none',
  background: 'var(--btn-bg)',
  color: 'var(--btn-text)',
  cursor: 'pointer',
  fontSize: 13,
  fontWeight: 600,
};

const errorStyle: React.CSSProperties = {
  margin: 0,
  color: 'var(--priority-high-text)',
  fontSize: 13,
};

const successStyle: React.CSSProperties = {
  margin: 0,
  color: 'var(--progress-green)',
  fontSize: 13,
};
