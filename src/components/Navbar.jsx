import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { logout }   = useAuth();
  const navigate     = useNavigate();
  const { pathname } = useLocation();

  const handleLogout = () => { logout(); navigate('/login'); };

  const link = (label, path) => (
    <span
      onClick={() => navigate(path)}
      style={{
        fontSize: '0.875rem',
        cursor: 'pointer',
        fontWeight: pathname === path ? 500 : 400,
        color: pathname === path ? '#6366f1' : '#6b7280',
        borderBottom: pathname === path ? '2px solid #6366f1' : '2px solid transparent',
        paddingBottom: 2,
      }}
    >
      {label}
    </span>
  );

  return (
    <nav style={s.nav}>
      <span style={s.brand} onClick={() => navigate('/dashboard')} role="button">
        FinSplit
      </span>
      <div style={s.links}>
        {link('Dashboard', '/dashboard')}
        {link('Expenses',  '/expenses')}
        {link('Budgets',   '/budgets')}
        {link('Groups',    '/groups')}
        <button style={s.logoutBtn} onClick={handleLogout}>Logout</button>
      </div>
    </nav>
  );
}

const s = {
  nav: {
    background: '#fff',
    borderBottom: '1px solid #e5e7eb',
    padding: '0 1.5rem',
    height: 60,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'sticky',
    top: 0,
    zIndex: 40,
  },
  brand: {
    fontSize: '1.1rem', fontWeight: 700,
    color: '#6366f1', cursor: 'pointer',
  },
  links: { display: 'flex', alignItems: 'center', gap: 18 },
  logoutBtn: {
    padding: '0.4rem 0.9rem',
    background: 'transparent',
    border: '1px solid #d1d5db',
    borderRadius: 8,
    fontSize: '0.875rem',
    cursor: 'pointer',
    color: '#374151',
  },
};