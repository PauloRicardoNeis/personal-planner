import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { HabitsPage } from '../../pages/HabitsPage.js';

const mocks = vi.hoisted(() => ({
  createHabit: vi.fn(),
  updateHabit: vi.fn(),
  markDone: vi.fn(),
  unmarkDone: vi.fn(),
  archive: vi.fn(),
}));

vi.mock('../../hooks/useHabits.js', () => ({
  useHabits: () => ({
    state: { status: 'ok', habits: [] },
    createHabit: mocks.createHabit,
    updateHabit: mocks.updateHabit,
    markDone: mocks.markDone,
    unmarkDone: mocks.unmarkDone,
    archive: mocks.archive,
  }),
}));

describe('HabitsPage', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('creates a habit preserving times per day and a weight above one', async () => {
    const user = userEvent.setup();
    render(<HabitsPage />);

    await user.type(screen.getByPlaceholderText('Nome do habito'), 'Treino');

    const timesPerDayInput = screen.getByPlaceholderText('Vezes/dia');
    await user.clear(timesPerDayInput);
    await user.type(timesPerDayInput, '4');

    const valueWeightsInput = screen.getByPlaceholderText('Pesos por vez, ex: 5, 2, 1');
    await user.clear(valueWeightsInput);
    await user.type(valueWeightsInput, '2');

    await user.click(screen.getByRole('button', { name: 'Criar' }));

    expect(mocks.createHabit).toHaveBeenCalledWith({
      title: 'Treino',
      timesPerDay: 4,
      valueWeights: [2, 2, 2, 2],
    });
  });
});
