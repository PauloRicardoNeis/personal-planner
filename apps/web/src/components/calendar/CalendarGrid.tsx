import type { ISODate } from '@planner/core';
import type { DayEntry } from '../../hooks/useCalendar.js';
import { CalendarDayCell } from './CalendarDayCell.js';

const WEEKDAY_HEADERS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

interface Props {
  weeks: ISODate[][];
  dayMap: Map<ISODate, DayEntry>;
  currentMonth: number;
  today: ISODate;
  selectedDate: ISODate | null;
  onSelectDate: (date: ISODate) => void;
}

const emptyEntry = (date: ISODate): DayEntry => ({ date, deveres: [] });

export function CalendarGrid({
  weeks,
  dayMap,
  currentMonth,
  today,
  selectedDate,
  onSelectDate,
}: Props) {
  return (
    <div>
      {/* Weekday header */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(7, 1fr)',
        gap: 4,
        marginBottom: 4,
      }}>
        {WEEKDAY_HEADERS.map((h) => (
          <div key={h} style={{
            textAlign: 'center',
            fontSize: 11,
            fontWeight: 700,
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            padding: '4px 0',
          }}>
            {h}
          </div>
        ))}
      </div>

      {/* Week rows */}
      {weeks.map((week, wi) => (
        <div key={wi} style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: 4,
          marginBottom: 4,
        }}>
          {week.map((date) => {
            const dateMonth = new Date(date + 'T00:00:00').getMonth();
            return (
              <CalendarDayCell
                key={date}
                date={date}
                entry={dayMap.get(date) ?? emptyEntry(date)}
                isToday={date === today}
                isCurrentMonth={dateMonth === currentMonth}
                isSelected={date === selectedDate}
                onClick={() => onSelectDate(date)}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}
