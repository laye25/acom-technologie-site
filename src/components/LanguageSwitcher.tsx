import React, { useState } from 'react';
import { useTranslation } from '../context/LanguageContext';
import { Globe, ChevronDown, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const languages = [
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'wo', name: 'Wolof', flag: '🇸🇳' },
];

interface LanguageSwitcherProps {
  light?: boolean;
}

const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({ light }) => {
  const { currentLanguage, setLanguage, isTranslating } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const currentLang = languages.find(l => l.code === currentLanguage) || languages[0];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all text-sm font-bold group ${
          light ? 'text-white/90 hover:bg-white/10' : 'text-gray-700 hover:bg-gray-100'
        }`}
      >
        <div className="relative">
          <Globe className={`w-4 h-4 transition-colors ${
            light ? 'text-white/60 group-hover:text-white' : 'text-gray-400 group-hover:text-primary'
          } ${isTranslating ? 'animate-spin' : ''}`} />
          {isTranslating && (
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full animate-pulse" />
          )}
        </div>
        <span className="hidden sm:inline">{currentLang.name}</span>
        <span className="sm:hidden">{currentLang.flag}</span>
        <ChevronDown className={`w-3 h-3 transition-transform ${
          light ? 'text-white/40' : 'text-gray-400'
        } ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setIsOpen(false)} 
            />
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-black/5 p-2 z-50"
            >
              <div className="px-3 py-2 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-50 mb-1">
                Choisir la langue
              </div>
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => {
                    setLanguage(lang.code as any);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-bold transition-all ${
                    currentLanguage === lang.code
                      ? 'bg-primary/5 text-primary'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{lang.flag}</span>
                    <span>{lang.name}</span>
                  </div>
                  {currentLanguage === lang.code && (
                    <Check className="w-4 h-4" />
                  )}
                </button>
              ))}
              
              {isTranslating && (
                <div className="mt-2 px-3 py-2 bg-primary/5 rounded-xl flex items-center gap-2">
                  <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  <span className="text-[10px] font-bold text-primary uppercase tracking-tight">
                    Traduction IA en cours...
                  </span>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LanguageSwitcher;
