import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { HojePage } from './pages/HojePage.js';
import { HabitsPage } from './pages/HabitsPage.js';
import { DeveresPage } from './pages/DeveresPage.js';
import { NutritionPage } from './pages/NutritionPage.js';
import { FoodsPage } from './pages/FoodsPage.js';
import { ProfilePage } from './pages/ProfilePage.js';
import { UpdateBanner } from './components/UpdateBanner.js';

type Theme = 'system' | 'light' | 'dark';
const THEMES: Theme[] = ['system', 'light', 'dark'];
const THEME_LABELS: Record<Theme, string> = { system: 'Sistema', light: 'Dia', dark: 'Noite' };

export function App() {
  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem('theme') as Theme) ?? 'system'
  );

  useEffect(() => {
    localStorage.setItem('theme', theme);
    if (theme === 'system') {
      document.documentElement.removeAttribute('data-theme');
    } else {
      document.documentElement.setAttribute('data-theme', theme);
    }
  }, [theme]);

  function cycleTheme() {
    setTheme(t => THEMES[(THEMES.indexOf(t) + 1) % THEMES.length]);
  }

  return (
    <BrowserRouter>
      <UpdateBanner />
      <div style={{ fontFamily: 'system-ui, sans-serif', maxWidth: 600, margin: '0 auto', padding: '0 16px' }}>
        <nav style={{ display: 'flex', gap: 16, padding: '16px 0', borderBottom: '1px solid var(--border-nav)', marginBottom: 24, flexWrap: 'wrap', alignItems: 'center' }}>
          <NavLink to="/" end style={navStyle}>Hoje</NavLink>
          <NavLink to="/habitos" style={navStyle}>Habitos</NavLink>
          <NavLink to="/deveres" style={navStyle}>Deveres</NavLink>
          <NavLink to="/nutricao" style={navStyle}>Nutricao</NavLink>
          <NavLink to="/alimentos" style={navStyle}>Alimentos</NavLink>
          <NavLink to="/perfil" style={navStyle}>Perfil</NavLink>
          <button onClick={cycleTheme} style={{ marginLeft: 'auto', background: 'none', border: '1px solid var(--border-nav)', borderRadius: 4, padding: '2px 10px', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 13 }}>
            {THEME_LABELS[theme]}
          </button>
        </nav>
        <Routes>
          <Route path="/" element={<HojePage />} />
          <Route path="/habitos" element={<HabitsPage />} />
          <Route path="/deveres" element={<DeveresPage />} />
          <Route path="/nutricao" element={<NutritionPage />} />
          <Route path="/alimentos" element={<FoodsPage />} />
          <Route path="/perfil" element={<ProfilePage />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

function navStyle({ isActive }: { isActive: boolean }) {
  return {
    textDecoration: 'none',
    fontWeight: isActive ? 700 : 400,
    color: isActive ? 'var(--nav-active)' : 'var(--nav-inactive)',
  };
}
