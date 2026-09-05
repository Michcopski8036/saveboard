import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { App as CapApp } from '@capacitor/app';
import { Browser } from '@capacitor/browser';
import { Download, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';

// Compare dotted versions ("1.0.10" vs "1.0.9") numerically. -1 if a<b, 0 eq, 1 a>b.
function cmpVersion(a: string, b: string): number {
  const pa = a.split('.').map(n => parseInt(n, 10) || 0);
  const pb = b.split('.').map(n => parseInt(n, 10) || 0);
  const len = Math.max(pa.length, pb.length);
  for (let i = 0; i < len; i++) {
    const x = pa[i] ?? 0, y = pb[i] ?? 0;
    if (x !== y) return x < y ? -1 : 1;
  }
  return 0;
}

type Mode = 'none' | 'soft' | 'force';

// Native-only. On launch, compares the running app version against per-platform
// latest/min values in Supabase `app_config`. Below `min_version` → blocking
// "update required" screen; below `latest_version` → dismissible top banner.
// Fully fail-safe: any error (web, no config, bad data) renders nothing — it
// can never lock a user out on its own.
export function UpdateGate() {
  const { t } = useTheme();
  const { tr } = useLanguage();
  const [mode, setMode] = useState<Mode>('none');
  const [storeUrl, setStoreUrl] = useState('');
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (!Capacitor.isNativePlatform()) return;      // native app only
        const platform = Capacitor.getPlatform();        // 'ios' | 'android'
        if (platform !== 'ios' && platform !== 'android') return;

        const info = await CapApp.getInfo();
        const current = info.version;                     // running version, e.g. "1.0.10"

        const { data } = await supabase
          .from('app_config')
          .select('latest_version, min_version, store_url')
          .eq('platform', platform)
          .maybeSingle();
        if (cancelled || !data) return;

        const cfg = data as { latest_version?: string; min_version?: string; store_url?: string };
        if (cfg.store_url) setStoreUrl(cfg.store_url);

        if (cfg.min_version && cmpVersion(current, cfg.min_version) < 0) setMode('force');
        else if (cfg.latest_version && cmpVersion(current, cfg.latest_version) < 0) setMode('soft');
      } catch { /* fail-safe: never block */ }
    })();
    return () => { cancelled = true; };
  }, []);

  const openStore = async () => {
    if (!storeUrl) return;
    try { await Browser.open({ url: storeUrl }); }
    catch { try { window.open(storeUrl, '_blank'); } catch { /* ignore */ } }
  };

  if (mode === 'none' || (mode === 'soft' && dismissed)) return null;

  if (mode === 'force') {
    return (
      <div className="fixed inset-0 z-[120] flex items-center justify-center p-6" style={{ background: t.pageBg }}>
        <div className="w-full max-w-xs text-center rounded-2xl p-6" style={{ background: t.cardBg, border: `1px solid ${t.cardBorder}` }}>
          <div className="w-12 h-12 mx-auto rounded-2xl flex items-center justify-center mb-4" style={{ background: t.badgeBg }}>
            <Download className="w-6 h-6" style={{ color: t.badgeText }} />
          </div>
          <p className="text-[16px] font-bold mb-1" style={{ color: t.textPrimary }}>{tr('updateRequiredTitle')}</p>
          <p className="text-[13px] mb-5" style={{ color: t.textMuted }}>{tr('updateRequiredBody')}</p>
          <button onClick={openStore}
            className="w-full py-2.5 rounded-xl font-semibold text-[14px] text-white transition-opacity hover:opacity-90"
            style={{ background: 'linear-gradient(135deg,#7C3AED,#6366F1)' }}>
            {tr('openStore')}
          </button>
        </div>
      </div>
    );
  }

  // soft — dismissible banner
  return (
    // 상태바(노치·다이내믹아일랜드) 아래에서 시작해야 한다. pt-3 만 두면 배너가 시계와
    // 통신사 아이콘 위로 올라가 문구가 가려진다 — 실기기에서 확인됨(2026-09-05).
    // 헤더·랜딩 네비 등 이 앱의 다른 상단 고정 요소들은 모두 이 값을 쓴다.
    <div
      className="fixed top-0 inset-x-0 z-[90] px-3 pointer-events-none"
      style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 0.75rem)' }}
    >
      <div className="mx-auto max-w-md flex items-center gap-3 rounded-xl px-4 py-2.5 shadow-lg pointer-events-auto"
        style={{ background: t.cardBg, border: `1px solid ${t.cardBorder}` }}>
        <Download className="w-4 h-4 shrink-0" style={{ color: '#7C3AED' }} />
        <span className="flex-1 text-[13px]" style={{ color: t.textSecondary }}>{tr('updateAvailable')}</span>
        <button onClick={openStore} className="text-[13px] font-semibold shrink-0" style={{ color: '#7C3AED' }}>{tr('update')}</button>
        <button onClick={() => setDismissed(true)} className="p-1 rounded-lg shrink-0" style={{ color: t.iconMuted }} aria-label="Dismiss">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
