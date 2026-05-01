import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { HabitsPage } from '../../pages/HabitsPage.js';

describe('HabitsPage integration', () => {
  afterEach(() => {
    cleanup();
    localStorage.clear();
  });

  it('creates and reloads a weighted habit without falling back to one', async () => {
    const user = userEvent.setup();
    render(<HabitsPage />);

    await screen.findByText(/Nenhum.*primeiro acima\./);
    await user.type(screen.getByPlaceholderText('Nome do habito'), 'Treino');

    const timesPerDayInput = screen.getByPlaceholderText('Vezes/dia');
    await user.clear(timesPerDayInput);
    await user.type(timesPerDayInput, '4');

    const valueWeightsInput = screen.getByPlaceholderText('Pesos por vez, ex: 5, 2, 1');
    await user.clear(valueWeightsInput);
    await user.type(valueWeightsInput, '2');

    await user.click(screen.getByRole('button', { name: 'Criar' }));

    await waitFor(() => expect(screen.getByText('0/4 vezes')).toBeTruthy());
    expect(screen.getByText('0/8 pts')).toBeTruthy();
  });
});
