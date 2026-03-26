import type { ISODate } from '@planner/core';
import type { DayEntry } from '../../hooks/useCalendar.js';

interface Props {
  date: ISODate;
  entry: DayEntry;
  isToday: boolean;
  isCurrentMonth: boolean;
  isSelected: boolean;
  onClick: () => void;
}

const PRIORITY_DOT_COLOR: Record<'high' | 'medium' | 'low', string> = {
  high: 'var(--priority-high-text)',
  medium: 'var(--priority-med-text)',
  low: 'var(--priority-low-text)',
};

export function CalendarDayCell({
  date,
  entry,
  isToday,
  isCurrentMonth,
  isSelected,
  onClick,
}: Props) {
  const dayNumber = Number(date.slice(8));
  const dots = entry.deveres.slice(0, 3);
  const overflow = entry.deveres.length - dots.length;

  return (
    <div
      onClick={onClick}
      style={{
        minHeight: 72,
        borderRadius: 8,
        padding: '6px 8px',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        background: isSelected ? 'var(--nav-active-bg)' : 'transparent',
        outline: isToday ? '2px solid var(--accent)' : undefined,
        outlineOffset: -2,
        opacity: isCurrentMonth ? 1 : 0.4,
        transition: 'background 0.1s',
      }}
    >
      {/* Day number */}
      <div style={{
        textAlign: 'right',
        fontSize: 13,
        fontWeight: isToday ? 700 : 400,
        color: isToday ? 'var(--accent)' : 'var(--text)',
      }}>
        {dayNumber}
      </div>

      {/* Dots row */}
      {entry.deveres.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 3, flexWrap: 'wrap', marginTop: 4 }}>
          {dots.map(({ dever, isDone }) => (
            <span
              key={dever.id}
              style={{
                width: 7,
                height: 7,
                borderRadius: '50%',
                background: PRIORITY_DOT_COLOR[dever.priority],
                opacity: isDone ? 0.3 : 1,
                flexShrink: 0,
              }}
            />
          ))}
          {overflow > 0 && (
            <span style={{ fontSize: 10, color: 'var(--text-muted)', lineHeight: 1 }}>
              +{overflow}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
