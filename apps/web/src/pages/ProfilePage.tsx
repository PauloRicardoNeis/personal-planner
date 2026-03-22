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
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 24 }}>Perfil Nutricional</h1>

      {state.status === 'loading' && <p style={{ color: 'var(--text-muted)' }}>Carregando...</p>}
      {state.status === 'error' && <p style={{ color: 'var(--priority-high-text)' }}>Erro: {state.message}</p>}

      {state.status === 'ok' && !state.profile && (
        <p style={{ color: 'var(--text-muted)', marginBottom: 20, fontSize: 14 }}>
          Nenhum perfil configurado. Preencha os dados abaixo para calcular suas metas diarias.
        </p>
      )}

      {state.status === 'ok' && (
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 32 }}>
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
            <p style={{ color: 'var(--progress-green)', fontSize: 14, margin: 0 }}>Perfil salvo com sucesso!</p>
          )}
        </form>
      )}

      {/* Computed targets preview */}
      {targets && (
        <div style={{ padding: 16, border: '1px solid var(--border)', borderRadius: 8 }}>
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
  fontSize: 14, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12, marginTop: 0,
};

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 13, color: 'var(--label)', marginBottom: 4,
};

const inputStyle: React.CSSProperties = {
  padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border-input)', fontSize: 14, outline: 'none', maxWidth: 200,
};

const selectStyle: React.CSSProperties = {
  padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border-input)', fontSize: 14, outline: 'none',
};

const btnStyle: React.CSSProperties = {
  padding: '10px 20px', borderRadius: 6, border: 'none',
  background: 'var(--btn-bg)', color: 'var(--btn-text)', cursor: 'pointer', fontSize: 14, fontWeight: 600,
};

const thStyle: React.CSSProperties = {
  textAlign: 'left', color: 'var(--text-muted)', fontWeight: 600, paddingBottom: 6, borderBottom: '1px solid var(--border)',
};

const tdStyle: React.CSSProperties = {
  color: 'var(--text)', padding: '4px 0',
};

const tdRightStyle: React.CSSProperties = {
  color: 'var(--text)', padding: '4px 0', textAlign: 'right',
};
