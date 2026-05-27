import { useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';
import { X, Zap, Users, ExternalLink, CreditCard, Calendar, CheckCircle, AlertCircle, Loader2, RotateCcw } from 'lucide-react';

interface SubData {
  plan: string;
  status: string;
  billing_cycle: string;
  current_period_end: string;
  saves_limit: string;
  boards_limit: string;
  storage_limit: string;
}

interface BillingPageProps {
  onClose: () => void;
  onShowUpgrade: () => void;
  onRestorePurchases: () => Promise<void>;
  userId?: string;
  currentLinks: number;
  currentBoards: number;
  currentStorageMb: number;
  subData?: SubData | null;
}

async function openPortal(userId?: string) {
  if (Capacitor.isNativePlatform()) {
    // iOS users manage their subscription through Apple
    await Browser.open({ url: 'https://apps.apple.com/account/subscriptions' });
    return;
  }
  // Web / Android → Stripe portal
  if (!userId) return;
  try {
    const res = await fetch('/api/create-portal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });
    const { url, error } = await res.json();
    if (error) { alert(`Error: ${error}`); return; }
    window.location.href = url;
  } catch (err: any) {
    alert(`Billing error: ${err?.message ?? String(err)}`);
  }
}

function UsageBar({ label, used, limit, isStorage }: { label: string; used: number; limit: number; isStorage?: boolean }) {
  const pct = Math.min((used / limit) * 100, 100);
  const warn = pct >= 80;
  const over = pct >= 100;
  const fmtMb = (mb: number) => mb >= 1024 ? `${(mb / 1024).toFixed(1)}GB` : `${mb}MB`;
  const usedStr = isStorage ? fmtMb(used) : used;
  const limitStr = isStorage ? fmtMb(limit) : limit;
  return (
    <div>
      <div className="flex justify-between items-center mb-1.5">
        <span className="text-[13px] text-gray-600">{label}</span>
        <span className="text-[13px] font-semibold" style={{ color: over ? '#EF4444' : '#374151' }}>
          {usedStr} <span className="text-gray-400 font-normal">/ {limitStr}</span>
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-gray-100">
        <div className="h-full rounded-full transition-all" style={{
          width: `${pct}%`,
          background: over ? '#EF4444' : warn ? '#F97316' : 'linear-gradient(90deg,#A78BFA,#7C3AED)',
        }} />
      </div>
    </div>
  );
}

export function BillingPage({ onClose, onShowUpgrade, onRestorePurchases, userId, currentLinks, currentBoards, currentStorageMb, subData }: BillingPageProps) {
  const [portalLoading, setPortalLoading] = useState(false);
  const [restoreLoading, setRestoreLoading] = useState(false);
  const [restoreMsg, setRestoreMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const plan = subData?.plan ?? 'free';
  const status = subData?.status ?? 'none';
  const billingCycle = subData?.billing_cycle ?? '';
  const periodEnd = subData?.current_period_end ? new Date(subData.current_period_end) : null;
  const isActive = status === 'active';
  const isPro = plan === 'pro' && isActive;
  const isTeam = plan === 'team' && isActive;

  const savesLimit   = parseInt(subData?.saves_limit   ?? '30');
  const boardsLimit  = parseInt(subData?.boards_limit  ?? '5');
  const storageLimitMb = subData?.storage_limit
    ? subData.storage_limit.endsWith('GB')
      ? parseFloat(subData.storage_limit) * 1024
      : parseFloat(subData.storage_limit)
    : 50;

  const planLabel = isTeam ? 'Team' : isPro ? 'Pro' : 'Free';
  const planColor = isTeam ? '#3B82F6' : isPro ? '#7C3AED' : '#9CA3AF';

  const handlePortal = async () => {
    setPortalLoading(true);
    await openPortal(userId);
    setPortalLoading(false);
  };

  const handleRestore = async () => {
    setRestoreLoading(true);
    setRestoreMsg(null);
    try {
      await onRestorePurchases();
      setRestoreMsg({ ok: true, text: 'Subscription restored successfully.' });
    } catch {
      setRestoreMsg({ ok: false, text: 'No active subscription found.' });
    } finally {
      setRestoreLoading(false);
      setTimeout(() => setRestoreMsg(null), 3000);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" style={{ zIndex: 9990 }} onClick={onClose} />
      <div className="fixed inset-0 overflow-y-auto" style={{ zIndex: 9991 }}>
        <div className="min-h-full flex items-center justify-center p-4 py-10">
          <div className="relative w-full max-w-lg rounded-3xl shadow-2xl bg-white overflow-hidden">

            {/* Header */}
            <div className="relative px-8 pt-8 pb-6" style={{ background: 'linear-gradient(135deg,#7C3AED 0%,#6366F1 60%,#4F46E5 100%)' }}>
              <button onClick={onClose}
                className="absolute top-4 right-4 p-2 rounded-xl transition-colors"
                style={{ color: 'rgba(255,255,255,0.6)' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; e.currentTarget.style.color = 'white'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.6)'; }}>
                <X className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-3 mb-1">
                <CreditCard className="w-5 h-5 text-white/70" />
                <h2 className="text-[20px] font-bold text-white">Billing & Plan</h2>
              </div>
              <p className="text-white/60 text-[13px]">Manage your subscription and usage</p>
            </div>

            <div className="p-6 space-y-5">

              {/* Current plan card */}
              <div className="rounded-2xl p-5" style={{ border: `2px solid ${planColor}20`, background: `${planColor}08` }}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {isTeam ? <Users className="w-4 h-4" style={{ color: planColor }} />
                             : isPro ? <Zap className="w-4 h-4" style={{ color: planColor }} />
                             : null}
                    <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color: planColor }}>{planLabel} Plan</span>
                  </div>
                  <span className="flex items-center gap-1.5 text-[12px] font-semibold" style={{ color: isActive ? '#16A34A' : '#DC2626' }}>
                    {isActive
                      ? <><CheckCircle className="w-3.5 h-3.5" /> Active</>
                      : <><AlertCircle className="w-3.5 h-3.5" /> {status || 'Inactive'}</>}
                  </span>
                </div>

                {isActive && (
                  <div className="space-y-2 text-[13px] text-gray-600">
                    {billingCycle && (
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-gray-400" />
                        <span>Billed <span className="font-medium text-gray-800">{billingCycle}</span></span>
                      </div>
                    )}
                    {periodEnd && (
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-gray-400" />
                        <span>Renews <span className="font-medium text-gray-800">{periodEnd.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span></span>
                      </div>
                    )}
                  </div>
                )}

                {!isActive && (
                  <p className="text-[13px] text-gray-500">You are on the free plan.</p>
                )}
              </div>

              {/* Usage */}
              <div className="rounded-2xl p-5" style={{ border: '1px solid #E5E7EB' }}>
                <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-4">Usage</p>
                <div className="space-y-4">
                  <UsageBar label="Saves" used={currentLinks} limit={savesLimit} />
                  <UsageBar label="Boards" used={currentBoards} limit={boardsLimit} />
                  <UsageBar label="Storage" used={currentStorageMb} limit={storageLimitMb} isStorage />
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-3">
                {isActive && (
                  <button
                    onClick={handlePortal}
                    disabled={portalLoading}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-[14px] font-semibold transition-colors disabled:opacity-60"
                    style={{ border: '1.5px solid #7C3AED', color: '#7C3AED' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(124,58,237,0.05)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}>
                    {portalLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ExternalLink className="w-4 h-4" />}
                    Manage Billing & Payments
                  </button>
                )}

                {isPro && (
                  <button
                    onClick={() => { onClose(); onShowUpgrade(); }}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-[14px] font-semibold text-white transition-opacity hover:opacity-90"
                    style={{ background: 'linear-gradient(135deg,#3B82F6,#2563EB)' }}>
                    <Users className="w-4 h-4" />
                    Upgrade to Team
                  </button>
                )}

                <button
                  onClick={() => { onClose(); onShowUpgrade(); }}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-[14px] font-semibold text-gray-600 transition-colors hover:bg-gray-50"
                  style={{ border: '1px solid #E5E7EB' }}>
                  {isPro || isTeam ? 'View All Plans' : 'Upgrade Plan'}
                </button>

                <button
                  onClick={handleRestore}
                  disabled={restoreLoading}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-[14px] font-semibold text-gray-500 transition-colors hover:bg-gray-50 disabled:opacity-60"
                  style={{ border: '1px solid #E5E7EB' }}>
                  {restoreLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
                  Restore Purchases
                </button>

                {restoreMsg && (
                  <p className="text-center text-[12px] font-medium" style={{ color: restoreMsg.ok ? '#16A34A' : '#DC2626' }}>
                    {restoreMsg.text}
                  </p>
                )}
              </div>

              {isActive && (
                <p className="text-center text-[11px] text-gray-400">
                  To cancel or change your payment method, use "Manage Billing" above.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
