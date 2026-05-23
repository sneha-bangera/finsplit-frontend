import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div>
      <nav className="navbar">
        <span className="navbar-brand">FinSplit</span>
        <div className="navbar-right">
          <span>{user?.email}</span>
          <button className="btn-outline" onClick={handleLogout}>Logout</button>
        </div>
      </nav>

      <div className="page-content">
        <div className="welcome-card">
          <h2>Welcome, {user?.name}!</h2>
          <p>Your dashboard is ready. Features are added phase by phase.</p>
          <div className="meta-row">
            <div className="meta-item">Email: <span>{user?.email}</span></div>
            <div className="meta-item">
              Member since: <span>
                {user?.createdAt
                  ? new Date(user.createdAt).toLocaleDateString('en-IN', {
                      year: 'numeric', month: 'long', day: 'numeric'
                    })
                  : '—'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}