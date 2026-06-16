import { useNavigate } from 'react-router-dom';

export default function NotFoundPage() {
  const navigate = useNavigate();
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: 12
    }}>
      <div style={{ fontSize: 48 }}>🔍</div>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 600, color: '#111827' }}>
        Page not found
      </h1>
      <p style={{ color: '#9ca3af', fontSize: '0.9rem' }}>
        The page you're looking for doesn't exist.
      </p>
      <button
        onClick={() => navigate('/dashboard')}
        style={{
          marginTop: 8, padding: '0.6rem 1.25rem',
          background: '#6366f1', color: '#fff', border: 'none',
          borderRadius: 8, fontSize: '0.9rem', cursor: 'pointer'
        }}
      >
        Go to Dashboard
      </button>
    </div>
  );
}