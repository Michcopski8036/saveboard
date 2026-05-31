import { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, LogOut, Download, Upload, Settings, Globe, HelpCircle, Zap, CreditCard, BarChart2 } from 'lucide-react';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { useTheme, type ThemeMode } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';

interface ProfileMenuProps {
  onExport?: () => void;
  onImport?: (data: any) => void;
  onSignOut?: () => void;
  onShowUpgrade?: () => void;
  onShowSettings?: () => void;
  onShowLanguage?: () => void;
  onShowHelp?: () => void;
  onShowBilling?: () => void;
  onShowAdmin?: () => void;
  user?: SupabaseUser | null;
  isPro?: boolean;
  currentLinks?: number;
  currentBoards?: number;
  currentStorageMb?: number;
}

export function ProfileMenu({ onExport, onImport, onSignOut, onShowUpgrade, onShowBilling, onShowSettings, onShowLanguage, onShowHelp, onShowAdmin, user, isPro, currentLinks = 0, currentBoards = 0, currentStorageMb = 0 }: ProfileMenuProps) {
  const { theme, setTheme } = useTheme();
  const { tr } = useLanguage();
  const [showMenu, setShowMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleProfileClick = (e: React.MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setMenuPosition({ x: rect.right - 220, y: rect.bottom + 8 });
    setShowMenu(!showMenu);
  };

  const handleExport = () => { if (onExport) onExport(); setShowMenu(false); };
  const handleImportClick = () => { fileInputRef.current?.click(); setShowMenu(false); };
  const handleSignOut = () => { if (onSignOut) onSignOut(); setShowMenu(false); };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onImport) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = JSON.parse(event.target?.result as string);
          onImport(data);
        } catch { alert('Invalid JSON file'); }
      };
      reader.readAsText(file);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const avatarUrl = user?.user_metadata?.avatar_url;
  const email = user?.email || '';
  const initials = email.charAt(0).toUpperCase();

  return (
    <>
      <button onClick={handleProfileClick} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
        {avatarUrl ? (
          <img src={avatarUrl} alt="Profile" className="w-8 h-8 rounded-full object-cover" />
        ) : (
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#A259FF] to-[#FF7262] flex items-center justify-center text-white text-sm font-medium">
            {initials}
          </div>
        )}
        <ChevronDown className="w-4 h-4 text-gray-700" />
      </button>

      {showMenu && createPortal(
        <>
          <div className="fixed inset-0" style={{ zIndex: 9980 }} onClick={() => setShowMenu(false)} />
          <div
            className="fixed bg-white rounded-[10px] shadow-2xl w-[220px] overflow-hidden"
            style={{ zIndex: 9981, top: `${menuPosition.y}px`, left: `${menuPosition.x}px` }}
          >
            <div className="p-2">
              {email && (
                <div className="px-3 py-2">
                  <p className="text-xs text-gray-400 truncate">{email}</p>
                  {isPro && (
                    <span className="inline-block mt-1 text-[9px] px-1.5 py-0.5 rounded-full font-bold" style={{ color: '#7C3AED', background: 'rgba(124,58,237,0.10)' }}>PRO</span>
                  )}
                </div>
              )}
              {/* Usage stats */}
              <div className="mx-3 mb-2 p-2.5 rounded-xl" style={{ background: '#F9FAFB', border: '1px solid #F3F4F6' }}>
                {[
                  { label: 'Saves', used: currentLinks, limit: isPro ? 300 : 30 },
                  { label: 'Boards', used: currentBoards, limit: isPro ? 30 : 5 },
                  { label: 'Storage', used: currentStorageMb, limit: isPro ? 2048 : 50, isStorage: true },
                ].map(({ label, used, limit, isStorage }) => {
                  const pct = Math.min((used / limit) * 100, 100);
                  const over = pct >= 100;
                  const warn = pct >= 80;
                  const fmtMb = (mb: number) => mb >= 1024 ? `${(mb / 1024).toFixed(1)}GB` : `${mb}MB`;
                  const usedStr = isStorage ? fmtMb(used) : used;
                  const limitStr = isStorage ? fmtMb(limit) : limit;
                  return (
                    <div key={label} className="mb-2 last:mb-0">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[10px] text-gray-400">{label}</span>
                        <span className="text-[10px] font-semibold" style={{ color: over ? '#EF4444' : '#374151' }}>{usedStr}/{limitStr}</span>
                      </div>
                      <div className="h-1 rounded-full bg-gray-200">
                        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: over ? '#EF4444' : warn ? '#F97316' : '#A78BFA' }} />
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="border-t border-gray-200 my-1" />
              <button onClick={() => { onShowSettings?.(); setShowMenu(false); }} className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-100 rounded-[10px] transition-colors">
                <Settings className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-700">{tr('settings')}</span>
              </button>
              <button onClick={() => { onShowLanguage?.(); setShowMenu(false); }} className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-100 rounded-[10px] transition-colors">
                <Globe className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-700">{tr('language')}</span>
              </button>
              <button onClick={() => { onShowHelp?.(); setShowMenu(false); }} className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-100 rounded-[10px] transition-colors">
                <HelpCircle className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-700">{tr('getHelp')}</span>
              </button>
              <div className="border-t border-gray-200 my-1" />
              <p className="px-3 pt-1.5 pb-1 text-[10px] font-semibold uppercase tracking-widest text-gray-400">{tr('theme')}</p>
              {([
                { mode: 'light' as ThemeMode, label: tr('light') },
                { mode: 'dark'  as ThemeMode, label: tr('dark')  },
                { mode: 'system' as ThemeMode, label: tr('system') },
              ]).map(({ mode, label }) => (
                <button key={mode} onClick={() => setTheme(mode)}
                  className="w-full flex items-center gap-3 px-3 py-1.5 hover:bg-gray-100 rounded-[10px] transition-colors">
                  <span className="w-4 flex items-center justify-center">
                    {theme === mode
                      ? <span className="w-2 h-2 rounded-full bg-gray-800 block" />
                      : <span className="w-2 h-2 rounded-full border border-gray-300 block" />}
                  </span>
                  <span className="text-sm text-gray-700">{label}</span>
                </button>
              ))}
              <div className="border-t border-gray-200 my-1" />
              {isPro && (
                <button onClick={() => { onShowBilling?.(); setShowMenu(false); }} className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-100 rounded-[10px] transition-colors">
                  <CreditCard className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-700">Billing</span>
                </button>
              )}
              <button onClick={handleExport} className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-100 rounded-[10px] transition-colors">
                <Download className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-700">{tr('exportLinks')}</span>
              </button>
              <button onClick={handleImportClick} className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-100 rounded-[10px] transition-colors">
                <Upload className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-700">{tr('importLinks')}</span>
                {!isPro && <span className="ml-auto text-[9px] px-1.5 py-0.5 rounded-full font-bold" style={{ color: '#7C3AED', background: 'rgba(124,58,237,0.10)' }}>PRO</span>}
              </button>
              <div className="border-t border-gray-200 my-1" />
              <button onClick={() => { onShowUpgrade?.(); setShowMenu(false); }}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-[10px] transition-colors"
                style={{ background: 'linear-gradient(135deg,rgba(124,58,237,0.08),rgba(99,102,241,0.08))' }}>
                <Zap className="w-4 h-4" style={{ color: '#7C3AED' }} />
                <span className="text-sm font-semibold" style={{ color: '#7C3AED' }}>{isPro ? 'View Plans' : tr('upgradeToPro')}</span>
              </button>
              {onShowAdmin && (
                <>
                  <div className="border-t border-gray-200 my-1" />
                  <button onClick={() => { onShowAdmin(); setShowMenu(false); }}
                    className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-100 rounded-[10px] transition-colors">
                    <BarChart2 className="w-4 h-4" style={{ color: '#7C3AED' }} />
                    <span className="text-sm font-semibold" style={{ color: '#7C3AED' }}>Admin Dashboard</span>
                  </button>
                </>
              )}
              <div className="border-t border-gray-200 my-1" />
              <button onClick={handleSignOut} className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-100 rounded-[10px] transition-colors text-red-500">
                <LogOut className="w-4 h-4" />
                <span className="text-sm">{tr('logOut')}</span>
              </button>
            </div>
            <input ref={fileInputRef} type="file" accept=".json" onChange={handleFileChange} className="hidden" />
          </div>
        </>,
        document.body
      )}
    </>
  );
}