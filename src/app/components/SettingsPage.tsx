import { useRef, useState } from 'react';
import { X, Download, Upload, HelpCircle, LogOut, ChevronRight, Mail, Zap, Shield, FileText, Trash2, Loader2 } from 'lucide-react';
import { useTheme, type ThemeMode } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import type { User as SupabaseUser } from '@supabase/supabase-js';

interface SettingsPageProps {
  onClose: () => void;
  user: SupabaseUser | null;
  onExport: () => void;
  onImport: (data: any) => void;
  onSignOut: () => void;
  onDeleteAccount: () => Promise<void>;
  onShowUpgrade: () => void;
  onShowContact: () => void;
  onShowHelp: () => void;
  onShowPrivacy: () => void;
  onShowTerms: () => void;
  linkCount: number;
  boardCount: number;
  isPro: boolean;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="px-6 py-5" style={{ borderBottom: '1px solid #F3F4F6' }}>
      <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: '#9CA3AF' }}>{title}</p>
      {children}
    </div>
  );
}

function RowBtn({ icon: Icon, label, right, onClick, danger }: {
  icon: React.ElementType; label: string; right?: React.ReactNode; onClick?: () => void; danger?: boolean;
}) {
  return (
    <button onClick={onClick}
      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors text-left"
      style={{ color: danger ? '#EF4444' : '#374151' }}
      onMouseEnter={e => (e.currentTarget.style.background = danger ? 'rgba(239,68,68,0.06)' : '#F9FAFB')}
      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
      <Icon className="w-4 h-4 shrink-0" style={{ color: danger ? '#EF4444' : '#6B7280' }} />
      <span className="flex-1 text-[14px]">{label}</span>
      {right ?? <ChevronRight className="w-4 h-4" style={{ color: '#D1D5DB' }} />}
    </button>
  );
}

export function SettingsPage({ onClose, user, onExport, onImport, onSignOut, onDeleteAccount, onShowUpgrade, onShowContact, onShowHelp, onShowPrivacy, onShowTerms, linkCount, boardCount, isPro }: SettingsPageProps) {
  const { theme, setTheme } = useTheme();
  const { tr } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const email = user?.email ?? '';
  const avatarUrl = user?.user_metadata?.avatar_url;
  const initials = email.charAt(0).toUpperCase();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onImport) {
      const reader = new FileReader();
      reader.onload = ev => {
        try { onImport(JSON.parse(ev.target?.result as string)); }
        catch { alert('Invalid JSON file'); }
      };
      reader.readAsText(file);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const themes: { value: ThemeMode; label: string }[] = [
    { value: 'light',  label: tr('light')  },
    { value: 'dark',   label: tr('dark')   },
    { value: 'system', label: tr('system') },
  ];

  return (
    <>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" style={{ zIndex: 9990 }} onClick={onClose} />
      <div className="fixed inset-0 overflow-y-auto" style={{ zIndex: 9991 }}>
        <div className="min-h-full flex items-center justify-center p-4 py-10">
          <div className="relative w-full max-w-md rounded-3xl shadow-2xl overflow-hidden bg-white">

            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-6 pb-4" style={{ borderBottom: '1px solid #F3F4F6' }}>
              <h2 className="text-[18px] font-bold text-gray-900">{tr('settings')}</h2>
              <button onClick={onClose}
                className="p-2 rounded-xl transition-colors"
                style={{ color: '#9CA3AF' }}
                onMouseEnter={e => { e.currentTarget.style.background = '#F3F4F6'; e.currentTarget.style.color = '#374151'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#9CA3AF'; }}>
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Account */}
            <Section title={tr('account')}>
              <div className="flex items-center gap-3 px-1">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" className="w-12 h-12 rounded-full object-cover shrink-0" />
                ) : (
                  <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 text-white text-lg font-semibold"
                    style={{ background: 'linear-gradient(135deg,#A259FF,#FF7262)' }}>
                    {initials}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-[14px] font-semibold text-gray-800 truncate">{email}</p>
                  <p className="text-[12px] text-gray-400 mt-0.5">
                    {isPro ? tr('proPlan') : tr('freePlan')} · {linkCount} {tr('links')} · {boardCount} {tr('boardsLabel')}
                  </p>
                </div>
              </div>
            </Section>

            {/* Appearance */}
            <Section title={tr('appearance')}>
              <p className="text-[12px] font-medium text-gray-500 mb-2 px-1">{tr('theme')}</p>
              <div className="flex gap-2">
                {themes.map(({ value, label }) => {
                  const active = theme === value;
                  return (
                    <button key={value} onClick={() => setTheme(value)}
                      className="flex-1 py-2 rounded-xl text-[13px] font-medium transition-all"
                      style={{
                        background: active ? '#7C3AED' : '#F9FAFB',
                        color: active ? 'white' : '#374151',
                        border: `1px solid ${active ? '#7C3AED' : '#E5E7EB'}`,
                      }}>
                      {label}
                    </button>
                  );
                })}
              </div>
            </Section>

            {/* Data */}
            <Section title={tr('data')}>
              <RowBtn icon={Download} label={tr('exportLinks')} onClick={() => { onExport(); onClose(); }} />
              <RowBtn icon={Upload} label={tr('importLinks')} onClick={() => fileInputRef.current?.click()} />
            </Section>

            {/* Support */}
            <Section title={tr('support')}>
              <RowBtn icon={Mail} label={tr('contactUs')}
                onClick={() => { onClose(); onShowContact(); }} />
              <RowBtn icon={HelpCircle} label={tr('getHelp')}
                onClick={() => { onClose(); onShowHelp(); }} />
              <RowBtn icon={Shield} label="Privacy Policy"
                onClick={() => { onClose(); onShowPrivacy(); }} />
              <RowBtn icon={FileText} label="Terms & Conditions"
                onClick={() => { onClose(); onShowTerms(); }} />
            </Section>

            {/* Upgrade */}
            {!isPro && (
              <div className="px-6 py-4" style={{ borderBottom: '1px solid #F3F4F6' }}>
                <button onClick={() => { onShowUpgrade(); onClose(); }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-opacity hover:opacity-90"
                  style={{ background: 'linear-gradient(135deg,rgba(124,58,237,0.10),rgba(99,102,241,0.08))', border: '1px solid rgba(124,58,237,0.18)' }}>
                  <Zap className="w-4 h-4" style={{ color: '#7C3AED' }} />
                  <span className="flex-1 text-[14px] font-semibold text-left" style={{ color: '#7C3AED' }}>{tr('upgradeToPro')}</span>
                  <ChevronRight className="w-4 h-4" style={{ color: '#A78BFA' }} />
                </button>
              </div>
            )}

            {/* Sign out + Delete account */}
            <div className="px-6 py-4 space-y-1">
              <RowBtn icon={LogOut} label={tr('logOut')} danger onClick={() => { onSignOut(); onClose(); }} right={null} />

              {!confirmDelete ? (
                <RowBtn icon={Trash2} label="Delete Account" danger onClick={() => setConfirmDelete(true)} right={null} />
              ) : (
                <div className="rounded-2xl p-4 mt-2" style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)' }}>
                  <p className="text-[13px] font-semibold text-red-600 mb-1">Delete your account?</p>
                  <p className="text-[12px] text-gray-500 mb-3">All your saves, boards, and data will be permanently deleted. This cannot be undone.</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setConfirmDelete(false)}
                      className="flex-1 py-2 rounded-xl text-[13px] font-medium text-gray-600 transition-colors hover:bg-gray-100"
                      style={{ border: '1px solid #E5E7EB' }}>
                      Cancel
                    </button>
                    <button
                      disabled={deleteLoading}
                      onClick={async () => {
                        setDeleteLoading(true);
                        try { await onDeleteAccount(); }
                        finally { setDeleteLoading(false); }
                      }}
                      className="flex-1 py-2 rounded-xl text-[13px] font-semibold text-white flex items-center justify-center gap-1.5 transition-opacity hover:opacity-90 disabled:opacity-60"
                      style={{ background: '#EF4444' }}>
                      {deleteLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                      Delete Forever
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
      <input ref={fileInputRef} type="file" accept=".json" className="hidden" onChange={handleFileChange} />
    </>
  );
}
