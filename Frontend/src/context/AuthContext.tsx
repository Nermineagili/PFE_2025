// src/context/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Updated User interface with name and lastname, and the optional fullname
interface User {
  fullname: any;
  _id: string;
  email: string;
  name: string;
  lastname: string;
  role: string;
  profilePic?: string;
}

interface AuthContextType {
  isLoggedIn: boolean;
  user: User | null;
  login: (token: string, user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(!!localStorage.getItem('authToken'));
  const [user, setUser] = useState<User | null>(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      // If fullname exists, split it and store name and lastname
      if (parsedUser.fullname) {
        const [name, lastname] = parsedUser.fullname.split(' ');
        parsedUser.name = name || '';
        parsedUser.lastname = lastname || '';
        delete parsedUser.fullname; // Remove fullname field after splitting
      }
      return parsedUser;
    }
    return null;
  });

  const login = (token: string, userData: User) => {
    // Ensure fullname is split if it exists
    if (userData.fullname) {
      const [name, lastname] = userData.fullname.split(' ');
      userData.name = name || '';
      userData.lastname = lastname || '';
      delete userData.fullname; // Remove fullname field after splitting
    }
    
    localStorage.setItem('authToken', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    setIsLoggedIn(true);
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    setUser(null);
    setIsLoggedIn(false);
  };

  useEffect(() => {
    console.log("AuthContext - isLoggedIn:", isLoggedIn);
  }, [isLoggedIn]);

  return (
    <AuthContext.Provider value={{ isLoggedIn, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
