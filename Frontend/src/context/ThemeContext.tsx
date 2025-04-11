// src/context/ThemeContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type ThemeMode = 'light' | 'dark' | 'system';
type ThemeContextType = {
  themeMode: ThemeMode;
  currentTheme: 'light' | 'dark';
  setThemeMode: (theme: ThemeMode) => void;
};

const ThemeContext = createContext<ThemeContextType>({
  themeMode: 'system',
  currentTheme: 'light',
  setThemeMode: () => {},
});

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
    // Initialize from localStorage or use system preference
    const savedTheme = localStorage.getItem('theme') as ThemeMode | null;
    return savedTheme || 'system';
  });

  const [currentTheme, setCurrentTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    // Determine the actual theme to apply
    const getSystemTheme = () => 
      window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    
    const newTheme = themeMode === 'system' ? getSystemTheme() : themeMode;
    setCurrentTheme(newTheme);

    // Apply to body
    document.body.classList.remove('light-theme', 'dark-theme');
    document.body.classList.add(`${newTheme}-theme`);

    // Save preference
    localStorage.setItem('theme', themeMode);
  }, [themeMode]);

  // Listen for system theme changes
  useEffect(() => {
    if (themeMode !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => {
      setCurrentTheme(e.matches ? 'dark' : 'light');
    };

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, [themeMode]);

  return (
    <ThemeContext.Provider value={{ themeMode, currentTheme, setThemeMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);