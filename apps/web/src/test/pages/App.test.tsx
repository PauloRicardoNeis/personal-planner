import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { App } from '../../App.js';

vi.mock('../../components/UpdateBanner.js', () => ({
  UpdateBanner: () => <div data-testid="update-banner" />,
}));

vi.mock('../../hooks/useTimeTheme.js', () => ({
  useTimeTheme: vi.fn(),
  useDebugTime: () => ({
    enabled: false,
    hour: 12,
    setHour: vi.fn(),
    setEnabled: vi.fn(),
  }),
}));

vi.mock('../../pages/HojePage.js', () => ({ HojePage: () => <h1>Hoje mock</h1> }));
vi.mock('../../pages/HabitsPage.js', () => ({ HabitsPage: () => <h1>Habitos mock</h1> }));
vi.mock('../../pages/DeveresPage.js', () => ({ DeveresPage: () => <h1>Deveres mock</h1> }));
vi.mock('../../pages/ProjetosPage.js', () => ({ ProjetosPage: () => <h1>Projetos mock</h1> }));
vi.mock('../../pages/NutritionPage.js', () => ({ NutritionPage: () => <h1>Nutricao mock</h1> }));
vi.mock('../../pages/FoodsPage.js', () => ({ FoodsPage: () => <h1>Alimentos mock</h1> }));
vi.mock('../../pages/GamesPage.js', () => ({ GamesPage: () => <h1>Jogos mock</h1> }));
vi.mock('../../pages/BooksPage.js', () => ({ BooksPage: () => <h1>Livros mock</h1> }));
vi.mock('../../pages/FilmesPage.js', () => ({ FilmesPage: () => <h1>Filmes mock</h1> }));
vi.mock('../../pages/ProfilePage.js', () => ({ ProfilePage: () => <h1>Perfil mock</h1> }));
vi.mock('../../pages/CalendarPage.js', () => ({ CalendarPage: () => <h1>Calendario mock</h1> }));
vi.mock('../../pages/SaudePage.js', () => ({ SaudePage: () => <h1>Saude mock</h1> }));
vi.mock('../../pages/ComprasPage.js', () => ({ ComprasPage: () => <h1>Compras mock</h1> }));

describe('App', () => {
  afterEach(() => {
    cleanup();
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
    window.history.pushState({}, '', '/');
  });

  it('renders the app shell and current route', () => {
    window.history.pushState({}, '', '/habitos');

    render(<App />);

    expect(screen.getByText('Planner')).toBeTruthy();
    expect(screen.getByTestId('update-banner')).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Habitos mock' })).toBeTruthy();
    expect(screen.getByRole('link', { name: /Hoje/ })).toBeTruthy();
  });

  it('cycles and persists static themes', async () => {
    const user = userEvent.setup();
    localStorage.setItem('theme', 'light');

    render(<App />);

    expect(document.documentElement.getAttribute('data-theme')).toBe('light');

    await user.click(screen.getByRole('button', { name: /Dia/ }));
    expect(localStorage.getItem('theme')).toBe('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');

    await user.click(screen.getByRole('button', { name: /Noite/ }));
    expect(localStorage.getItem('theme')).toBe('dynamic');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dynamic');
  });
});
