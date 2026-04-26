import { useMemo, useState } from 'react';
import {
  getSaudeDueInfo,
  todayISODate,
  type ISODate,
  type RecurrenceConfig,
  type SaudeEventInput,
  type SaudeEventKind,
  type SaudeItem,
  type SaudeItemId,
  type SaudeItemType,
  type SaudeSchedule,
  type WeekdayName,
} from '@planner/core';
import { useSaude } from '../hooks/useSaude.js';

type ScheduleMode = SaudeSchedule['mode'];
type RecurrenceType = RecurrenceConfig['type'];

const ALL_WEEKDAYS: { key: WeekdayName; label: string }[] = [
  { key: 'monday', label: 'Seg' },
  { key: 'tuesday', label: 'Ter' },
  { key: 'wednesday', label: 'Qua' },
  { key: 'thursday', label: 'Qui' },
  { key: 'friday', label: 'Sex' },
  { key: 'saturday', label: 'Sab' },
  { key: 'sunday', label: 'Dom' },
];

const TYPE_LABELS: Record<SaudeItemType, string> = {
  consulta: 'Consulta',
  exame: 'Exame',
  retorno: 'Retorno',
  medicacao: 'Medicação',
  compra_medicacao: 'Compra de remédio',
};

export function SaudePage() {
  const { state, createSaudeItem, recordSaudeEvent, archiveSaudeItem } = useSaude();
  const [title, setTitle] = useState('');
  const [type, setType] = useState<SaudeItemType>('consulta');
  const [specialty, setSpecialty] = useState('');
  const [providerName, setProviderName] = useState('');
  const [clinicName, setClinicName] = useState('');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [costEstimate, setCostEstimate] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [scheduleMode, setScheduleMode] = useState<ScheduleMode>('once');
  const [onceDate, setOnceDate] = useState('');
  const [recurrenceType, setRecurrenceType] = useState<RecurrenceType>('weekly');
  const [weekdays, setWeekdays] = useState<WeekdayName[]>(['monday']);
  const [monthDay, setMonthDay] = useState(1);
  const [intervalValue, setIntervalValue] = useState(30);
  const [intervalUnit, setIntervalUnit] = useState<'days' | 'weeks' | 'months'>('days');
  const [anchorDate, setAnchorDate] = useState('');
  const [manualNextDate, setManualNextDate] = useState('');

  const items = useMemo(() => {
    if (state.status !== 'ok') return [];
    const today = todayISODate();
    return [...state.items].sort((a, b) => {
      const dueA = getSaudeDueInfo(a, today);
      const dueB = getSaudeDueInfo(b, today);
      if (!!dueA !== !!dueB) return dueA ? -1 : 1;
      if (dueA && dueB && dueA.isOverdue !== dueB.isOverdue) return dueA.isOverdue ? -1 : 1;
      return a.title.localeCompare(b.title, 'pt-BR');
    });
  }, [state]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;

    let schedule: SaudeSchedule;

    if (scheduleMode === 'once') {
      if (!onceDate) {
        alert('Defina a data do item de saúde.');
        return;
      }
      schedule = { mode: 'once', date: onceDate as ISODate };
    } else if (scheduleMode === 'calendar_rule') {
      let recurrence: RecurrenceConfig;
      if (recurrenceType === 'daily') {
        recurrence = { type: 'daily' };
      } else if (recurrenceType === 'weekly') {
        if (weekdays.length === 0) {
          alert('Selecione ao menos um dia da semana.');
          return;
        }
        recurrence = { type: 'weekly', weekdays: weekdays as [WeekdayName, ...WeekdayName[]] };
      } else {
        recurrence = { type: 'monthly', monthDay };
      }
      schedule = { mode: 'calendar_rule', recurrence };
    } else if (scheduleMode === 'after_completion_interval') {
      schedule = {
        mode: 'after_completion_interval',
        unit: intervalUnit,
        value: intervalValue,
        ...(anchorDate && { anchorDate: anchorDate as ISODate }),
      };
    } else {
      schedule = {
        mode: 'manual_next_date',
        ...(manualNextDate && { nextDate: manualNextDate as ISODate }),
      };
    }

    await createSaudeItem({
      type,
      title: title.trim(),
      ...(specialty.trim() && { specialty: specialty.trim() }),
      ...(providerName.trim() && { providerName: providerName.trim() }),
      ...(clinicName.trim() && { clinicName: clinicName.trim() }),
      ...(location.trim() && { location: location.trim() }),
      ...(notes.trim() && { notes: notes.trim() }),
      ...(costEstimate && { costEstimate: Number(costEstimate) }),
      priority,
      schedule,
    });

    setTitle('');
    setSpecialty('');
    setProviderName('');
    setClinicName('');
    setLocation('');
    setNotes('');
    setCostEstimate('');
    setOnceDate('');
    setManualNextDate('');
    setAnchorDate('');
  }

  function toggleWeekday(day: WeekdayName) {
    setWeekdays((prev) => (prev.includes(day) ? prev.filter((value) => value !== day) : [...prev, day]));
  }

  return (
    <div>
      <h1 style={pageTitleStyle}>Saúde</h1>

      <form onSubmit={handleCreate} style={formStyle}>
        <div style={rowStyle}>
          <input
            type="text"
            placeholder="Título do acompanhamento"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            style={{ ...inputStyle, flex: 2, minWidth: 220 }}
          />
          <select value={type} onChange={(e) => setType(e.target.value as SaudeItemType)} style={selectStyle}>
            {Object.entries(TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
          <select value={priority} onChange={(e) => setPriority(e.target.value as 'low' | 'medium' | 'high')} style={selectStyle}>
            <option value="high">Prioridade: Alta</option>
            <option value="medium">Prioridade: Média</option>
            <option value="low">Prioridade: Baixa</option>
          </select>
        </div>

        <div style={rowStyle}>
          <input type="text" placeholder="Especialidade" value={specialty} onChange={(e) => setSpecialty(e.target.value)} style={{ ...inputStyle, flex: 1 }} />
          <input type="text" placeholder="Profissional" value={providerName} onChange={(e) => setProviderName(e.target.value)} style={{ ...inputStyle, flex: 1 }} />
          <input type="text" placeholder="Clínica ou laboratório" value={clinicName} onChange={(e) => setClinicName(e.target.value)} style={{ ...inputStyle, flex: 1 }} />
        </div>

        <div style={rowStyle}>
          <input type="text" placeholder="Local" value={location} onChange={(e) => setLocation(e.target.value)} style={{ ...inputStyle, flex: 1 }} />
          <input type="number" min={0} step="0.01" placeholder="Custo estimado" value={costEstimate} onChange={(e) => setCostEstimate(e.target.value)} style={{ ...inputStyle, maxWidth: 160 }} />
          <select value={scheduleMode} onChange={(e) => setScheduleMode(e.target.value as ScheduleMode)} style={selectStyle}>
            <option value="once">Data única</option>
            <option value="calendar_rule">Regra fixa</option>
            <option value="after_completion_interval">Intervalo após concluir</option>
            <option value="manual_next_date">Próxima data manual</option>
          </select>
        </div>

        {scheduleMode === 'once' && (
          <div style={rowStyle}>
            <label style={labelStyle}>Data:</label>
            <input type="date" value={onceDate} onChange={(e) => setOnceDate(e.target.value)} style={inputStyle} />
          </div>
        )}

        {scheduleMode === 'calendar_rule' && (
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
                      ...dayButtonStyle,
                      ...(weekdays.includes(key) ? activeDayButtonStyle : {}),
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}

            {recurrenceType === 'monthly' && (
              <div style={rowStyle}>
                <label style={labelStyle}>Dia do mês:</label>
                <input type="number" min={1} max={31} value={monthDay} onChange={(e) => setMonthDay(Number(e.target.value))} style={{ ...inputStyle, maxWidth: 100 }} />
              </div>
            )}
          </div>
        )}

        {scheduleMode === 'after_completion_interval' && (
          <div style={rowStyle}>
            <input type="number" min={1} value={intervalValue} onChange={(e) => setIntervalValue(Number(e.target.value))} style={{ ...inputStyle, maxWidth: 100 }} />
            <select value={intervalUnit} onChange={(e) => setIntervalUnit(e.target.value as 'days' | 'weeks' | 'months')} style={selectStyle}>
              <option value="days">dias</option>
              <option value="weeks">semanas</option>
              <option value="months">meses</option>
            </select>
            <label style={labelStyle}>Data inicial opcional:</label>
            <input type="date" value={anchorDate} onChange={(e) => setAnchorDate(e.target.value)} style={inputStyle} />
          </div>
        )}

        {scheduleMode === 'manual_next_date' && (
          <div style={rowStyle}>
            <label style={labelStyle}>Próxima data:</label>
            <input type="date" value={manualNextDate} onChange={(e) => setManualNextDate(e.target.value)} style={inputStyle} />
          </div>
        )}

        <textarea
          placeholder="Observações"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          style={{ ...inputStyle, resize: 'vertical' }}
        />

        <button type="submit" style={btnStyle}>Criar acompanhamento</button>
      </form>

      {state.status === 'loading' && <p style={messageStyle}>Carregando...</p>}
      {state.status === 'error' && <p style={errorStyle}>Erro: {state.message}</p>}
      {state.status === 'ok' && items.length === 0 && <p style={messageStyle}>Nenhum acompanhamento ativo.</p>}
      {state.status === 'ok' && items.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {items.map((item) => (
            <SaudeCard
              key={item.id}
              item={item}
              onRecordEvent={recordSaudeEvent}
              onArchive={archiveSaudeItem}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function SaudeCard({
  item,
  onRecordEvent,
  onArchive,
}: {
  item: SaudeItem;
  onRecordEvent: (id: SaudeItemId, input: SaudeEventInput) => Promise<void> | void;
  onArchive: (id: SaudeItemId) => Promise<void> | void;
}) {
  const today = todayISODate();
  const dueInfo = getSaudeDueInfo(item, today);
  const [kind, setKind] = useState<SaudeEventKind>(item.type === 'compra_medicacao' ? 'purchased' : 'completed');
  const [date, setDate] = useState<string>(today);
  const [notes, setNotes] = useState('');
  const [cost, setCost] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await onRecordEvent(item.id, {
      kind,
      date: date as ISODate,
      ...(notes.trim() && { notes: notes.trim() }),
      ...(cost && { cost: Number(cost) }),
    });
    setNotes('');
    setCost('');
  }

  return (
    <section style={cardStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 10 }}>
        <div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
            <strong style={{ fontSize: 15, color: 'var(--text)' }}>{item.title}</strong>
            <Badge>{TYPE_LABELS[item.type]}</Badge>
            {dueInfo && <Badge tone={dueInfo.isOverdue ? 'danger' : 'accent'}>{dueInfo.isOverdue ? `Atrasado desde ${dueInfo.dueDate}` : `Devido em ${dueInfo.dueDate}`}</Badge>}
          </div>
          <p style={metaStyle}>{formatSaudeMeta(item)}</p>
          <p style={metaStyle}>{formatSchedule(item.schedule)}</p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <button
            onClick={() => onRecordEvent(item.id, { kind: item.type === 'compra_medicacao' ? 'purchased' : 'completed', date: today })}
            style={btnStyle}
          >
            {item.type === 'compra_medicacao' ? 'Registrar compra hoje' : 'Concluir hoje'}
          </button>
          <button onClick={() => onArchive(item.id)} style={ghostBtnStyle}>Arquivar</button>
        </div>
      </div>

      {item.notes && <p style={{ ...metaStyle, marginBottom: 12 }}>{item.notes}</p>}

      <form onSubmit={handleSubmit} style={{ ...formStyle, marginBottom: 12 }}>
        <div style={rowStyle}>
          <select value={kind} onChange={(e) => setKind(e.target.value as SaudeEventKind)} style={selectStyle}>
            <option value="completed">Conclusão</option>
            <option value="purchased">Compra</option>
            <option value="note">Nota</option>
          </select>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={inputStyle} />
          <input type="number" min={0} step="0.01" value={cost} onChange={(e) => setCost(e.target.value)} placeholder="Custo" style={{ ...inputStyle, maxWidth: 140 }} />
        </div>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          placeholder="Observação do evento"
          style={{ ...inputStyle, resize: 'vertical' }}
        />
        <button type="submit" style={btnStyle}>Registrar evento</button>
      </form>

      {item.events.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={historyTitleStyle}>Histórico recente</span>
          {item.events.slice(0, 4).map((event) => (
            <div key={event.id} style={historyRowStyle}>
              <span>{event.date}</span>
              <span>{event.kind}</span>
              {event.cost !== undefined && <span>R$ {event.cost.toFixed(2)}</span>}
              {event.notes && <span style={{ color: 'var(--text-secondary)' }}>{event.notes}</span>}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function formatSaudeMeta(item: SaudeItem): string {
  return [item.specialty, item.providerName, item.clinicName, item.location].filter(Boolean).join(' • ') || 'Sem detalhes adicionais';
}

function formatSchedule(schedule: SaudeSchedule): string {
  switch (schedule.mode) {
    case 'once':
      return `Data única: ${schedule.date}`;
    case 'manual_next_date':
      return schedule.nextDate ? `Próxima data manual: ${schedule.nextDate}` : 'Próxima data manual ainda não definida';
    case 'after_completion_interval':
      return `Intervalo de ${schedule.value} ${schedule.unit}${schedule.anchorDate ? ` (início: ${schedule.anchorDate})` : ''}`;
    case 'calendar_rule':
      if (schedule.recurrence.type === 'daily') return 'Recorrência diária';
      if (schedule.recurrence.type === 'weekly') return `Recorrência semanal: ${schedule.recurrence.weekdays.join(', ')}`;
      return `Recorrência mensal no dia ${schedule.recurrence.monthDay}`;
  }
}

function Badge({ children, tone = 'muted' }: { children: React.ReactNode; tone?: 'muted' | 'accent' | 'danger' }) {
  const palette = {
    muted: { background: 'var(--bg-badge)', color: 'var(--text-badge)' },
    accent: { background: 'var(--accent-soft)', color: 'var(--accent)' },
    danger: { background: 'var(--overdue-bg)', color: 'var(--overdue-text)' },
  };
  return (
    <span style={{
      fontSize: 11,
      fontWeight: 600,
      padding: '2px 8px',
      borderRadius: 'var(--radius-xs)',
      ...palette[tone],
    }}>
      {children}
    </span>
  );
}

const pageTitleStyle: React.CSSProperties = {
  fontSize: 20,
  fontWeight: 700,
  marginBottom: 24,
  letterSpacing: '-0.3px',
  color: 'var(--text)',
};

const formStyle: React.CSSProperties = {
  marginBottom: 28,
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
};

const rowStyle: React.CSSProperties = {
  display: 'flex',
  gap: 8,
  flexWrap: 'wrap',
  alignItems: 'center',
};

const labelStyle: React.CSSProperties = {
  fontSize: 12,
  color: 'var(--text-muted)',
  fontWeight: 500,
};

const inputStyle: React.CSSProperties = {
  padding: '9px 12px',
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--border-input)',
  fontSize: 13.5,
  outline: 'none',
  background: 'var(--bg-input)',
  color: 'var(--text)',
};

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  cursor: 'pointer',
};

const btnStyle: React.CSSProperties = {
  padding: '9px 18px',
  borderRadius: 'var(--radius-md)',
  border: 'none',
  background: 'var(--btn-bg)',
  color: 'var(--btn-text)',
  cursor: 'pointer',
  fontSize: 13,
  fontWeight: 600,
};

const ghostBtnStyle: React.CSSProperties = {
  ...btnStyle,
  background: 'transparent',
  color: 'var(--text-secondary)',
  border: '1px solid var(--border)',
};

const dayButtonStyle: React.CSSProperties = {
  padding: '4px 10px',
  borderRadius: 'var(--radius-sm)',
  fontSize: 13,
  cursor: 'pointer',
  border: '1px solid var(--border-input)',
  background: 'var(--bg-check)',
  color: 'var(--text)',
};

const activeDayButtonStyle: React.CSSProperties = {
  borderColor: 'var(--accent)',
  background: 'var(--accent-soft)',
  color: 'var(--accent)',
};

const cardStyle: React.CSSProperties = {
  background: 'var(--bg-card)',
  borderRadius: 'var(--radius-lg)',
  border: '1px solid var(--border)',
  padding: '18px 20px',
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
};

const metaStyle: React.CSSProperties = {
  color: 'var(--text-muted)',
  fontSize: 13,
  margin: '6px 0 0',
  lineHeight: 1.5,
};

const historyTitleStyle: React.CSSProperties = {
  fontSize: 11,
  color: 'var(--text-muted)',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  fontWeight: 700,
};

const historyRowStyle: React.CSSProperties = {
  display: 'flex',
  gap: 8,
  flexWrap: 'wrap',
  fontSize: 12,
  color: 'var(--text-muted)',
};

const messageStyle: React.CSSProperties = {
  color: 'var(--text-muted)',
  fontSize: 14,
};

const errorStyle: React.CSSProperties = {
  color: 'var(--priority-high-text)',
  fontSize: 14,
};
