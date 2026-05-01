import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';
import { HojePage } from './pages/HojePage.js';
import { HabitsPage } from './pages/HabitsPage.js';
import { DeveresPage } from './pages/DeveresPage.js';
import { ProjetosPage } from './pages/ProjetosPage.js';
import { NutritionPage } from './pages/NutritionPage.js';
import { FoodsPage } from './pages/FoodsPage.js';
import { GamesPage } from './pages/GamesPage.js';
import { BooksPage } from './pages/BooksPage.js';
import { FilmesPage } from './pages/FilmesPage.js';
import { ProfilePage } from './pages/ProfilePage.js';
import { CalendarPage } from './pages/CalendarPage.js';
import { SaudePage } from './pages/SaudePage.js';
import { ComprasPage } from './pages/ComprasPage.js';
import { UpdateBanner } from './components/UpdateBanner.js';
import { useTimeTheme, useDebugTime } from './hooks/useTimeTheme.js';

type Theme = 'dynamic' | 'light' | 'dark';
const THEMES: Theme[] = ['dynamic', 'light', 'dark'];
const THEME_LABELS: Record<Theme, string> = { dynamic: 'Dinâmico', light: 'Dia', dark: 'Noite' };
const THEME_ICONS: Record<Theme, string> = { dynamic: '◐', light: '○', dark: '●' };

const NAV_ITEMS = [
  { to: '/jogos', label: 'Jogos', icon: '🎮', end: false },
  { to: '/filmes', label: 'Filmes', icon: '🎬', end: false },
  { to: '/', label: 'Hoje',      icon: '◎', end: true  },
  { to: '/habitos',  label: 'Hábitos',  icon: '✦', end: false },
  { to: '/deveres',    label: 'Deveres',    icon: '◻', end: false },
  { to: '/projetos',   label: 'Projetos',   icon: '▣', end: false },
  { to: '/calendario', label: 'Calendário', icon: '▦', end: false },
  { to: '/nutricao',   label: 'Nutrição',   icon: '◈', end: false },
  { to: '/alimentos',label: 'Alimentos',icon: '◇', end: false },
  { to: '/livros',   label: 'Livros',   icon: '▧', end: false },
  { to: '/perfil',   label: 'Perfil',   icon: '◉', end: false },
];

export function App() {
  useTimeTheme();

  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem('theme') as Theme) ?? 'dynamic'
  );

  useEffect(() => {
    localStorage.setItem('theme', theme);
    if (theme === 'dynamic') {
      // Dynamic mode: set data-theme="dynamic" so CSS dark-mode media query doesn't interfere
      document.documentElement.setAttribute('data-theme', 'dynamic');
    } else {
      // Static light/dark: set data-theme, useTimeTheme will detect and skip
      document.documentElement.setAttribute('data-theme', theme);
    }
  }, [theme]);

  function cycleTheme() {
    setTheme(t => THEMES[(THEMES.indexOf(t) + 1) % THEMES.length] as Theme);
  }

  return (
    <BrowserRouter>
      <UpdateBanner />
      <div style={{ display: 'flex', height: '100%', fontFamily: 'var(--font-sans)' }}>

        {/* ── Sidebar ───────────────────────────────────────────────────── */}
        <aside style={{
          width: 232,
          flexShrink: 0,
          background: 'var(--sidebar-bg)',
          borderRight: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}>
          {/* Logo */}
          <div style={{ padding: '24px 20px 20px' }}>
            <span style={{
              fontWeight: 700,
              fontSize: 20,
              letterSpacing: '-0.4px',
              color: 'var(--accent)',
            }}>
              Planner
            </span>
          </div>

          {/* Nav */}
          <nav style={{ flex: 1, padding: '0 8px', display: 'flex', flexDirection: 'column', gap: 1, overflowY: 'auto' }}>
            {NAV_ITEMS.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                style={({ isActive }) => ({
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-md)',
                  textDecoration: 'none',
                  fontWeight: isActive ? 600 : 400,
                  color: isActive ? 'var(--accent)' : 'var(--nav-inactive)',
                  background: isActive ? 'var(--nav-active-bg)' : 'transparent',
                  fontSize: 13.5,
                  letterSpacing: '-0.01em',
                  transition: 'all var(--transition)',
                  position: 'relative',
                })}
              >
                <span style={{ fontSize: 15, opacity: 0.85, width: 20, textAlign: 'center' }}>{item.icon}</span>
                {item.label}
              </NavLink>
            ))}
          </nav>

          {/* Theme toggle + Debug */}
          <div style={{ padding: '12px 12px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <button
              onClick={cycleTheme}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 12px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border)',
                background: 'transparent',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: 500,
                transition: 'all var(--transition)',
              }}
            >
              <span style={{ fontSize: 13 }}>{THEME_ICONS[theme]}</span>
              {THEME_LABELS[theme]}
            </button>
            {theme === 'dynamic' && <TimeDebugPanel />}
          </div>
        </aside>

        {/* ── Main content ──────────────────────────────────────────────── */}
        <main style={{ flex: 1, overflow: 'auto', minWidth: 0 }}>
          <Routes>
            <Route path="/jogos"      element={<PageWrapper><GamesPage /></PageWrapper>} />
            <Route path="/filmes"     element={<PageWrapper><FilmesPage /></PageWrapper>} />
            <Route path="/" element={<HojePage />} />
            <Route path="/habitos"   element={<PageWrapper><HabitsPage /></PageWrapper>} />
            <Route path="/deveres"    element={<PageWrapper><DeveresPage /></PageWrapper>} />
            <Route path="/projetos"   element={<PageWrapper><ProjetosPage /></PageWrapper>} />
            <Route path="/saude"      element={<PageWrapper><SaudePage /></PageWrapper>} />
            <Route path="/compras"    element={<PageWrapper><ComprasPage /></PageWrapper>} />
            <Route path="/calendario" element={<CalendarPage />} />
            <Route path="/nutricao"   element={<PageWrapper><NutritionPage /></PageWrapper>} />
            <Route path="/alimentos" element={<PageWrapper><FoodsPage /></PageWrapper>} />
            <Route path="/livros"    element={<PageWrapper><BooksPage /></PageWrapper>} />
            <Route path="/perfil"    element={<PageWrapper><ProfilePage /></PageWrapper>} />
          </Routes>
        </main>

      </div>
    </BrowserRouter>
  );
}

function PageWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ padding: '36px 44px', maxWidth: 920 }}>
      {children}
    </div>
  );
}

/** Format fractional hour (14.5) → "14:30" */
function formatHour(h: number): string {
  const hours = Math.floor(h);
  const mins = Math.round((h - hours) * 60);
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}

const TIME_LABELS: [number, string][] = [
  [0, 'Meia-noite'], [5.5, 'Amanhecer'], [7, 'Nascer do sol'],
  [9, 'Manhã'], [12, 'Meio-dia'], [14, 'Tarde'],
  [18, 'Golden hour'], [19.5, 'Pôr do sol'], [20.5, 'Crepúsculo'],
  [22, 'Noite'],
];

function getTimeLabel(hour: number): string {
  let label = TIME_LABELS[0]![1];
  for (const [h, l] of TIME_LABELS) {
    if (hour >= h) label = l;
  }
  return label;
}

function TimeDebugPanel() {
  const { enabled, hour, setHour, setEnabled } = useDebugTime();
  const [open, setOpen] = useState(false);
  const isTauri = '__TAURI_INTERNALS__' in window;

  const [buildStatus, setBuildStatus] = useState<'idle' | 'running' | 'done' | 'error'>('idle');
  const [buildMessage, setBuildMessage] = useState('');

  useEffect(() => {
    if (!isTauri) return;
    let unlisten: (() => void) | undefined;
    import('@tauri-apps/api/event').then(({ listen }) => {
      listen<{ stage: string; message?: string }>('build-status', (e) => {
        const { stage, message } = e.payload;
        setBuildStatus(stage as typeof buildStatus);
        if (message) setBuildMessage(message);
      }).then(fn => { unlisten = fn; });
    });
    return () => { unlisten?.(); };
  }, [isTauri]);

  const handleBuild = useCallback(async () => {
    setBuildStatus('running');
    setBuildMessage('');
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      await invoke('build_installer', { withServer: true });
    } catch (e) {
      setBuildStatus('error');
      setBuildMessage(String(e));
    }
  }, []);

  return (
    <div>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '8px 12px',
          borderRadius: 'var(--radius-md)',
          border: `1px solid ${enabled ? 'var(--accent)' : 'var(--border)'}`,
          background: enabled ? 'var(--accent-soft)' : 'transparent',
          color: enabled ? 'var(--accent)' : 'var(--text-muted)',
          cursor: 'pointer',
          fontSize: 13,
          fontWeight: 500,
          transition: 'all var(--transition)',
        }}
      >
        <span style={{ fontSize: 13 }}>⏱</span>
        {enabled ? formatHour(hour) : 'Debug'}
      </button>

      {open && (
        <div style={{
          marginTop: 6,
          padding: '10px 12px',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border)',
          background: 'var(--bg-card)',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}>
          {/* Checkbox */}
          <label style={{
            display: 'flex', alignItems: 'center', gap: 6,
            fontSize: 12, color: 'var(--text-secondary)', cursor: 'pointer', userSelect: 'none',
          }}>
            <input
              type="checkbox"
              checked={enabled}
              onChange={e => setEnabled(e.target.checked)}
              style={{ accentColor: 'var(--accent)', cursor: 'pointer' }}
            />
            Usar horário manual
          </label>

          {/* Slider */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <input
              type="range"
              min={0}
              max={24}
              step={0.25}
              value={hour}
              onChange={e => setHour(Number(e.target.value))}
              disabled={!enabled}
              style={{
                width: '100%',
                accentColor: 'var(--accent)',
                cursor: enabled ? 'pointer' : 'not-allowed',
                opacity: enabled ? 1 : 0.4,
              }}
            />
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
            }}>
              <span style={{
                fontSize: 18, fontWeight: 700, fontVariantNumeric: 'tabular-nums',
                color: enabled ? 'var(--accent)' : 'var(--text-muted)',
                transition: 'color var(--transition)',
              }}>
                {formatHour(hour)}
              </span>
              <span style={{
                fontSize: 11, color: 'var(--text-muted)', fontWeight: 500,
              }}>
                {getTimeLabel(hour)}
              </span>
            </div>
          </div>

          {/* Build installer */}
          {isTauri && (
            <div style={{
              borderTop: '1px solid var(--border)',
              paddingTop: 8,
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
            }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Instalador
              </span>
              <button
                onClick={handleBuild}
                disabled={buildStatus === 'running'}
                style={{
                  padding: '6px 8px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border)',
                  background: buildStatus === 'running' ? 'var(--accent-soft)' : 'transparent',
                  color: 'var(--text-secondary)',
                  cursor: buildStatus === 'running' ? 'not-allowed' : 'pointer',
                  fontSize: 11,
                  fontWeight: 500,
                  opacity: buildStatus === 'running' ? 0.6 : 1,
                  transition: 'all var(--transition)',
                }}
              >
                {buildStatus === 'running' ? 'Gerando...' : 'Gerar installer'}
              </button>
              {buildMessage && (
                <span style={{
                  fontSize: 11,
                  color: buildStatus === 'error' ? '#e55' : 'var(--accent)',
                  wordBreak: 'break-word',
                }}>
                  {buildMessage}
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
