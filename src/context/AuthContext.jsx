
import { createContext, useContext, useState, useEffect } from 'react';
import { getMyProfile } from '../services/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        try {
          const profile = await getMyProfile();
          setUser(profile);
          setToken(storedToken);
        } catch (err) {
          console.error('Profile fetch failed:', err);
          localStorage.removeItem('token');
          setToken(null);
          setUser(null);
        }
      } else {
        setToken(null);
        setUser(null);
      }
      setLoading(false);
    };
    init();
  }, []); 

  const login = (authResponse) => {
    localStorage.setItem('token', authResponse.token);
    setToken(authResponse.token);
    // Set user directly from the login response — don't wait for /me call
    setUser({
      name: authResponse.name,
      email: authResponse.email,
    });
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}