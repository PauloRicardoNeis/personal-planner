import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { todayISODate, computePortionNutrients, type ISODate, type FoodId, type DiaryEntryId, type NutrientsPer100g, type Food } from '@planner/core';
import { useDiary, useFoods, useNutritionSummary } from '../hooks/useNutrition.js';

type EntryMode = 'food' | 'quick';

export function NutritionPage() {
  const navigate = useNavigate();
  const [date, setDate] = useState<ISODate>(todayISODate());
  const { state: summaryState, reload: reloadSummary } = useNutritionSummary(date);
  const { state: diaryState, createEntry, deleteEntry } = useDiary(date);
  const { state: foodsState } = useFoods();

  // Add entry form state
  const [showForm, setShowForm] = useState(false);
  const [entryMode, setEntryMode] = useState<EntryMode>('food');
  const [selectedFoodId, setSelectedFoodId] = useState('');
  const [grams, setGrams] = useState('');
  const [meal, setMeal] = useState('');
  const [foodSearch, setFoodSearch] = useState('');

  // Quick entry fields
  const [quickDesc, setQuickDesc] = useState('');
  const [quickGrams, setQuickGrams] = useState('');
  const [quickCalories, setQuickCalories] = useState('');
  const [quickProtein, setQuickProtein] = useState('');
  const [quickCarbs, setQuickCarbs] = useState('');
  const [quickFat, setQuickFat] = useState('');
  const [quickFiber, setQuickFiber] = useState('');

  function resetForm() {
    setShowForm(false);
    setSelectedFoodId('');
    setGrams('');
    setMeal('');
    setFoodSearch('');
    setQuickDesc('');
    setQuickGrams('');
    setQuickCalories('');
    setQuickProtein('');
    setQuickCarbs('');
    setQuickFat('');
    setQuickFiber('');
  }

  async function handleAddEntry(e: React.FormEvent) {
    e.preventDefault();
    if (entryMode === 'food') {
      if (!selectedFoodId || !grams) return;
      const mealVal = meal.trim();
      await createEntry({
        type: 'food',
        foodId: selectedFoodId as FoodId,
        grams: Number(grams),
        ...(mealVal && { meal: mealVal }),
      });
    } else {
      if (!quickDesc.trim() || !quickGrams) return;
      const mealVal = meal.trim();
      const nutrients: NutrientsPer100g = {
        calories: Number(quickCalories) || 0,
        protein: Number(quickProtein) || 0,
        carbs: Number(quickCarbs) || 0,
        fat: Number(quickFat) || 0,
        fiber: Number(quickFiber) || 0,
      };
      await createEntry({
        type: 'quick',
        description: quickDesc.trim(),
        grams: Number(quickGrams),
        nutrients,
        ...(mealVal && { meal: mealVal }),
      });
    }
    resetForm();
    void reloadSummary();
  }

  async function handleDelete(id: DiaryEntryId) {
    await deleteEntry(id);
    void reloadSummary();
  }

  // Get food map for displaying food entry names
  const foodMap = new Map<string, Food>();
  if (foodsState.status === 'ok') {
    for (const f of foodsState.foods) {
      foodMap.set(f.id, f);
    }
  }

  // Filter foods for search
  const activeFoods = foodsState.status === 'ok'
    ? foodsState.foods.filter((f) => f.active && f.name.toLowerCase().includes(foodSearch.toLowerCase()))
    : [];

  return (
    <div>
      <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 24, letterSpacing: '-0.3px', color: 'var(--text)' }}>Nutrição</h1>

      {/* Date selector */}
      <div style={{ marginBottom: 24 }}>
        <label style={labelStyle}>Data:</label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value as ISODate)}
          style={inputStyle}
        />
      </div>

      {/* Nutrition Summary */}
      {summaryState.status === 'loading' && <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Carregando...</p>}
      {summaryState.status === 'error' && <p style={{ color: 'var(--priority-high-text)', fontSize: 14 }}>Erro: {summaryState.message}</p>}
      {summaryState.status === 'ok' && (
        <div style={{
          marginBottom: 28, padding: '18px 20px',
          border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)',
          background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)',
        }}>
          <h2 style={sectionTitleStyle}>Resumo do dia</h2>
          <MacroBar
            label="Calorias"
            current={summaryState.summary.totals.calories}
            target={summaryState.summary.targets.calories}
            percent={summaryState.summary.percentages.calories}
            unit="kcal"
            isProtein={false}
          />
          <MacroBar
            label="Proteína"
            current={summaryState.summary.totals.protein}
            target={summaryState.summary.targets.protein}
            percent={summaryState.summary.percentages.protein}
            unit="g"
            isProtein={true}
          />
          <MacroBar
            label="Carboidratos"
            current={summaryState.summary.totals.carbs}
            target={summaryState.summary.targets.carbs}
            percent={summaryState.summary.percentages.carbs}
            unit="g"
            isProtein={false}
          />
          <MacroBar
            label="Gordura"
            current={summaryState.summary.totals.fat}
            target={summaryState.summary.targets.fat}
            percent={summaryState.summary.percentages.fat}
            unit="g"
            isProtein={false}
          />
        </div>
      )}

      {/* Diary Entries */}
      <section style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h2 style={sectionTitleStyle}>Registros do dia</h2>
          <button onClick={() => setShowForm(!showForm)} style={btnStyle}>
            {showForm ? 'Cancelar' : 'Adicionar'}
          </button>
        </div>

        {/* Add entry form */}
        {showForm && (
          <form onSubmit={handleAddEntry} style={{
            marginBottom: 20, padding: '16px 18px',
            border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)',
            background: 'var(--bg-card)',
            display: 'flex', flexDirection: 'column', gap: 10,
          }}>
            <div style={{ display: 'flex', gap: 8 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: 'var(--text)', cursor: 'pointer' }}>
                <input type="radio" name="entryMode" checked={entryMode === 'food'} onChange={() => setEntryMode('food')} />
                Do banco
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: 'var(--text)', cursor: 'pointer' }}>
                <input type="radio" name="entryMode" checked={entryMode === 'quick'} onChange={() => setEntryMode('quick')} />
                Entrada rapida
              </label>
            </div>

            {entryMode === 'food' && (
              <>
                <input
                  type="text"
                  placeholder="Buscar alimento..."
                  value={foodSearch}
                  onChange={(e) => setFoodSearch(e.target.value)}
                  style={inputStyle}
                />
                <select
                  value={selectedFoodId}
                  onChange={(e) => setSelectedFoodId(e.target.value)}
                  style={selectStyle}
                  required
                >
                  <option value="">Selecione um alimento</option>
                  {activeFoods.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name}{f.brand ? ` (${f.brand})` : ''} - {f.nutrients.calories} kcal/100g
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  placeholder="Gramas"
                  value={grams}
                  onChange={(e) => setGrams(e.target.value)}
                  min={1}
                  required
                  style={{ ...inputStyle, maxWidth: 120 }}
                />
              </>
            )}

            {entryMode === 'quick' && (
              <>
                <input
                  type="text"
                  placeholder="Descrição"
                  value={quickDesc}
                  onChange={(e) => setQuickDesc(e.target.value)}
                  required
                  style={inputStyle}
                />
                <input
                  type="number"
                  placeholder="Gramas"
                  value={quickGrams}
                  onChange={(e) => setQuickGrams(e.target.value)}
                  min={1}
                  required
                  style={{ ...inputStyle, maxWidth: 120 }}
                />
                <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>Nutrientes por 100g:</p>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <input type="number" placeholder="Calorias" value={quickCalories} onChange={(e) => setQuickCalories(e.target.value)} style={{ ...inputStyle, maxWidth: 100 }} />
                  <input type="number" placeholder="Proteína" value={quickProtein} onChange={(e) => setQuickProtein(e.target.value)} style={{ ...inputStyle, maxWidth: 100 }} />
                  <input type="number" placeholder="Carbs" value={quickCarbs} onChange={(e) => setQuickCarbs(e.target.value)} style={{ ...inputStyle, maxWidth: 100 }} />
                  <input type="number" placeholder="Gordura" value={quickFat} onChange={(e) => setQuickFat(e.target.value)} style={{ ...inputStyle, maxWidth: 100 }} />
                  <input type="number" placeholder="Fibra" value={quickFiber} onChange={(e) => setQuickFiber(e.target.value)} style={{ ...inputStyle, maxWidth: 100 }} />
                </div>
              </>
            )}

            <input
              type="text"
              placeholder="Refeição (opcional)"
              value={meal}
              onChange={(e) => setMeal(e.target.value)}
              style={{ ...inputStyle, maxWidth: 200 }}
            />

            <button type="submit" style={{ ...btnStyle, alignSelf: 'flex-start' }}>Salvar</button>
          </form>
        )}

        {/* Entry list */}
        {diaryState.status === 'loading' && <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Carregando...</p>}
        {diaryState.status === 'error' && <p style={{ color: 'var(--priority-high-text)', fontSize: 14 }}>Erro: {diaryState.message}</p>}
        {diaryState.status === 'ok' && (
          <DiaryList entries={diaryState.entries} foodMap={foodMap} onDelete={handleDelete} />
        )}
      </section>

      {/* Links */}
      <div style={{ display: 'flex', gap: 10 }}>
        <button onClick={() => navigate('/alimentos')} style={linkBtnStyle}>Banco de alimentos</button>
        <button onClick={() => navigate('/perfil')} style={linkBtnStyle}>Perfil nutricional</button>
      </div>
    </div>
  );
}

// ── DiaryList component ─────────────────────────────────────────────────────

function DiaryList({ entries, foodMap, onDelete }: {
  entries: import('@planner/core').DiaryEntry[];
  foodMap: Map<string, Food>;
  onDelete: (id: DiaryEntryId) => void;
}) {
  if (entries.length === 0) {
    return <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Nenhum registro para este dia.</p>;
  }

  // Group by meal
  const groups = new Map<string, typeof entries>();
  for (const entry of entries) {
    const key = entry.meal ?? 'Sem refeição';
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(entry);
  }

  return (
    <div>
      {Array.from(groups.entries()).map(([mealName, mealEntries]) => (
        <div key={mealName} style={{ marginBottom: 16 }}>
          <h3 style={{
            fontSize: 11, fontWeight: 600, color: 'var(--text-muted)',
            textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8,
          }}>
            {mealName}
          </h3>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {mealEntries.map((entry) => {
              let name: string;
              let cals: number;
              if (entry.type === 'food') {
                const food = foodMap.get(entry.foodId);
                name = food ? food.name : 'Alimento desconhecido';
                cals = food ? computePortionNutrients(food.nutrients, entry.grams).calories : 0;
              } else {
                name = entry.description;
                cals = computePortionNutrients(entry.nutrients, entry.grams).calories;
              }
              return (
                <li key={entry.id} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '8px 0', borderBottom: '1px solid var(--border)',
                }}>
                  <div>
                    <span style={{ color: 'var(--text)', fontSize: 13.5 }}>{name}</span>
                    <span style={{ color: 'var(--text-muted)', fontSize: 12, marginLeft: 8 }}>
                      {entry.grams}g - {Math.round(cals)} kcal
                    </span>
                  </div>
                  <button
                    onClick={() => onDelete(entry.id)}
                    style={{
                      background: 'none', border: 'none', color: 'var(--priority-high-text)',
                      cursor: 'pointer', fontSize: 12, padding: '4px 8px',
                      borderRadius: 'var(--radius-xs)', transition: 'opacity var(--transition)',
                    }}
                  >
                    Remover
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}

// ── MacroBar component ──────────────────────────────────────────────────────

function MacroBar({ label, current, target, percent, unit, isProtein }: {
  label: string;
  current: number;
  target: number;
  percent: number;
  unit: string;
  isProtein: boolean;
}) {
  const barPercent = Math.min(percent, 100);

  let barColor: string;
  if (isProtein) {
    // For protein: green = closer to 100%, yellow < 50%, red never
    barColor = percent >= 80 ? 'var(--progress-green)' : percent >= 50 ? 'var(--progress-yellow)' : 'var(--progress-yellow)';
  } else {
    // For cal/carbs/fat: green < 90%, yellow 90-110%, red > 110%
    if (percent > 110) barColor = 'var(--progress-red)';
    else if (percent >= 90) barColor = 'var(--progress-yellow)';
    else barColor = 'var(--progress-green)';
  }

  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
        <span style={{ color: 'var(--text)', fontWeight: 500 }}>{label}</span>
        <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>
          {Math.round(current)}/{Math.round(target)} {unit} ({percent}%)
        </span>
      </div>
      <div style={{ height: 4, borderRadius: 2, background: 'var(--progress-bg)', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${barPercent}%`, borderRadius: 2, background: barColor, transition: 'width var(--transition-slow)' }} />
      </div>
    </div>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

const sectionTitleStyle: React.CSSProperties = {
  fontSize: 11, fontWeight: 600, color: 'var(--text-muted)',
  textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12, marginTop: 0,
};

const labelStyle: React.CSSProperties = {
  fontSize: 12, color: 'var(--text-muted)', marginRight: 6, fontWeight: 500,
};

const inputStyle: React.CSSProperties = {
  padding: '9px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-input)',
  fontSize: 13.5, outline: 'none', background: 'var(--bg-input)', color: 'var(--text)',
  transition: 'border-color var(--transition), box-shadow var(--transition)',
};

const selectStyle: React.CSSProperties = {
  padding: '9px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-input)',
  fontSize: 13.5, outline: 'none', background: 'var(--bg-input)', color: 'var(--text)', cursor: 'pointer',
  transition: 'border-color var(--transition), box-shadow var(--transition)',
};

const btnStyle: React.CSSProperties = {
  padding: '8px 18px', borderRadius: 'var(--radius-md)', border: 'none',
  background: 'var(--btn-bg)', color: 'var(--btn-text)', cursor: 'pointer',
  fontSize: 13.5, fontWeight: 600, transition: 'background var(--transition)',
};

const linkBtnStyle: React.CSSProperties = {
  padding: '8px 16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)',
  background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer',
  fontSize: 13.5, transition: 'all var(--transition)',
};
