// import { Navigate } from 'react-router-dom';
// import { useAuth } from '../context/AuthContext';

// export default function ProtectedRoute({ children }) {
//   const { token, loading } = useAuth();

//   if (loading) {
//     return (
//       <div style={{ display: 'flex', justifyContent: 'center', marginTop: '4rem' }}>
//         <p style={{ color: '#6b7280', fontSize: '14px' }}>Loading...</p>
//       </div>
//     );
//   }

//   return token ? children : <Navigate to="/login" replace />;
// }

import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children }) {
  const { token, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '4rem' }}>
        <p style={{ color: '#6b7280', fontSize: '14px' }}>Loading...</p>
      </div>
    );
  }

  // Read directly from localStorage as a fallback
  const storedToken = localStorage.getItem('token');

  return (token || storedToken) ? children : <Navigate to="/login" replace />;
}