import { useState } from 'react';
import { X, Check, Search } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import type { Language } from '../utils/translations';

const LANGUAGES: { code: Language; native: string; english: string; color: string }[] = [
  { code: 'en', native: 'English',   english: 'English',  color: '#2563EB' },
  { code: 'ko', native: '한국어',     english: 'Korean',   color: '#7C3AED' },
  { code: 'ja', native: '日本語',     english: 'Japanese', color: '#DC2626' },
  { code: 'zh', native: '中文',       english: 'Chinese',  color: '#D97706' },
  { code: 'es', native: 'Español',   english: 'Spanish',  color: '#059669' },
  { code: 'fr', native: 'Français',  english: 'French',   color: '#DB2777' },
];

interface LanguagePageProps {
  onClose: () => void;
}

export function LanguagePage({ onClose }: LanguagePageProps) {
  const { language, setLanguage, tr } = useLanguage();
  const [search, setSearch] = useState('');

  const filtered = LANGUAGES.filter(l =>
    l.native.toLowerCase().includes(search.toLowerCase()) ||
    l.english.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (code: Language) => {
    setLanguage(code);
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" style={{ zIndex: 9990 }} onClick={onClose} />
      <div className="fixed inset-0 overflow-y-auto" style={{ zIndex: 9991 }}>
        <div className="min-h-full flex items-center justify-center p-4 py-10">
          <div className="relative w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden bg-white">

            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-6 pb-4" style={{ borderBottom: '1px solid #F3F4F6' }}>
              <h2 className="text-[18px] font-bold text-gray-900">{tr('chooseLanguage')}</h2>
              <button onClick={onClose}
                className="p-2 rounded-xl transition-colors"
                style={{ color: '#9CA3AF' }}
                onMouseEnter={e => { e.currentTarget.style.background = '#F3F4F6'; e.currentTarget.style.color = '#374151'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#9CA3AF'; }}>
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search */}
            <div className="px-4 py-3" style={{ borderBottom: '1px solid #F3F4F6' }}>
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: '#F9FAFB', border: '1px solid #E5E7EB' }}>
                <Search className="w-4 h-4 shrink-0" style={{ color: '#9CA3AF' }} />
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder={tr('searchLanguage')}
                  className="flex-1 bg-transparent outline-none text-gray-700 placeholder-gray-400"
                  style={{ fontSize: '16px' }}
                  autoFocus
                />
              </div>
            </div>

            {/* Language list */}
            <div className="py-2 max-h-[400px] overflow-y-auto">
              {filtered.map(lang => {
                const active = language === lang.code;
                return (
                  <button
                    key={lang.code}
                    onClick={() => handleSelect(lang.code)}
                    className="w-full flex items-center gap-3 px-5 py-3 transition-colors text-left"
                    onMouseEnter={e => { if (!active) e.currentTarget.style.background = '#F9FAFB'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = active ? 'rgba(124,58,237,0.06)' : 'transparent'; }}
                    style={{ background: active ? 'rgba(124,58,237,0.06)' : 'transparent' }}
                  >
                    <span
                      className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-white text-[11px] font-bold"
                      style={{ background: lang.color }}
                    >
                      {lang.code.toUpperCase()}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-semibold text-gray-800">{lang.native}</p>
                      <p className="text-[12px] text-gray-400">{lang.english}</p>
                    </div>
                    {active && <Check className="w-4 h-4 shrink-0" style={{ color: '#7C3AED' }} />}
                  </button>
                );
              })}
              {filtered.length === 0 && (
                <p className="text-center text-[13px] text-gray-400 py-8">{tr('noLanguagesFound')}</p>
              )}
            </div>

          </div>
        </div>
      </div>
    </>
  );
}
