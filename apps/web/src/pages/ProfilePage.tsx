import { useState, useEffect } from 'react';
import { computeDailyTargets, type NutritionProfile, type DailyTargets } from '@planner/core';
import { useNutritionProfile } from '../hooks/useNutrition.js';

export function ProfilePage() {
  const { state, save } = useNutritionProfile();

  const [weightKg, setWeightKg] = useState('');
  const [goalType, setGoalType] = useState<'cut' | 'maintain' | 'bulk'>('maintain');
  const [saved, setSaved] = useState(false);

  // Load existing profile into form
  useEffect(() => {
    if (state.status === 'ok' && state.profile) {
      setWeightKg(String(state.profile.weightKg));
      setGoalType(state.profile.goalType);
    }
  }, [state]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!weightKg || Number(weightKg) <= 0) return;
    const profile: NutritionProfile = {
      weightKg: Number(weightKg),
      goalType,
    };
    await save(profile);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  // Compute targets for preview
  let targets: DailyTargets | null = null;
  if (weightKg && Number(weightKg) > 0) {
    targets = computeDailyTargets({ weightKg: Number(weightKg), goalType });
  }

  const goalLabels: Record<string, string> = {
    cut: 'Cutting (perda de gordura)',
    maintain: 'Manutencao',
    bulk: 'Bulking (ganho de massa)',
  };

  return (
    <div>
      <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 24, letterSpacing: '-0.3px', color: 'var(--text)' }}>Perfil Nutricional</h1>

      {state.status === 'loading' && <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Carregando...</p>}
      {state.status === 'error' && <p style={{ color: 'var(--priority-high-text)', fontSize: 14 }}>Erro: {state.message}</p>}

      {state.status === 'ok' && !state.profile && (
        <p style={{ color: 'var(--text-muted)', marginBottom: 20, fontSize: 13 }}>
          Nenhum perfil configurado. Preencha os dados abaixo para calcular suas metas diarias.
        </p>
      )}

      {state.status === 'ok' && (
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 28 }}>
          <div>
            <label style={labelStyle}>Peso (kg)</label>
            <input
              type="number"
              value={weightKg}
              onChange={(e) => setWeightKg(e.target.value)}
              placeholder="Ex: 75"
              min={1}
              step="0.1"
              required
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>Objetivo</label>
            <select
              value={goalType}
              onChange={(e) => setGoalType(e.target.value as 'cut' | 'maintain' | 'bulk')}
              style={selectStyle}
            >
              <option value="cut">{goalLabels.cut}</option>
              <option value="maintain">{goalLabels.maintain}</option>
              <option value="bulk">{goalLabels.bulk}</option>
            </select>
          </div>

          <button type="submit" style={{ ...btnStyle, alignSelf: 'flex-start' }}>
            Salvar perfil
          </button>

          {saved && (
            <p style={{ color: 'var(--progress-green)', fontSize: 13, margin: 0 }}>Perfil salvo com sucesso!</p>
          )}
        </form>
      )}

      {/* Computed targets preview */}
      {targets && (
        <div style={{
          padding: '18px 20px', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)',
          background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)',
        }}>
          <h2 style={sectionTitleStyle}>Metas diarias calculadas</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={thStyle}>Nutriente</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Meta</th>
              </tr>
            </thead>
            <tbody>
              <tr><td style={tdStyle}>Calorias</td><td style={tdRightStyle}>{Math.round(targets.calories)} kcal</td></tr>
              <tr><td style={tdStyle}>Proteina</td><td style={tdRightStyle}>{Math.round(targets.protein)} g</td></tr>
              <tr><td style={tdStyle}>Carboidratos</td><td style={tdRightStyle}>{Math.round(targets.carbs)} g</td></tr>
              <tr><td style={tdStyle}>Gordura</td><td style={tdRightStyle}>{Math.round(targets.fat)} g</td></tr>
              <tr><td style={tdStyle}>Fibra</td><td style={tdRightStyle}>{Math.round(targets.fiber)} g</td></tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

const sectionTitleStyle: React.CSSProperties = {
  fontSize: 11, fontWeight: 600, color: 'var(--text-muted)',
  textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12, marginTop: 0,
};

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 12, color: 'var(--text-muted)', marginBottom: 4, fontWeight: 500,
};

const inputStyle: React.CSSProperties = {
  padding: '9px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-input)',
  fontSize: 13.5, outline: 'none', maxWidth: 200, background: 'var(--bg-input)', color: 'var(--text)',
  transition: 'border-color var(--transition), box-shadow var(--transition)',
};

const selectStyle: React.CSSProperties = {
  padding: '9px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-input)',
  fontSize: 13.5, outline: 'none', background: 'var(--bg-input)', color: 'var(--text)', cursor: 'pointer',
  transition: 'border-color var(--transition), box-shadow var(--transition)',
};

const btnStyle: React.CSSProperties = {
  padding: '9px 18px', borderRadius: 'var(--radius-md)', border: 'none',
  background: 'var(--btn-bg)', color: 'var(--btn-text)', cursor: 'pointer',
  fontSize: 13.5, fontWeight: 600, transition: 'background var(--transition)',
};

const thStyle: React.CSSProperties = {
  textAlign: 'left', color: 'var(--text-muted)', fontWeight: 600, fontSize: 12,
  paddingBottom: 6, borderBottom: '1px solid var(--border)',
};

const tdStyle: React.CSSProperties = {
  color: 'var(--text)', padding: '4px 0', fontSize: 13.5,
};

const tdRightStyle: React.CSSProperties = {
  color: 'var(--text)', padding: '4px 0', textAlign: 'right', fontSize: 13.5,
};
