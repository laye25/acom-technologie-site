import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { translateText } from '../lib/gemini';

type Language = 'fr' | 'en' | 'wo';

interface TranslationCache {
  [lang: string]: {
    [text: string]: string;
  };
}

interface LanguageContextType {
  currentLanguage: Language;
  setLanguage: (lang: Language) => void;
  t: (text: string) => string;
  isTranslating: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('app_language');
    return (saved as Language) || 'fr';
  });
  
  const [cache, setCache] = useState<TranslationCache>(() => {
    const saved = localStorage.getItem('translation_cache');
    return saved ? JSON.parse(saved) : {};
  });

  const [isTranslating, setIsTranslating] = useState(false);

  useEffect(() => {
    localStorage.setItem('app_language', currentLanguage);
  }, [currentLanguage]);

  useEffect(() => {
    localStorage.setItem('translation_cache', JSON.stringify(cache));
  }, [cache]);

  const t = useCallback((text: string): string => {
    if (currentLanguage === 'fr') return text;
    
    const langCache = cache[currentLanguage] || {};
    if (langCache[text]) {
      return langCache[text];
    }

    // If not in cache, we trigger an async translation but return the original text for now
    // to avoid blocking the UI. The next render will pick up the translated value.
    if (!isTranslating) {
      translateAndCache(text, currentLanguage);
    }
    
    return text;
  }, [currentLanguage, cache, isTranslating]);

  const translateAndCache = async (text: string, lang: Language) => {
    if (lang === 'fr' || !text || text.trim() === '') return;
    
    setIsTranslating(true);
    try {
      const targetLangName = lang === 'en' ? 'Anglais' : 'Wolof';
      const translated = await translateText(text, targetLangName);
      
      setCache(prev => ({
        ...prev,
        [lang]: {
          ...(prev[lang] || {}),
          [text]: translated
        }
      }));
    } catch (error) {
      console.error('Translation error:', error);
    } finally {
      setIsTranslating(false);
    }
  };

  const setLanguage = (lang: Language) => {
    setCurrentLanguage(lang);
  };

  return (
    <LanguageContext.Provider value={{ currentLanguage, setLanguage, t, isTranslating }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useTranslation = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useTranslation must be used within a LanguageProvider');
  }
  return context;
};

export const Translate: React.FC<{ children: string }> = ({ children }) => {
  const { t } = useTranslation();
  return <>{t(children)}</>;
};
