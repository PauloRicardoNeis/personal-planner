import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import { HojePage } from './pages/HojePage.js';
import { HabitsPage } from './pages/HabitsPage.js';
import { DeveresPage } from './pages/DeveresPage.js';
import { NutritionPage } from './pages/NutritionPage.js';
import { FoodsPage } from './pages/FoodsPage.js';
import { ProfilePage } from './pages/ProfilePage.js';

export function App() {
  return (
    <BrowserRouter>
      <div style={{ fontFamily: 'system-ui, sans-serif', maxWidth: 600, margin: '0 auto', padding: '0 16px' }}>
        <nav style={{ display: 'flex', gap: 16, padding: '16px 0', borderBottom: '1px solid var(--border-nav)', marginBottom: 24, flexWrap: 'wrap' }}>
          <NavLink to="/" end style={navStyle}>Hoje</NavLink>
          <NavLink to="/habitos" style={navStyle}>Habitos</NavLink>
          <NavLink to="/deveres" style={navStyle}>Deveres</NavLink>
          <NavLink to="/nutricao" style={navStyle}>Nutricao</NavLink>
          <NavLink to="/alimentos" style={navStyle}>Alimentos</NavLink>
          <NavLink to="/perfil" style={navStyle}>Perfil</NavLink>
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
