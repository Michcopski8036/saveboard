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

// The language the document was *served* as. index.html ships lang="en", so this
// is only Korean on a prerendered Korean page (/pocket-alternative-ko, a -ko
// guide). Read once at module load, before any effect can overwrite it.
const SERVED_KO = typeof document !== 'undefined'
  && document.documentElement.lang.toLowerCase().startsWith('ko');

// Pick the initial language: an explicit stored choice wins; then the language
// the page itself is written in (English chrome around a Korean article reads as
// a bug); otherwise the browser/device locale, then en.
function detectLanguage(): Language {
  const stored = localStorage.getItem('lb-language') as Language | null;
  if (stored && SUPPORTED.includes(stored)) return stored;
  if (SERVED_KO) return 'ko';
  const nav = (navigator.languages?.[0] || navigator.language || 'en').toLowerCase();
  const base = nav.split('-')[0] as Language;
  return SUPPORTED.includes(base) ? base : 'en';
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>(detectLanguage);

  // Keep <html lang> in sync with the detected/initial language on mount.
  // A page that was served as Korean keeps the tag it shipped with: this effect
  // runs after the page component's own effects (children first), so without the
  // guard it would quietly relabel a Korean page as English.
  useEffect(() => {
    if (!SERVED_KO) document.documentElement.lang = language;
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
