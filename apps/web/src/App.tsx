import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { HojePage } from './pages/HojePage.js';
import { HabitsPage } from './pages/HabitsPage.js';
import { DeveresPage } from './pages/DeveresPage.js';
import { NutritionPage } from './pages/NutritionPage.js';
import { FoodsPage } from './pages/FoodsPage.js';
import { ProfilePage } from './pages/ProfilePage.js';
import { CalendarPage } from './pages/CalendarPage.js';
import { UpdateBanner } from './components/UpdateBanner.js';

type Theme = 'system' | 'light' | 'dark';
const THEMES: Theme[] = ['system', 'light', 'dark'];
const THEME_LABELS: Record<Theme, string> = { system: 'Sistema', light: 'Dia', dark: 'Noite' };
const THEME_ICONS: Record<Theme, string> = { system: '◑', light: '○', dark: '●' };

const NAV_ITEMS = [
  { to: '/', label: 'Hoje',      icon: '◎', end: true  },
  { to: '/habitos',  label: 'Hábitos',  icon: '✦', end: false },
  { to: '/deveres',    label: 'Deveres',    icon: '◻', end: false },
  { to: '/calendario', label: 'Calendário', icon: '▦', end: false },
  { to: '/nutricao',   label: 'Nutrição',   icon: '◈', end: false },
  { to: '/alimentos',label: 'Alimentos',icon: '◇', end: false },
  { to: '/perfil',   label: 'Perfil',   icon: '◉', end: false },
];

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
    setTheme(t => THEMES[(THEMES.indexOf(t) + 1) % THEMES.length] as Theme);
  }

  return (
    <BrowserRouter>
      <UpdateBanner />
      <div style={{ display: 'flex', height: '100%', fontFamily: 'system-ui, sans-serif' }}>

        {/* ── Sidebar ───────────────────────────────────────────────────── */}
        <aside style={{
          width: 220,
          flexShrink: 0,
          background: 'var(--sidebar-bg)',
          borderRight: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}>
          {/* Logo */}
          <div style={{
            padding: '24px 20px 20px',
            borderBottom: '1px solid var(--border)',
          }}>
            <span style={{ fontWeight: 800, fontSize: 20, letterSpacing: '-0.5px', color: 'var(--text)' }}>
              Planner
            </span>
          </div>

          {/* Nav */}
          <nav style={{ flex: 1, padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: 2, overflowY: 'auto' }}>
            {NAV_ITEMS.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                style={({ isActive }) => ({
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '9px 12px',
                  borderRadius: 8,
                  textDecoration: 'none',
                  fontWeight: isActive ? 600 : 400,
                  color: isActive ? 'var(--nav-active)' : 'var(--nav-inactive)',
                  background: isActive ? 'var(--nav-active-bg)' : 'transparent',
                  fontSize: 14,
                  transition: 'background 0.15s, color 0.15s',
                })}
              >
                <span style={{ fontSize: 15 }}>{item.icon}</span>
                {item.label}
              </NavLink>
            ))}
          </nav>

          {/* Theme toggle */}
          <div style={{ padding: '16px 14px', borderTop: '1px solid var(--border)' }}>
            <button
              onClick={cycleTheme}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 12px',
                borderRadius: 8,
                border: '1px solid var(--border-input)',
                background: 'var(--bg-input)',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: 500,
              }}
            >
              <span>{THEME_ICONS[theme]}</span>
              {THEME_LABELS[theme]}
            </button>
          </div>
        </aside>

        {/* ── Main content ──────────────────────────────────────────────── */}
        <main style={{ flex: 1, overflow: 'auto', minWidth: 0 }}>
          <Routes>
            <Route path="/" element={<HojePage />} />
            <Route path="/habitos"   element={<PageWrapper><HabitsPage /></PageWrapper>} />
            <Route path="/deveres"    element={<PageWrapper><DeveresPage /></PageWrapper>} />
            <Route path="/calendario" element={<CalendarPage />} />
            <Route path="/nutricao"   element={<PageWrapper><NutritionPage /></PageWrapper>} />
            <Route path="/alimentos" element={<PageWrapper><FoodsPage /></PageWrapper>} />
            <Route path="/perfil"    element={<PageWrapper><ProfilePage /></PageWrapper>} />
          </Routes>
        </main>

      </div>
    </BrowserRouter>
  );
}

function PageWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ padding: '40px 48px', maxWidth: 900 }}>
      {children}
    </div>
  );
}
