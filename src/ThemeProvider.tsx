import React, { createContext, useContext, useEffect, useState } from 'react';
import { dbService as db } from './services/firebaseDbService';

interface ThemeContextType {
  primaryColor: string;
}

const ThemeContext = createContext<ThemeContextType>({ primaryColor: '#7c3aed' });

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [primaryColor, setPrimaryColor] = useState('#7c3aed');

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
    <ThemeContext.Provider value={{ primaryColor }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
