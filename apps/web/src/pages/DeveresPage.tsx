import { useState } from 'react';
import { todayISODate, type RecurrenceConfig, type WeekdayName, type ISODate } from '@planner/core';
import { useDeveres } from '../hooks/useDeveres.js';
import { DeverList } from '../components/deveres/DeverList.js';

type FormType = 'once' | 'cyclic';
type RecurrenceType = 'daily' | 'weekly' | 'monthly';

const ALL_WEEKDAYS: { key: WeekdayName; label: string }[] = [
  { key: 'monday', label: 'Seg' },
  { key: 'tuesday', label: 'Ter' },
  { key: 'wednesday', label: 'Qua' },
  { key: 'thursday', label: 'Qui' },
  { key: 'friday', label: 'Sex' },
  { key: 'saturday', label: 'Sáb' },
  { key: 'sunday', label: 'Dom' },
];

export function DeveresPage() {
  const { state, createDever, markDone, unmarkDone, archive } = useDeveres();

  const [title, setTitle] = useState('');
  const [area, setArea] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [type, setType] = useState<FormType>('once');
  const [deadline, setDeadline] = useState(todayISODate());
  const [recurrenceType, setRecurrenceType] = useState<RecurrenceType>('daily');
  const [weekdays, setWeekdays] = useState<WeekdayName[]>([]);
  const [monthDay, setMonthDay] = useState(1);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;

    const areaVal = area.trim();
    const areaOpt = areaVal ? { area: areaVal } : {};

    if (type === 'once') {
      await createDever({ type: 'once', title: title.trim(), deadline: deadline as ISODate, ...areaOpt, priority });
    } else {
      let recurrence: RecurrenceConfig;
      if (recurrenceType === 'daily') {
        recurrence = { type: 'daily' };
      } else if (recurrenceType === 'weekly') {
        if (weekdays.length === 0) { alert('Selecione ao menos um dia da semana.'); return; }
        recurrence = { type: 'weekly', weekdays: weekdays as [WeekdayName, ...WeekdayName[]] };
      } else {
        recurrence = { type: 'monthly', monthDay };
      }
      await createDever({ type: 'cyclic', title: title.trim(), recurrence, ...areaOpt, priority });
    }

    setTitle('');
    setArea('');
  }

  function toggleWeekday(day: WeekdayName) {
    setWeekdays((prev) => prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]);
  }

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 24 }}>Deveres</h1>

      <form onSubmit={handleCreate} style={{ marginBottom: 32, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* Title + area */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <input type="text" placeholder="Nome do dever" value={title} onChange={(e) => setTitle(e.target.value)} required style={{ ...inputStyle, flex: 2, minWidth: 180 }} />
          <input type="text" placeholder="Área (opcional)" value={area} onChange={(e) => setArea(e.target.value)} style={{ ...inputStyle, flex: 1, minWidth: 120 }} />
        </div>

        {/* Priority + type */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <select value={priority} onChange={(e) => setPriority(e.target.value as 'low' | 'medium' | 'high')} style={selectStyle}>
            <option value="high">Prioridade: Alta</option>
            <option value="medium">Prioridade: Média</option>
            <option value="low">Prioridade: Baixa</option>
          </select>
          <select value={type} onChange={(e) => setType(e.target.value as FormType)} style={selectStyle}>
            <option value="once">Único</option>
            <option value="cyclic">Cíclico</option>
          </select>
        </div>

        {/* Conditional fields */}
        {type === 'once' && (
          <div>
            <label style={{ fontSize: 13, color: 'var(--label)', marginRight: 8 }}>Prazo:</label>
            <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value as ISODate)} required style={inputStyle} />
          </div>
        )}

        {type === 'cyclic' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <select value={recurrenceType} onChange={(e) => setRecurrenceType(e.target.value as RecurrenceType)} style={selectStyle}>
              <option value="daily">Diário</option>
              <option value="weekly">Semanal</option>
              <option value="monthly">Mensal</option>
            </select>

            {recurrenceType === 'weekly' && (
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {ALL_WEEKDAYS.map(({ key, label }) => (
                  <button
                    type="button"
                    key={key}
                    onClick={() => toggleWeekday(key)}
                    style={{
                      padding: '4px 10px', borderRadius: 6, fontSize: 13, cursor: 'pointer',
                      border: weekdays.includes(key) ? '2px solid var(--btn-bg)' : '2px solid var(--border-input)',
                      background: weekdays.includes(key) ? 'var(--btn-bg)' : 'var(--bg-check)',
                      color: weekdays.includes(key) ? 'var(--btn-text)' : 'var(--text)',
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}

            {recurrenceType === 'monthly' && (
              <div>
                <label style={{ fontSize: 13, color: 'var(--label)', marginRight: 8 }}>Dia do mês:</label>
                <input type="number" min={1} max={31} value={monthDay} onChange={(e) => setMonthDay(Number(e.target.value))} style={{ ...inputStyle, maxWidth: 80 }} />
              </div>
            )}
          </div>
        )}

        <button type="submit" style={btnStyle}>Criar dever</button>
      </form>

      {state.status === 'loading' && <p style={{ color: 'var(--text-muted)' }}>Carregando...</p>}
      {state.status === 'error' && <p style={{ color: 'var(--priority-high-text)' }}>Erro: {state.message}</p>}
      {state.status === 'ok' && (
        <DeverList
          deveres={state.deveres}
          onMarkDone={markDone}
          onUnmarkDone={unmarkDone}
          onArchive={archive}
        />
      )}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border-input)', fontSize: 14, outline: 'none',
};

const selectStyle: React.CSSProperties = {
  padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border-input)', fontSize: 14, outline: 'none',
};

const btnStyle: React.CSSProperties = {
  padding: '10px 20px', borderRadius: 6, border: 'none',
  background: 'var(--btn-bg)', color: 'var(--btn-text)', cursor: 'pointer', fontSize: 14, fontWeight: 600, alignSelf: 'flex-start',
};
