/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setCredentials, setUser, clearCredentials } from '../store/slices/authSlice';
import api from '../utils/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const dispatch = useDispatch();
  const { currentUser, userRole } = useSelector((state) => state.auth);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const savedToken = localStorage.getItem('token');
      const savedUser = localStorage.getItem('user');

      if (savedToken && savedUser) {
        try {
          const user = await api.get('/auth/me');
          dispatch(setUser(user));
        } catch {
          dispatch(clearCredentials());
        }
      }
      setLoading(false);
    };

    initAuth();
  }, [dispatch]);

  const login = async (email, password) => {
    const data = await api.post('/auth/login', { email, password });
    dispatch(setCredentials({ user: data.user, token: data.token }));
    return data.user;
  };

  const logout = () => {
    dispatch(clearCredentials());
  };

  const value = {
    currentUser,
    userRole,
    loading,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
