import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div>
      <nav style={{ background:'#fff', borderBottom:'1px solid #e5e7eb', padding:'0 1.5rem', height:60, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <span style={{ fontSize:'1.1rem', fontWeight:700, color:'#6366f1' }}>FinSplit</span>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <span style={{ fontSize:'0.875rem', color:'#6b7280' }}>{user?.email}</span>
          <button onClick={handleLogout} style={{ padding:'0.4rem 0.9rem', background:'transparent', border:'1px solid #d1d5db', borderRadius:8, fontSize:'0.875rem', cursor:'pointer' }}>Logout</button>
        </div>
      </nav>

      <div style={{ maxWidth:860, margin:'2rem auto', padding:'0 1.5rem' }}>
        <div style={{ marginBottom:24 }}>
          <h2 style={{ fontSize:'1.2rem', fontWeight:600, color:'#111827' }}>Welcome, {user?.name}!</h2>
          <p style={{ color:'#6b7280', marginTop:4, fontSize:'0.9rem' }}>What would you like to do today?</p>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(180px, 1fr))', gap:12 }}>
          <div style={card} onClick={() => navigate('/expenses')} role="button">
            <div style={cardIcon}>💸</div>
            <div style={cardTitle}>My Expenses</div>
            <div style={cardSub}>Track and manage your personal spending</div>
          </div>
          {/* <div style={{ ...card, opacity:0.45, cursor:'not-allowed' }}>
            <div style={cardIcon}>📊</div>
            <div style={cardTitle}>Budgets</div>
            <div style={cardSub}>Coming in Phase 3</div>
          </div> */}
          <div style={card} onClick={() => navigate('/budgets')} role="button">
            <div style={cardIcon}>📊</div>
            <div style={cardTitle}>Budgets</div>
            <div style={cardSub}>Set limits and track spending by category</div>
          </div>
          <div style={{ ...card, opacity:0.45, cursor:'not-allowed' }}>
            <div style={cardIcon}>👥</div>
            <div style={cardTitle}>Groups</div>
            <div style={cardSub}>Coming in Phase 4</div>
          </div>
        </div>
      </div>
    </div>
  );
}

const card = { background:'#fff', border:'1px solid #e5e7eb', borderRadius:12, padding:'1.25rem 1.5rem', cursor:'pointer', transition:'border-color 0.15s' };
const cardIcon = { fontSize:28, marginBottom:10 };
const cardTitle = { fontSize:'0.95rem', fontWeight:600, color:'#111827', marginBottom:4 };
const cardSub = { fontSize:'0.8rem', color:'#9ca3af', lineHeight:1.5 };

// import { useNavigate } from 'react-router-dom';
// import { useAuth } from '../context/AuthContext';

// export default function DashboardPage() {
//   const { user, logout } = useAuth();
//   const navigate = useNavigate();

//   const handleLogout = () => {
//     logout();
//     navigate('/login');
//   };

//   return (
//     <div>
//       <nav className="navbar">
//         <span className="navbar-brand">FinSplit</span>
//         <div className="navbar-right">
//           <span>{user?.email}</span>
//           <button className="btn-outline" onClick={handleLogout}>Logout</button>
//         </div>
//       </nav>

//       <div className="page-content">
//         <div className="welcome-card">
//           <h2>Welcome, {user?.name}!</h2>
//           <p>Your dashboard is ready. Features are added phase by phase.</p>
//           <div className="meta-row">
//             <div className="meta-item">Email: <span>{user?.email}</span></div>
//             <div className="meta-item">
//               Member since: <span>
//                 {user?.createdAt
//                   ? new Date(user.createdAt).toLocaleDateString('en-IN', {
//                       year: 'numeric', month: 'long', day: 'numeric'
//                     })
//                   : '—'}
//               </span>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }