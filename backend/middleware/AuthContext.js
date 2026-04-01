// src/context/AuthContext.js
import { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('streamx_token');
    if (token) {
      api.me()
        .then(res => setUser(res.user))
        .catch(() => localStorage.removeItem('streamx_token'))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const res = await api.login({ email, password });
    localStorage.setItem('streamx_token', res.token);
    setUser(res.user);
    return res;
  };

  const register = async (username, email, password) => {
    const res = await api.register({ username, email, password });
    localStorage.setItem('streamx_token', res.token);
    setUser(res.user);
    return res;
  };

  const logout = () => {
    localStorage.removeItem('streamx_token');
    setUser(null);
  };

  const toggleFavorite = async (movieId) => {
    const res = await api.toggleFav(movieId);
    setUser(prev => ({ ...prev, favorites: res.favorites }));
  };

  const isFavorite = (movieId) => user?.favorites?.includes(movieId);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, toggleFavorite, isFavorite }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
