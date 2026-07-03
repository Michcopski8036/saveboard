import { createContext, useContext, useState, useEffect } from 'react';
import { translations, type Language, type TranslationKey } from '../utils/translations';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  tr: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  setLanguage: () => {},
  tr: (key) => key,
});

// Available UI languages (keys of the translations dict).
const SUPPORTED: Language[] = ['en', 'ko', 'ja', 'zh', 'es', 'fr'];

// Pick the initial language: an explicit stored choice wins; otherwise fall
// back to the browser/device locale (so a Korean phone opens in Korean), then en.
function detectLanguage(): Language {
  const stored = localStorage.getItem('lb-language') as Language | null;
  if (stored && SUPPORTED.includes(stored)) return stored;
  const nav = (navigator.languages?.[0] || navigator.language || 'en').toLowerCase();
  const base = nav.split('-')[0] as Language;
  return SUPPORTED.includes(base) ? base : 'en';
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>(detectLanguage);

  // Keep <html lang> in sync with the detected/initial language on mount.
  useEffect(() => {
    document.documentElement.lang = language;
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('lb-language', lang);
    document.documentElement.lang = lang;
  };

  const tr = (key: TranslationKey): string =>
    translations[language]?.[key] ?? translations.en[key] ?? key;

  return (
    <LanguageContext.Provider value={{ language, setLanguage, tr }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => useContext(LanguageContext);
