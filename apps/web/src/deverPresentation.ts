import {
  getMonthlyWindowInfo,
  getOnceDeverOccurrenceDate,
  hasExplicitDeverStart,
  type Dever,
  type ISODate,
  type OnceDever,
  type RecurrenceConfig,
} from '@planner/core';

export function getDeverOccurrenceDateForList(
  dever: Dever,
  today: ISODate,
): ISODate {
  if (dever.type === 'once') {
    return getOnceDeverOccurrenceDate(dever);
  }

  const windowInfo = getMonthlyWindowInfo(dever.recurrence, today);
  return windowInfo?.occurrenceDate ?? today;
}

export function getDeverMetaLabels(dever: Dever): string[] {
  if (dever.type === 'once') {
    return getOnceDeverMetaLabels(dever);
  }

  return [formatRecurrence(dever.recurrence)];
}

function getOnceDeverMetaLabels(dever: OnceDever): string[] {
  const labels: string[] = [];

  if (dever.fim) {
    labels.push(`prazo: ${formatDate(dever.fim)}`);
  }

  if (hasExplicitDeverStart(dever)) {
    labels.push(`${dever.fim ? 'início' : 'agendado'}: ${formatDateTime(dever.inicio)}`);
  }

  if (labels.length === 0) {
    labels.push('sem prazo');
  }

  return labels;
}

function formatDate(date: ISODate): string {
  return new Date(`${date}T00:00:00`).toLocaleDateString('pt-BR');
}

function formatDateTime(value: string): string {
  return new Date(value).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatRecurrence(config: RecurrenceConfig): string {
  if (config.type === 'daily') return 'diário';
  if (config.type === 'weekly') {
    const days = {
      monday: 'seg',
      tuesday: 'ter',
      wednesday: 'qua',
      thursday: 'qui',
      friday: 'sex',
      saturday: 'sáb',
      sunday: 'dom',
    };
    return `semanal: ${config.weekdays.map((day) => days[day]).join(', ')}`;
  }
  if (config.monthDayEnd != null) {
    return `mensal: dia ${config.monthDay} até ${config.monthDayEnd}`;
  }
  return `mensal: dia ${config.monthDay}`;
}
