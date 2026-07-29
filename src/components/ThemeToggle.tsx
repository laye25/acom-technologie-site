import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../ThemeProvider';

interface ThemeToggleProps {
  showLabel?: boolean;
  className?: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ showLabel = false, className = '' }) => {
  const { themeMode, toggleTheme } = useTheme();
  const isDark = themeMode === 'dark';

  return (
    <button
      onClick={toggleTheme}
      type="button"
      className={`relative inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all duration-200 cursor-pointer select-none ${
        isDark
          ? 'bg-slate-800 border-slate-700 text-amber-300 hover:bg-slate-700 hover:border-slate-600 shadow-sm'
          : 'bg-white border-slate-200/90 text-slate-700 hover:bg-slate-50 hover:text-slate-900 hover:border-slate-300 shadow-sm'
      } ${className}`}
      title={isDark ? 'Basculer en mode clair' : 'Basculer en mode sombre'}
      aria-label={isDark ? 'Mode clair' : 'Mode sombre'}
    >
      <div className="relative w-4 h-4 flex items-center justify-center">
        {isDark ? (
          <Moon className="w-4 h-4 text-amber-300 transform transition-transform duration-300 rotate-0" />
        ) : (
          <Sun className="w-4 h-4 text-amber-500 transform transition-transform duration-300 rotate-0" />
        )}
      </div>

      {showLabel && (
        <span className="text-xs font-bold uppercase tracking-wider font-mono">
          {isDark ? 'Sombre' : 'Clair'}
        </span>
      )}
    </button>
  );
};

export default ThemeToggle;
