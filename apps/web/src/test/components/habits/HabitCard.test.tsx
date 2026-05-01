import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Habit, HabitId, ISODateTime } from '@planner/core';
import { HabitCard } from '../../../components/habits/HabitCard.js';

const habitId = (value: string) => value as HabitId;
const isoDateTime = (value: string) => value as ISODateTime;

function makeHabit(overrides: Partial<Habit> = {}): Habit {
  return {
    id: habitId('habit-1'),
    title: 'Anki',
    category: 'estudo',
    active: true,
    createdAt: isoDateTime('2026-04-01T00:00:00.000Z'),
    timesPerDay: 1,
    valueWeights: [1],
    completions: {},
    ...overrides,
  };
}

describe('HabitCard', () => {
  afterEach(() => {
    cleanup();
  });

  it('updates a habit preserving times per day and weights above one', async () => {
    const user = userEvent.setup();
    const habit = makeHabit();
    const onUpdate = vi.fn().mockResolvedValue({ ok: true, data: habit });

    render(
      <HabitCard
        habit={habit}
        onUpdate={onUpdate}
        onMarkDone={vi.fn()}
        onUnmarkDone={vi.fn()}
        onArchive={vi.fn()}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Editar' }));

    const timesPerDayInput = screen.getByPlaceholderText('Vezes/dia');
    await user.clear(timesPerDayInput);
    await user.type(timesPerDayInput, '3');

    const valueWeightsInput = screen.getByPlaceholderText('Pesos por vez, ex: 5, 2, 1');
    await user.clear(valueWeightsInput);
    await user.type(valueWeightsInput, '5, 2, 1');

    await user.click(screen.getByRole('button', { name: 'Salvar' }));

    await waitFor(() => expect(onUpdate).toHaveBeenCalled());
    expect(onUpdate).toHaveBeenCalledWith(habit.id, {
      title: 'Anki',
      category: 'estudo',
      timesPerDay: 3,
      valueWeights: [5, 2, 1],
    });
  });
});
