import { useState } from 'react';
import type { ISODate } from '@planner/core';
import { useDeveres } from '../hooks/useDeveres.js';
import { useCalendar } from '../hooks/useCalendar.js';
import { CalendarGrid } from '../components/calendar/CalendarGrid.js';
import { CalendarDayPanel } from '../components/calendar/CalendarDayPanel.js';

const navBtnStyle: React.CSSProperties = {
  background: 'none',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius-sm)',
  padding: '4px 10px',
  cursor: 'pointer',
  color: 'var(--text-secondary)',
  fontSize: 15,
  lineHeight: 1.2,
  transition: 'all var(--transition)',
};

const todayBtnStyle: React.CSSProperties = {
  background: 'none',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius-sm)',
  padding: '4px 12px',
  cursor: 'pointer',
  color: 'var(--text-muted)',
  fontSize: 12,
  fontWeight: 500,
  transition: 'all var(--transition)',
};

export function CalendarPage() {
  const { state, markDone, unmarkDone } = useDeveres();
  const [selectedDate, setSelectedDate] = useState<ISODate | null>(null);

  const deveres = state.status === 'ok' ? state.deveres : [];
  const cal = useCalendar(deveres);

  const selectedEntry = selectedDate ? (cal.dayMap.get(selectedDate) ?? null) : null;

  function handleSelectDate(date: ISODate) {
    setSelectedDate((prev) => (prev === date ? null : date));
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '14px 24px',
        borderBottom: '1px solid var(--border)',
        flexShrink: 0,
      }}>
        <button style={navBtnStyle} onClick={cal.goToPrevMonth} aria-label="Mês anterior">‹</button>
        <h2 style={{
          flex: 1,
          textAlign: 'center',
          margin: 0,
          fontSize: 15,
          fontWeight: 600,
          color: 'var(--text)',
          textTransform: 'capitalize',
          letterSpacing: '-0.01em',
        }}>
          {cal.monthLabel}
        </h2>
        <button style={navBtnStyle} onClick={cal.goToNextMonth} aria-label="Próximo mês">›</button>
        <button style={todayBtnStyle} onClick={cal.goToToday}>Hoje</button>
      </div>

      {/* ── Body ───────────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* Grid */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
          {state.status === 'loading' && (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', marginTop: 40, fontSize: 14 }}>
              Carregando...
            </p>
          )}
          {state.status === 'error' && (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', marginTop: 40, fontSize: 14 }}>
              Erro: {state.message}
            </p>
          )}
          {state.status === 'ok' && (
            <CalendarGrid
              weeks={cal.weeks}
              dayMap={cal.dayMap}
              currentMonth={cal.month}
              today={cal.today}
              selectedDate={selectedDate}
              onSelectDate={handleSelectDate}
            />
          )}
        </div>

        {/* Day panel */}
        {selectedDate !== null && selectedEntry !== null && (
          <CalendarDayPanel
            date={selectedDate}
            entry={selectedEntry}
            onMarkDone={markDone}
            onUnmarkDone={unmarkDone}
            onClose={() => setSelectedDate(null)}
          />
        )}
      </div>

    </div>
  );
}
