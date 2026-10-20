import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check current session on initial load
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await api.get('/auth/me');
        if (res.data.success && res.data.data) {
          setUser(res.data.data);
          sessionStorage.setItem('yms_user', JSON.stringify(res.data.data));
        }
      } catch (err) {
        setUser(null);
        sessionStorage.removeItem('yms_user');
        sessionStorage.removeItem('yms_token');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (email, password) => {
    try {
      const res = await api.post('/auth/login', { email, password });
      if (res.data.success) {
        const userData = res.data.data.user;
        const token = res.data.data.token;
        setUser(userData);
        if (token) {
          sessionStorage.setItem('yms_token', token);
        }
        sessionStorage.setItem('yms_user', JSON.stringify(userData));
        toast.success(`Welcome back, ${userData.name}!`);
        return { success: true };
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed. Please verify your credentials.';
      toast.error(msg);
      return { success: false, message: msg };
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      // Ignore network error on logout
    } finally {
      setUser(null);
      sessionStorage.removeItem('yms_user');
      sessionStorage.removeItem('yms_token');
      toast.success('Signed out successfully.');
      window.location.href = '/login';
    }
  };

  const updateProfile = (updatedUser) => {
    setUser(updatedUser);
    sessionStorage.setItem('yms_user', JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        updateProfile,
        isAdmin: user?.role === 'admin',
        isStaff: user?.role === 'staff',
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
