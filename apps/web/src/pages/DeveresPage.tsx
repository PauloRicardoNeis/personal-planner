import { useState } from 'react';
import { type RecurrenceConfig, type WeekdayName, type ISODate, type ISODateTime, todayISODate } from '@planner/core';
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
  const [inicio, setInicio] = useState('');
  const [fim, setFim] = useState('');
  const [recurrenceType, setRecurrenceType] = useState<RecurrenceType>('daily');
  const [weekdays, setWeekdays] = useState<WeekdayName[]>([]);
  const [monthDay, setMonthDay] = useState(1);
  const [monthDayEnd, setMonthDayEnd] = useState<number | ''>('');

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;

    const areaVal = area.trim();
    const areaOpt = areaVal ? { area: areaVal } : {};
    // datetime-local returns "YYYY-MM-DDTHH:mm" — convert to full ISO 8601
    const inicioOpt = inicio ? { inicio: new Date(inicio).toISOString() as ISODateTime } : {};
    const fimOpt = fim ? { fim: fim as ISODate } : {};

    if (type === 'once') {
      const fimOpt2 = fim ? { fim: fim as ISODate } : {};
      await createDever({ type: 'once', title: title.trim(), ...fimOpt2, ...inicioOpt, ...areaOpt, priority });
    } else {
      let recurrence: RecurrenceConfig;
      if (recurrenceType === 'daily') {
        recurrence = { type: 'daily' };
      } else if (recurrenceType === 'weekly') {
        if (weekdays.length === 0) { alert('Selecione ao menos um dia da semana.'); return; }
        recurrence = { type: 'weekly', weekdays: weekdays as [WeekdayName, ...WeekdayName[]] };
      } else {
        recurrence = { type: 'monthly', monthDay, ...(monthDayEnd !== '' && { monthDayEnd }) };
      }
      await createDever({ type: 'cyclic', title: title.trim(), recurrence, ...inicioOpt, ...fimOpt, ...areaOpt, priority });
    }

    setTitle('');
    setArea('');
    setInicio('');
    setFim('');
    setMonthDayEnd('');
  }

  function toggleWeekday(day: WeekdayName) {
    setWeekdays((prev) => prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]);
  }

  return (
    <div>
      <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 24, letterSpacing: '-0.3px', color: 'var(--text)' }}>Deveres</h1>

      <form onSubmit={handleCreate} style={{ marginBottom: 32, display: 'flex', flexDirection: 'column', gap: 10 }}>
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

        {/* Início / Fim */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <div>
            <label style={labelStyle}>Início:</label>
            <input type="datetime-local" value={inicio} onChange={(e) => setInicio(e.target.value)} style={inputStyle} />
          </div>
          {type === 'once' && (
            <div>
              <label style={labelStyle}>Prazo (vazio = sem prazo):</label>
              <input type="date" value={fim} onChange={(e) => setFim(e.target.value)} style={inputStyle} />
            </div>
          )}
          {type === 'cyclic' && (
            <div>
              <label style={labelStyle}>Fim (opcional):</label>
              <input type="date" value={fim} onChange={(e) => setFim(e.target.value)} style={inputStyle} />
            </div>
          )}
        </div>

        {type === 'cyclic' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <select value={recurrenceType} onChange={(e) => setRecurrenceType(e.target.value as RecurrenceType)} style={selectStyle}>
              <option value="daily">Diário</option>
              <option value="weekly">Semanal</option>
              <option value="monthly">Mensal</option>
            </select>

            {recurrenceType === 'weekly' && (
              <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                {ALL_WEEKDAYS.map(({ key, label }) => (
                  <button
                    type="button"
                    key={key}
                    onClick={() => toggleWeekday(key)}
                    style={{
                      padding: '4px 10px', borderRadius: 'var(--radius-sm)', fontSize: 13, cursor: 'pointer',
                      border: weekdays.includes(key) ? '2px solid var(--btn-bg)' : '2px solid var(--border-input)',
                      background: weekdays.includes(key) ? 'var(--btn-bg)' : 'var(--bg-check)',
                      color: weekdays.includes(key) ? 'var(--btn-text)' : 'var(--text)',
                      transition: 'all var(--transition)',
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}

            {recurrenceType === 'monthly' && (
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <div>
                  <label style={labelStyle}>Dia início:</label>
                  <input type="number" min={1} max={31} value={monthDay} onChange={(e) => setMonthDay(Number(e.target.value))} style={{ ...inputStyle, maxWidth: 80 }} />
                </div>
                <div>
                  <label style={labelStyle}>Dia fim (opcional):</label>
                  <input type="number" min={1} max={31} value={monthDayEnd} onChange={(e) => setMonthDayEnd(e.target.value === '' ? '' : Number(e.target.value))} placeholder="—" style={{ ...inputStyle, maxWidth: 80 }} />
                </div>
              </div>
            )}
          </div>
        )}

        <button type="submit" style={btnStyle}>Criar dever</button>
      </form>

      {state.status === 'loading' && <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Carregando...</p>}
      {state.status === 'error' && <p style={{ color: 'var(--priority-high-text)', fontSize: 14 }}>Erro: {state.message}</p>}
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
  padding: '9px 22px', borderRadius: 'var(--radius-md)', border: 'none',
  background: 'var(--btn-bg)', color: 'var(--btn-text)', cursor: 'pointer',
  fontSize: 13.5, fontWeight: 600, alignSelf: 'flex-start',
  transition: 'background var(--transition)',
};
