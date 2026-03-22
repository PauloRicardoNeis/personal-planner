import { useState } from 'react';
import type { FoodId, NutrientsPer100g } from '@planner/core';
import { useFoods } from '../hooks/useNutrition.js';

export function FoodsPage() {
  const { state, createFood, archiveFood } = useFoods();

  // Form state
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [category, setCategory] = useState('');
  const [servingDesc, setServingDesc] = useState('');
  const [servingGrams, setServingGrams] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [fiber, setFiber] = useState('');

  // Optional nutrients
  const [showOptional, setShowOptional] = useState(false);
  const [saturatedFat, setSaturatedFat] = useState('');
  const [transFat, setTransFat] = useState('');
  const [sugar, setSugar] = useState('');
  const [sodium, setSodium] = useState('');
  const [potassium, setPotassium] = useState('');
  const [calcium, setCalcium] = useState('');
  const [iron, setIron] = useState('');
  const [vitaminA, setVitaminA] = useState('');
  const [vitaminC, setVitaminC] = useState('');
  const [vitaminD, setVitaminD] = useState('');
  const [vitaminB12, setVitaminB12] = useState('');
  const [magnesium, setMagnesium] = useState('');
  const [zinc, setZinc] = useState('');
  const [omega3, setOmega3] = useState('');
  const [cholesterol, setCholesterol] = useState('');

  // Search
  const [search, setSearch] = useState('');

  // Expanded food
  const [expandedId, setExpandedId] = useState<string | null>(null);

  function resetForm() {
    setName(''); setBrand(''); setCategory(''); setServingDesc(''); setServingGrams('');
    setCalories(''); setProtein(''); setCarbs(''); setFat(''); setFiber('');
    setSaturatedFat(''); setTransFat(''); setSugar(''); setSodium(''); setPotassium('');
    setCalcium(''); setIron(''); setVitaminA(''); setVitaminC(''); setVitaminD('');
    setVitaminB12(''); setMagnesium(''); setZinc(''); setOmega3(''); setCholesterol('');
    setShowOptional(false);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !calories || !protein || !carbs || !fat || !fiber) return;

    const brandVal = brand.trim();
    const catVal = category.trim();
    const servDescVal = servingDesc.trim();
    const servGramsVal = servingGrams ? Number(servingGrams) : undefined;

    const nutrients: NutrientsPer100g = {
      calories: Number(calories),
      protein: Number(protein),
      carbs: Number(carbs),
      fat: Number(fat),
      fiber: Number(fiber),
      ...(saturatedFat && { saturatedFat: Number(saturatedFat) }),
      ...(transFat && { transFat: Number(transFat) }),
      ...(sugar && { sugar: Number(sugar) }),
      ...(sodium && { sodium: Number(sodium) }),
      ...(potassium && { potassium: Number(potassium) }),
      ...(calcium && { calcium: Number(calcium) }),
      ...(iron && { iron: Number(iron) }),
      ...(vitaminA && { vitaminA: Number(vitaminA) }),
      ...(vitaminC && { vitaminC: Number(vitaminC) }),
      ...(vitaminD && { vitaminD: Number(vitaminD) }),
      ...(vitaminB12 && { vitaminB12: Number(vitaminB12) }),
      ...(magnesium && { magnesium: Number(magnesium) }),
      ...(zinc && { zinc: Number(zinc) }),
      ...(omega3 && { omega3: Number(omega3) }),
      ...(cholesterol && { cholesterol: Number(cholesterol) }),
    };

    await createFood({
      name: name.trim(),
      ...(brandVal && { brand: brandVal }),
      ...(catVal && { category: catVal }),
      ...(servDescVal && { servingDescription: servDescVal }),
      ...(servGramsVal !== undefined && { servingGrams: servGramsVal }),
      nutrients,
    });
    resetForm();
  }

  const filteredFoods = state.status === 'ok'
    ? state.foods.filter((f) => f.active && f.name.toLowerCase().includes(search.toLowerCase()))
    : [];

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 24 }}>Alimentos</h1>

      {/* Create food form */}
      <form onSubmit={handleCreate} style={{ marginBottom: 32, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <input type="text" placeholder="Nome *" value={name} onChange={(e) => setName(e.target.value)} required style={{ ...inputStyle, flex: 2, minWidth: 180 }} />
          <input type="text" placeholder="Marca (opcional)" value={brand} onChange={(e) => setBrand(e.target.value)} style={{ ...inputStyle, flex: 1, minWidth: 120 }} />
          <input type="text" placeholder="Categoria (opcional)" value={category} onChange={(e) => setCategory(e.target.value)} style={{ ...inputStyle, flex: 1, minWidth: 120 }} />
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <input type="text" placeholder="Descricao da porcao (opcional)" value={servingDesc} onChange={(e) => setServingDesc(e.target.value)} style={{ ...inputStyle, flex: 2, minWidth: 180 }} />
          <input type="number" placeholder="Gramas da porcao" value={servingGrams} onChange={(e) => setServingGrams(e.target.value)} min={1} style={{ ...inputStyle, flex: 1, minWidth: 100 }} />
        </div>

        <p style={{ fontSize: 13, color: 'var(--label)', margin: '4px 0 0' }}>Nutrientes por 100g (obrigatorios):</p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <input type="number" placeholder="Calorias *" value={calories} onChange={(e) => setCalories(e.target.value)} required step="any" style={{ ...inputStyle, maxWidth: 110 }} />
          <input type="number" placeholder="Proteina *" value={protein} onChange={(e) => setProtein(e.target.value)} required step="any" style={{ ...inputStyle, maxWidth: 110 }} />
          <input type="number" placeholder="Carbs *" value={carbs} onChange={(e) => setCarbs(e.target.value)} required step="any" style={{ ...inputStyle, maxWidth: 110 }} />
          <input type="number" placeholder="Gordura *" value={fat} onChange={(e) => setFat(e.target.value)} required step="any" style={{ ...inputStyle, maxWidth: 110 }} />
          <input type="number" placeholder="Fibra *" value={fiber} onChange={(e) => setFiber(e.target.value)} required step="any" style={{ ...inputStyle, maxWidth: 110 }} />
        </div>

        <button type="button" onClick={() => setShowOptional(!showOptional)} style={{ ...linkBtnStyle, alignSelf: 'flex-start', fontSize: 13 }}>
          {showOptional ? 'Ocultar nutrientes opcionais' : 'Mostrar nutrientes opcionais'}
        </button>

        {showOptional && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <input type="number" placeholder="Gord. sat." value={saturatedFat} onChange={(e) => setSaturatedFat(e.target.value)} step="any" style={{ ...inputStyle, maxWidth: 100 }} />
            <input type="number" placeholder="Gord. trans" value={transFat} onChange={(e) => setTransFat(e.target.value)} step="any" style={{ ...inputStyle, maxWidth: 100 }} />
            <input type="number" placeholder="Acucar" value={sugar} onChange={(e) => setSugar(e.target.value)} step="any" style={{ ...inputStyle, maxWidth: 100 }} />
            <input type="number" placeholder="Sodio (mg)" value={sodium} onChange={(e) => setSodium(e.target.value)} step="any" style={{ ...inputStyle, maxWidth: 100 }} />
            <input type="number" placeholder="Potassio (mg)" value={potassium} onChange={(e) => setPotassium(e.target.value)} step="any" style={{ ...inputStyle, maxWidth: 100 }} />
            <input type="number" placeholder="Calcio (mg)" value={calcium} onChange={(e) => setCalcium(e.target.value)} step="any" style={{ ...inputStyle, maxWidth: 100 }} />
            <input type="number" placeholder="Ferro (mg)" value={iron} onChange={(e) => setIron(e.target.value)} step="any" style={{ ...inputStyle, maxWidth: 100 }} />
            <input type="number" placeholder="Vit. A (mcg)" value={vitaminA} onChange={(e) => setVitaminA(e.target.value)} step="any" style={{ ...inputStyle, maxWidth: 100 }} />
            <input type="number" placeholder="Vit. C (mg)" value={vitaminC} onChange={(e) => setVitaminC(e.target.value)} step="any" style={{ ...inputStyle, maxWidth: 100 }} />
            <input type="number" placeholder="Vit. D (mcg)" value={vitaminD} onChange={(e) => setVitaminD(e.target.value)} step="any" style={{ ...inputStyle, maxWidth: 100 }} />
            <input type="number" placeholder="Vit. B12 (mcg)" value={vitaminB12} onChange={(e) => setVitaminB12(e.target.value)} step="any" style={{ ...inputStyle, maxWidth: 110 }} />
            <input type="number" placeholder="Magnesio (mg)" value={magnesium} onChange={(e) => setMagnesium(e.target.value)} step="any" style={{ ...inputStyle, maxWidth: 110 }} />
            <input type="number" placeholder="Zinco (mg)" value={zinc} onChange={(e) => setZinc(e.target.value)} step="any" style={{ ...inputStyle, maxWidth: 100 }} />
            <input type="number" placeholder="Omega 3 (g)" value={omega3} onChange={(e) => setOmega3(e.target.value)} step="any" style={{ ...inputStyle, maxWidth: 100 }} />
            <input type="number" placeholder="Colesterol (mg)" value={cholesterol} onChange={(e) => setCholesterol(e.target.value)} step="any" style={{ ...inputStyle, maxWidth: 110 }} />
          </div>
        )}

        <button type="submit" style={{ ...btnStyle, alignSelf: 'flex-start' }}>Criar alimento</button>
      </form>

      {/* Search */}
      <input
        type="text"
        placeholder="Buscar alimento..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ ...inputStyle, width: '100%', marginBottom: 16 }}
      />

      {/* Food list */}
      {state.status === 'loading' && <p style={{ color: 'var(--text-muted)' }}>Carregando...</p>}
      {state.status === 'error' && <p style={{ color: 'var(--priority-high-text)' }}>Erro: {state.message}</p>}
      {state.status === 'ok' && filteredFoods.length === 0 && (
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Nenhum alimento encontrado.</p>
      )}
      {state.status === 'ok' && (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {filteredFoods.map((food) => (
            <li key={food.id} style={{ borderBottom: '1px solid var(--border)', padding: '12px 0' }}>
              <div
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                onClick={() => setExpandedId(expandedId === food.id ? null : food.id)}
              >
                <div>
                  <span style={{ color: 'var(--text)', fontWeight: 500, fontSize: 14 }}>{food.name}</span>
                  {food.brand && <span style={{ color: 'var(--text-muted)', fontSize: 12, marginLeft: 8 }}>{food.brand}</span>}
                  {food.category && (
                    <span style={{ fontSize: 11, color: 'var(--text-badge)', background: 'var(--bg-badge)', padding: '1px 6px', borderRadius: 4, marginLeft: 8 }}>
                      {food.category}
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                    {food.nutrients.calories} kcal | {food.nutrients.protein}g prot /100g
                  </span>
                  <button
                    onClick={(e) => { e.stopPropagation(); void archiveFood(food.id); }}
                    style={{ background: 'none', border: 'none', color: 'var(--priority-high-text)', cursor: 'pointer', fontSize: 13, padding: '4px 8px' }}
                  >
                    Arquivar
                  </button>
                </div>
              </div>

              {expandedId === food.id && (
                <div style={{ marginTop: 8, padding: '8px 12px', background: 'var(--bg-badge)', borderRadius: 6, fontSize: 13 }}>
                  <NutrientTable nutrients={food.nutrients} />
                  {food.servingDescription && (
                    <p style={{ color: 'var(--text-muted)', margin: '8px 0 0', fontSize: 12 }}>
                      Porcao: {food.servingDescription}{food.servingGrams ? ` (${food.servingGrams}g)` : ''}
                    </p>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ── NutrientTable component ─────────────────────────────────────────────────

function NutrientTable({ nutrients }: { nutrients: NutrientsPer100g }) {
  const rows: Array<{ label: string; value: number | undefined; unit: string }> = [
    { label: 'Calorias', value: nutrients.calories, unit: 'kcal' },
    { label: 'Proteina', value: nutrients.protein, unit: 'g' },
    { label: 'Carboidratos', value: nutrients.carbs, unit: 'g' },
    { label: 'Gordura', value: nutrients.fat, unit: 'g' },
    { label: 'Fibra', value: nutrients.fiber, unit: 'g' },
    { label: 'Gord. saturada', value: nutrients.saturatedFat, unit: 'g' },
    { label: 'Gord. trans', value: nutrients.transFat, unit: 'g' },
    { label: 'Acucar', value: nutrients.sugar, unit: 'g' },
    { label: 'Sodio', value: nutrients.sodium, unit: 'mg' },
    { label: 'Potassio', value: nutrients.potassium, unit: 'mg' },
    { label: 'Calcio', value: nutrients.calcium, unit: 'mg' },
    { label: 'Ferro', value: nutrients.iron, unit: 'mg' },
    { label: 'Vitamina A', value: nutrients.vitaminA, unit: 'mcg' },
    { label: 'Vitamina C', value: nutrients.vitaminC, unit: 'mg' },
    { label: 'Vitamina D', value: nutrients.vitaminD, unit: 'mcg' },
    { label: 'Vitamina B12', value: nutrients.vitaminB12, unit: 'mcg' },
    { label: 'Magnesio', value: nutrients.magnesium, unit: 'mg' },
    { label: 'Zinco', value: nutrients.zinc, unit: 'mg' },
    { label: 'Omega 3', value: nutrients.omega3, unit: 'g' },
    { label: 'Colesterol', value: nutrients.cholesterol, unit: 'mg' },
  ];

  return (
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
      <thead>
        <tr>
          <th style={{ textAlign: 'left', color: 'var(--text-muted)', fontWeight: 600, paddingBottom: 4, borderBottom: '1px solid var(--border)' }}>Nutriente</th>
          <th style={{ textAlign: 'right', color: 'var(--text-muted)', fontWeight: 600, paddingBottom: 4, borderBottom: '1px solid var(--border)' }}>Por 100g</th>
        </tr>
      </thead>
      <tbody>
        {rows.filter((r) => r.value !== undefined).map((row) => (
          <tr key={row.label}>
            <td style={{ color: 'var(--text)', padding: '2px 0' }}>{row.label}</td>
            <td style={{ color: 'var(--text)', padding: '2px 0', textAlign: 'right' }}>{row.value} {row.unit}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border-input)', fontSize: 14, outline: 'none',
};

const btnStyle: React.CSSProperties = {
  padding: '10px 20px', borderRadius: 6, border: 'none',
  background: 'var(--btn-bg)', color: 'var(--btn-text)', cursor: 'pointer', fontSize: 14, fontWeight: 600,
};

const linkBtnStyle: React.CSSProperties = {
  padding: '6px 12px', borderRadius: 6, border: '1px solid var(--border-input)',
  background: 'var(--bg-input)', color: 'var(--text)', cursor: 'pointer',
};
