import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI, notificationsAPI } from '../api/client';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('campus_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('campus_token');
      if (token) {
        try {
          const res = await authAPI.getMe();
          if (res.data.success) {
            setUser(res.data.user);
            localStorage.setItem('campus_user', JSON.stringify(res.data.user));
            fetchNotificationCount();
          }
        } catch (err) {
          console.error('Session expired or invalid:', err);
          logout();
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const fetchNotificationCount = async () => {
    try {
      const res = await notificationsAPI.getUnreadCount();
      if (res.data.success) {
        setUnreadCount(res.data.count);
      }
    } catch (err) {
      // Ignore background notification count error
    }
  };

  const login = (token, userData) => {
    localStorage.setItem('campus_token', token);
    localStorage.setItem('campus_user', JSON.stringify(userData));
    setUser(userData);
    fetchNotificationCount();
  };

  const logout = () => {
    localStorage.removeItem('campus_token');
    localStorage.removeItem('campus_user');
    setUser(null);
    setUnreadCount(0);
  };

  const updateUserState = (newUserData) => {
    setUser(newUserData);
    localStorage.setItem('campus_user', JSON.stringify(newUserData));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        unreadCount,
        login,
        logout,
        updateUserState,
        refreshNotifications: fetchNotificationCount
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
