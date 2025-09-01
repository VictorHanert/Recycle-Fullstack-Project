import { useState, useEffect, useContext, createContext } from 'react';
import type { ReactNode } from 'react';

interface AuthContextType {
  isLoggedIn: boolean;
  isAdmin: boolean;
  username: string;
  login: (username: string, isAdmin: boolean) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [username, setUsername] = useState('');

  // Check for existing login on app start
  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUsername = localStorage.getItem('username');
    const savedIsAdmin = localStorage.getItem('isAdmin') === 'true';
    
    if (token && savedUsername) {
      setIsLoggedIn(true);
      setUsername(savedUsername);
      setIsAdmin(savedIsAdmin);
    }
  }, []);

  const login = (user: string, adminStatus: boolean) => {
    setIsLoggedIn(true);
    setUsername(user);
    setIsAdmin(adminStatus);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('isAdmin');
    setIsLoggedIn(false);
    setUsername('');
    setIsAdmin(false);
  };

  const value = {
    isLoggedIn,
    isAdmin,
    username,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
