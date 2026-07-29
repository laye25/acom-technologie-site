import React, { createContext, useContext, useEffect, useState } from 'react';
import { dbService as db } from './services/dbService';

export type ThemeMode = 'light' | 'dark';

interface ThemeContextType {
  primaryColor: string;
  themeMode: ThemeMode;
  isDark: boolean;
  setThemeMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  primaryColor: '#7c3aed',
  themeMode: 'light',
  isDark: false,
  setThemeMode: () => {},
  toggleTheme: () => {},
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [primaryColor, setPrimaryColor] = useState('#7c3aed');
  const [themeMode, setThemeModeState] = useState<ThemeMode>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('acom_theme');
      if (saved === 'dark' || saved === 'light') return saved;
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
      }
    }
    return 'light';
  });

  const isDark = themeMode === 'dark';

  const setThemeMode = (mode: ThemeMode) => {
    setThemeModeState(mode);
    if (typeof window !== 'undefined') {
      localStorage.setItem('acom_theme', mode);
    }
  };

  const toggleTheme = () => {
    setThemeMode(themeMode === 'light' ? 'dark' : 'light');
  };

  // Sync DOM classes and attributes whenever themeMode changes
  useEffect(() => {
    const root = document.documentElement;
    if (themeMode === 'dark') {
      root.classList.add('dark');
      root.setAttribute('data-theme', 'dark');
      root.style.colorScheme = 'dark';
    } else {
      root.classList.remove('dark');
      root.setAttribute('data-theme', 'light');
      root.style.colorScheme = 'light';
    }
  }, [themeMode]);

  useEffect(() => {
    const applyTheme = (color: string) => {
      document.documentElement.style.setProperty('--primary-color', color);
      document.documentElement.style.setProperty('--color-primary', color);
      
      if (color.startsWith('#')) {
        const hover = adjustColor(color, -20);
        const light = color + '10'; // 10% opacity
        document.documentElement.style.setProperty('--primary-hover', hover);
        document.documentElement.style.setProperty('--color-primary-hover', hover);
        document.documentElement.style.setProperty('--primary-light', light);
        document.documentElement.style.setProperty('--color-primary-light', light);
      }
    };

    const fetchTheme = async () => {
      const data = await db.settings.get('global');
      if (data && data.config && data.config.primaryColor) {
        const color = data.config.primaryColor;
        setPrimaryColor(color);
        applyTheme(color);
      }
    };

    fetchTheme();
  }, []);

  // Helper to darken/lighten hex color
  const adjustColor = (hex: string, amt: number) => {
    let usePound = false;
    if (hex[0] === "#") {
      hex = hex.slice(1);
      usePound = true;
    }
    const num = parseInt(hex, 16);
    let r = (num >> 16) + amt;
    if (r > 255) r = 255;
    else if (r < 0) r = 0;
    let g = ((num >> 8) & 0x00FF) + amt;
    if (g > 255) g = 255;
    else if (g < 0) g = 0;
    let b = (num & 0x0000FF) + amt;
    if (b > 255) b = 255;
    else if (b < 0) b = 0;
    
    const result = (b | (g << 8) | (r << 16)).toString(16).padStart(6, '0');
    return (usePound ? "#" : "") + result;
  };

  return (
    <ThemeContext.Provider value={{ primaryColor, themeMode, isDark, setThemeMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);

