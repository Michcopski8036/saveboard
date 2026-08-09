import { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { X, Check, Zap, Users, Sparkles, Loader2 } from 'lucide-react';
import { StoreKit, IAP_PRODUCTS, type StoreProduct } from '../lib/storekit';
import { supabase } from '../lib/supabase';
import { authedPost } from '../lib/authedFetch';
import { useLanguage } from '../context/LanguageContext';

const AUD = { proMo: 5.49, proYr: 34.99, teamSeat: 9.49 };

interface UpgradePageProps {
  onClose: () => void;
  currentLinks: number;
  currentBoards: number;
  currentStorageMb?: number;
  userId?: string;
  userEmail?: string;
  isPro?: boolean;
  plan?: 'free' | 'pro' | 'team';
  onPurchaseSuccess?: () => void;
  onShowTerms?: () => void;
  onShowPrivacy?: () => void;
}

export const FREE_LIMITS = { links: 30, boards: 5, fileSizeMb: 5, storageMb: 50 };

const comparisonRows: { feature: string; free: boolean | string; pro: boolean | string; team: boolean | string }[] = [
  { feature: 'Saves',            free: '30 max',     pro: 'Unlimited', team: 'Unlimited' },
  { feature: 'Boards',           free: '5 max',      pro: '15',        team: '50'        },
  { feature: 'Storage',          free: '50MB',       pro: '2GB',       team: '10GB'      },
  { feature: 'File size limit',  free: '5MB',        pro: '20MB',      team: '50MB'      },
  { feature: 'Team boards (collaborative)', free: '1', pro: '5', team: '10' },
  { feature: 'Members per board',free: '5',           pro: '10',        team: '25'        },
  { feature: 'Shared boards',    free: true,         pro: true,        team: true        },
  { feature: 'File uploads',     free: true,         pro: true,        team: true        },
  { feature: 'Notes on cards',   free: true,         pro: true,        team: true        },
  { feature: 'Favorites',        free: true,         pro: true,        team: true        },
  { feature: 'AI tags & summary',free: true,         pro: true,        team: true        },
  { feature: 'Kanban view',      free: true,         pro: true,        team: true        },
  { feature: 'Export saves',     free: true,         pro: true,        team: true        },
  { feature: 'Duplicate & broken link finder', free: false, pro: true, team: true        },
  { feature: 'Reminders',        free: false,        pro: true,        team: true        },
  { feature: 'View-only member roles', free: false,  pro: false,       team: true        },
];

function Cell({ value, highlight }: { value: boolean | string; highlight?: boolean }) {
  if (typeof value === 'string') {
    return (
      <td className="py-3 px-4 text-center">
        <span className="text-[12px] font-medium" style={{ color: highlight ? '#7C3AED' : '#374151' }}>{value}</span>
      </td>
    );
  }
  return (
    <td className="py-3 px-4 text-center">
      {value
        ? <span className="inline-flex items-center justify-center w-6 h-6 rounded-full" style={{ background: '#22C55E' }}><Check className="w-3.5 h-3.5 text-white" strokeWidth={3} /></span>
        : <span className="text-gray-300 text-[16px] font-light">—</span>}
    </td>
  );
}

async function startCheckout(plan: 'pro' | 'team', interval: 'monthly' | 'yearly', userId: string | undefined, userEmail: string | undefined, ko: boolean) {
  if (!userId || !userEmail) { alert(ko ? '먼저 로그인해 주세요.' : 'Please sign in first.'); return; }
  const r = await authedPost<{ url?: string }>('/api/create-checkout', { plan, interval, userId, userEmail });
  if (!r.ok) {
    if (r.reason === 'reauth') {
      alert(ko ? '세션이 만료됐어요. 페이지를 새로고침한 뒤 다시 로그인해 주세요.' : 'Your session expired. Please refresh the page and sign in again.');
      window.location.reload();
      return;
    }
    alert((ko ? '결제 오류: ' : 'Checkout error: ') + r.message);
    return;
  }
  if (r.data?.url) window.location.href = r.data.url;
}

// ── iOS IAP view ─────────────────────────────────────────────────────────────

function IAPUpgradeView({ userId, isPro, onClose, onPurchaseSuccess, onShowTerms, onShowPrivacy }: {
  userId?: string;
  isPro?: boolean;
  onClose: () => void;
  onPurchaseSuccess?: () => void;
  onShowTerms?: () => void;
  onShowPrivacy?: () => void;
}) {
  const { tr, language } = useLanguage();
  const ko = language === 'ko';
  const [products, setProducts] = useState<StoreProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasingId, setPurchasingId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    StoreKit.getProducts({ productIds: Object.values(IAP_PRODUCTS) })
      .then(({ products }) => setProducts(products))
      .catch(() => setErrorMsg('Could not load prices. Check your connection.'))
      .finally(() => setLoading(false));
  }, []);

  const findProduct = (id: string) => products.find(p => p.id === id);
  const monthly = findProduct(IAP_PRODUCTS.proMonthly);
  const yearly  = findProduct(IAP_PRODUCTS.proYearly);

  const handlePurchase = async (productId: string) => {
    if (!userId) { alert('Please sign in first.'); return; }
    setPurchasingId(productId);
    setErrorMsg('');
    try {
      const tx = await StoreKit.purchase({ productId });
      const billingCycle = productId === IAP_PRODUCTS.proYearly ? 'yearly' : 'monthly';
      await supabase.from('subscriptions').upsert({
        user_id: userId,
        plan: 'pro',
        status: 'active',
        billing_cycle: billingCycle,
        current_period_end: tx.expiresDate ?? null,
        saves_limit: 'unlimited',
        boards_limit: '15',
        file_size_limit: '20MB',
        storage_limit: '2GB',
        source: 'apple',
      }, { onConflict: 'user_id' });
      onPurchaseSuccess?.();
      onClose();
    } catch (err: any) {
      if (err?.message !== 'User cancelled') {
        setErrorMsg(err?.message ?? 'Purchase failed. Please try again.');
      }
    } finally {
      setPurchasingId(null);
    }
  };

  return (
    <div className="p-6 space-y-5">
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Sparkles className="w-5 h-5 text-yellow-400" />
          <span className="text-[11px] font-bold uppercase tracking-widest text-purple-600">{tr('upgradeToPro')}</span>
        </div>
        <h2 className="text-[22px] font-bold text-gray-900 mb-1">{tr('saveMoreOrganize')}</h2>
        <p className="text-[13px] text-gray-500">{ko ? 'Apple 구독 설정에서 언제든 해지할 수 있어요' : 'Cancel anytime in your Apple subscription settings'}</p>
      </div>

      <ul className="space-y-2.5 px-1">
        {(ko ? ['무제한 저장','보드 15개','팀 보드 5개 (각 10명)','중복·깨진 링크 정리','2GB 저장공간','우선 지원'] : ['Unlimited saves', '15 boards', '5 team boards (10 members each)', 'Duplicate & broken link finder', '2GB storage', 'Priority support']).map(f => (
          <li key={f} className="flex items-center gap-2.5 text-[14px] text-gray-700">
            <Check className="w-4 h-4 text-purple-500 shrink-0" />{f}
          </li>
        ))}
      </ul>

      {loading ? (
        <div className="flex justify-center py-4">
          <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
        </div>
      ) : (
        <div className="space-y-3">
          {monthly && (
            <button
              disabled={!!purchasingId || isPro}
              onClick={() => handlePurchase(IAP_PRODUCTS.proMonthly)}
              className="w-full py-3.5 px-5 rounded-2xl text-white flex items-center justify-center gap-2 transition-opacity hover:opacity-90 disabled:opacity-60"
              style={{ background: 'linear-gradient(135deg,#7C3AED,#6366F1)' }}>
              {purchasingId === IAP_PRODUCTS.proMonthly ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                <span className="flex w-full items-center justify-between">
                  <span className="text-left">
                    <span className="block text-[15px] font-semibold">SaveBoard Pro — Monthly</span>
                    <span className="block text-[11px] font-normal text-white/70">1 month · auto-renews</span>
                  </span>
                  <span className="text-[16px] font-bold whitespace-nowrap">{monthly.displayPrice}/mo</span>
                </span>
              )}
            </button>
          )}
          {yearly && (
            <button
              disabled={!!purchasingId || isPro}
              onClick={() => handlePurchase(IAP_PRODUCTS.proYearly)}
              className="w-full py-3.5 px-5 rounded-2xl text-white flex items-center justify-center gap-2 transition-opacity hover:opacity-90 disabled:opacity-60"
              style={{ background: 'linear-gradient(135deg,#7C3AED,#6366F1)' }}>
              {purchasingId === IAP_PRODUCTS.proYearly ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                <span className="flex w-full items-center justify-between">
                  <span className="text-left">
                    <span className="block text-[15px] font-semibold">SaveBoard Pro — Yearly</span>
                    <span className="block text-[11px] font-normal text-white/70">12 months · auto-renews · save 47%</span>
                  </span>
                  <span className="text-[16px] font-bold whitespace-nowrap">{yearly.displayPrice}/yr</span>
                </span>
              )}
            </button>
          )}
          {isPro && (
            <p className="text-center text-[13px] font-semibold text-purple-600">✓ You are already on Pro</p>
          )}
        </div>
      )}

      {errorMsg && <p className="text-center text-[13px] text-red-500">{errorMsg}</p>}

      <p className="text-center text-[10px] text-gray-400 leading-relaxed">
        Prices are shown in your local currency as determined by your App Store region. Payment will be charged to your Apple ID. Subscription renews automatically unless cancelled at least 24 hours before the end of the current period. Manage in Apple ID settings.
      </p>

      <div className="flex items-center justify-center gap-3 text-[11px]">
        <button type="button" onClick={onShowTerms} className="text-purple-600 underline underline-offset-2">
          Terms of Use (EULA)
        </button>
        <span className="text-gray-300">·</span>
        <button type="button" onClick={onShowPrivacy} className="text-purple-600 underline underline-offset-2">
          Privacy Policy
        </button>
      </div>

      {/* Team plan — coming soon */}
      <div className="rounded-2xl p-4 opacity-60" style={{ border: '1px dashed #D1D5DB' }}>
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-gray-400" />
            <span className="text-[12px] font-bold uppercase tracking-widest text-gray-400">{tr('team')}</span>
          </div>
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-400">{tr('comingSoon')}</span>
        </div>
        <p className="text-[12px] text-gray-400">{ko ? '무제한 저장, 보드 50개, 10GB 저장공간, 팀 공유 — 곧 출시' : 'Unlimited saves, 50 boards, 10GB storage, team sharing — launching soon'}</p>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

// Korean labels for the feature-comparison table (feature names + special values).
const FEATURE_KO: Record<string, string> = {
  'Saves': '저장', 'Boards': '보드', 'Storage': '저장공간', 'File size limit': '파일 크기 제한',
  'Team boards (collaborative)': '팀 보드(협업)', 'Members per board': '보드당 멤버', 'Shared boards': '공유 보드',
  'File uploads': '파일 업로드', 'Notes on cards': '카드 메모', 'Favorites': '즐겨찾기',
  'AI tags & summary': 'AI 태그 & 요약', 'Kanban view': '칸반 보기', 'Export saves': '내보내기',
  'Duplicate & broken link finder': '중복·깨진 링크 정리', 'View-only member roles': '보기 전용 멤버 권한',
  'Reminders': '리마인더',
};
const valueKo = (v: string) =>
  v === 'Unlimited' ? '무제한' : /^(\d+) max$/.test(v) ? `최대 ${v.match(/^(\d+)/)![1]}` : v;

export function UpgradePage({ onClose, currentLinks, currentBoards, currentStorageMb = 0, userId, userEmail, isPro = false, plan = 'free', onPurchaseSuccess, onShowTerms, onShowPrivacy }: UpgradePageProps) {
  const { tr, language } = useLanguage();
  const ko = language === 'ko';
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const isNative = Capacitor.isNativePlatform();

  // Usage bars must reflect the viewer's own plan, not the Free limits.
  const limits = plan === 'team' ? { links: Infinity, boards: 50, storageMb: 10240 }
    : plan === 'pro' ? { links: Infinity, boards: 15, storageMb: 2048 }
    : { links: FREE_LIMITS.links, boards: FREE_LIMITS.boards, storageMb: FREE_LIMITS.storageMb };
  const linkPct    = limits.links === Infinity ? 0 : Math.min((currentLinks / limits.links) * 100, 100);
  const boardPct   = Math.min((currentBoards   / limits.boards)   * 100, 100);
  const storagePct = Math.min((currentStorageMb / limits.storageMb) * 100, 100);
  const fmtStorage = (mb: number) => mb >= 1000 ? `${(mb / 1024).toFixed(1)}GB` : `${mb}MB`;

  const handleCheckout = async (plan: 'pro' | 'team', interval: 'monthly' | 'yearly' = 'monthly') => {
    setLoadingPlan(`${plan}-${interval}`);
    await startCheckout(plan, interval, userId, userEmail, ko);
    setLoadingPlan(null);
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" style={{ zIndex: 9990 }} onClick={onClose} />
      <div className="fixed inset-0 overflow-y-auto" style={{ zIndex: 9991 }}>
        <div className="min-h-full flex items-center justify-center p-2 py-4 sm:p-4 sm:py-10">
          <div className="relative w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden bg-white">

            {/* Header */}
            <div className="relative px-5 pt-8 pb-6 sm:px-8 sm:pt-10 sm:pb-8 text-center" style={{ background: 'linear-gradient(135deg,#7C3AED 0%,#6366F1 60%,#4F46E5 100%)' }}>
              <button onClick={onClose}
                className="absolute top-4 right-4 p-2 rounded-xl transition-colors"
                style={{ color: 'rgba(255,255,255,0.6)' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; e.currentTarget.style.color = 'white'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.6)'; }}>
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center justify-center gap-2 mb-3">
                <Sparkles className="w-5 h-5 text-yellow-300" />
                <span className="text-[11px] font-bold uppercase tracking-widest text-white/70">{tr('upgradeSaveBoard')}</span>
              </div>
              <h1 className="text-[28px] font-bold text-white mb-2">{tr('saveMoreOrganize')}</h1>
              <p className="text-white/60 text-[14px]">{ko ? '간직할 가치가 있는 모든 것을 저장 · 언제든 해지' : 'Save everything worth keeping · Cancel anytime'}</p>

              {/* Usage indicators */}
              <div className="mt-5 grid grid-cols-3 gap-3 sm:gap-6 bg-white/10 rounded-2xl px-4 sm:px-7 py-4">
                <div className="text-left">
                  <div className="flex items-center justify-between mb-1 gap-1">
                    <p className="text-white/60 text-[10px] sm:text-[11px] shrink-0">{tr('savesWord')}</p>
                    <p className="text-white text-[11px] sm:text-[12px] font-semibold">{limits.links === Infinity ? `${currentLinks}/∞` : `${currentLinks}/${limits.links}`}</p>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-white/20">
                    <div className="h-full rounded-full transition-all" style={{ width: `${linkPct}%`, background: linkPct >= 90 ? '#F87171' : '#A78BFA' }} />
                  </div>
                </div>
                <div className="text-left">
                  <div className="flex items-center justify-between mb-1 gap-1">
                    <p className="text-white/60 text-[10px] sm:text-[11px] shrink-0 capitalize">{tr('boardsLabel')}</p>
                    <p className="text-white text-[11px] sm:text-[12px] font-semibold">{currentBoards}/{limits.boards}</p>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-white/20">
                    <div className="h-full rounded-full transition-all" style={{ width: `${boardPct}%`, background: boardPct >= 90 ? '#F87171' : '#A78BFA' }} />
                  </div>
                </div>
                <div className="text-left">
                  <div className="flex items-center justify-between mb-1 gap-1">
                    <p className="text-white/60 text-[10px] sm:text-[11px] shrink-0">{tr('storage')}</p>
                    <p className="text-white text-[11px] sm:text-[12px] font-semibold">{fmtStorage(currentStorageMb)}/{fmtStorage(limits.storageMb)}</p>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-white/20">
                    <div className="h-full rounded-full transition-all" style={{ width: `${storagePct}%`, background: storagePct >= 90 ? '#F87171' : '#A78BFA' }} />
                  </div>
                </div>
              </div>
            </div>

            {/* iOS: Apple IAP view */}
            {isNative ? (
              <IAPUpgradeView
                userId={userId}
                isPro={isPro}
                onClose={onClose}
                onPurchaseSuccess={onPurchaseSuccess}
                onShowTerms={onShowTerms}
                onShowPrivacy={onShowPrivacy}
              />
            ) : (
              <>
                {/* Web/Android: Stripe pricing cards */}
                <div className="p-4 sm:p-8 grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">

                  {/* Free */}
                  <div className="rounded-2xl p-4 sm:p-6 flex flex-col" style={{ border: '1px solid #E5E7EB' }}>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">{tr('freeWord')}</p>
                    <p className="text-[32px] font-bold text-gray-900 leading-none mb-1">$0</p>
                    <p className="text-[12px] text-gray-400 mb-5">{tr('foreverFree')}</p>
                    <ul className="space-y-2.5 mb-6 flex-1">
                      {(ko ? ['저장 30개','보드 5개','50MB 저장공간','파일 크기 5MB','모든 기능 포함'] : ['30 saves', '5 boards', '50MB storage', '5MB file size limit', 'All features included']).map(f => (
                        <li key={f} className="flex items-center gap-2.5 text-[13px] text-gray-500">
                          <Check className="w-3.5 h-3.5 text-gray-300 shrink-0" />{f}
                        </li>
                      ))}
                    </ul>
                    {!isPro && (
                      <button disabled className="w-full py-2.5 rounded-xl text-[13px] font-semibold text-gray-300 cursor-default" style={{ border: '1px solid #E5E7EB' }}>
                        {ko ? '현재 플랜' : 'Current plan'}
                      </button>
                    )}
                  </div>

                  {/* Pro */}
                  <div className="rounded-2xl p-4 sm:p-6 relative flex flex-col" style={{ border: '2px solid #7C3AED', background: 'linear-gradient(135deg,rgba(124,58,237,0.04),rgba(99,102,241,0.04))' }}>
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-[10px] font-bold text-white tracking-widest uppercase"
                      style={{ background: 'linear-gradient(135deg,#7C3AED,#6366F1)' }}>
                      {ko ? '가장 인기' : 'Most Popular'}
                    </div>
                    <div className="flex items-center gap-1.5 mb-2">
                      <Zap className="w-3.5 h-3.5 text-purple-600" />
                      <p className="text-[10px] font-bold uppercase tracking-widest text-purple-600">Pro</p>
                    </div>
                    <p className="text-[32px] font-bold text-gray-900 leading-none mb-0.5">A${AUD.proMo}<span className="text-[16px] font-normal text-gray-400">/mo</span></p>
                    <p className="text-[12px] font-semibold text-purple-600 mb-5">{ko ? `또는 A$${AUD.proYr}/년 — 47% 할인` : `or A$${AUD.proYr}/yr — save 47%`}</p>
                    <ul className="space-y-2.5 mb-6 flex-1">
                      {(ko ? ['무제한 저장','보드 15개','팀 보드 5개 (각 10명)','중복·깨진 링크 정리','2GB 저장공간','우선 지원'] : ['Unlimited saves','15 boards','5 team boards (10 members each)','Duplicate & broken link finder','2GB storage','Priority support']).map(f => (
                        <li key={f} className="flex items-center gap-2.5 text-[13px] text-gray-700">
                          <Check className="w-3.5 h-3.5 text-purple-500 shrink-0" />{f}
                        </li>
                      ))}
                    </ul>
                    {isPro ? (
                      <button disabled className="w-full py-2.5 rounded-xl text-[13px] font-semibold cursor-default flex items-center justify-center gap-1.5" style={{ background: 'rgba(124,58,237,0.10)', color: '#7C3AED' }}>
                        {ko ? '✓ 현재 플랜' : '✓ Current Plan'}
                      </button>
                    ) : (
                      <div className="flex gap-2">
                        <button
                          className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold text-white transition-opacity hover:opacity-90 flex items-center justify-center gap-1.5 disabled:opacity-60"
                          style={{ background: 'linear-gradient(135deg,#7C3AED,#6366F1)' }}
                          disabled={!!loadingPlan}
                          onClick={() => handleCheckout('pro', 'monthly')}>
                          {loadingPlan === 'pro-monthly' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                          {ko ? '월간' : 'Monthly'}
                        </button>
                        <button
                          className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold text-white transition-opacity hover:opacity-90 flex items-center justify-center gap-1.5 disabled:opacity-60"
                          style={{ background: 'linear-gradient(135deg,#7C3AED,#6366F1)' }}
                          disabled={!!loadingPlan}
                          onClick={() => handleCheckout('pro', 'yearly')}>
                          {loadingPlan === 'pro-yearly' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                          {ko ? '연간 −47%' : 'Yearly −47%'}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Team */}
                  <div className="rounded-2xl p-6 flex flex-col" style={{ border: '1px solid #E5E7EB' }}>
                    <div className="flex items-center gap-1.5 mb-2">
                      <Users className="w-3.5 h-3.5 text-gray-500" />
                      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">{tr('team')}</p>
                    </div>
                    <p className="text-[32px] font-bold text-gray-900 leading-none mb-0.5">A${AUD.teamSeat}<span className="text-[16px] font-normal text-gray-400">/mo</span></p>
                    <p className="text-[12px] text-gray-400 mb-5">{ko ? '월간 결제' : 'Billed monthly'}</p>
                    <ul className="space-y-2.5 mb-6 flex-1">
                      {(ko ? ['협업 팀 보드','공유 보드 10개, 각 25명','보기 전용 멤버 권한','무제한 저장 · 보드 50개','10GB 저장공간'] : ['Collaborative team boards','10 shared boards, 25 members each','View-only member roles','Unlimited saves · 50 boards','10GB storage']).map(f => (
                        <li key={f} className="flex items-center gap-2.5 text-[13px] text-gray-600">
                          <Check className="w-3.5 h-3.5 text-blue-400 shrink-0" />{f}
                        </li>
                      ))}
                    </ul>
                    <button
                      className="w-full py-2.5 rounded-xl text-[13px] font-semibold text-gray-700 transition-colors hover:bg-gray-50 flex items-center justify-center gap-1.5 disabled:opacity-60"
                      style={{ border: '1px solid #E5E7EB' }}
                      disabled={!!loadingPlan}
                      onClick={() => handleCheckout('team', 'monthly')}>
                      {loadingPlan === 'team-monthly' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                      {ko ? '팀 시작하기 →' : 'Get Team →'}
                    </button>
                  </div>
                </div>

                {/* Comparison table */}
                <div className="px-4 pb-6 sm:px-8 sm:pb-8 overflow-x-auto">
                  <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid #E5E7EB' }}>
                    <table className="w-full border-collapse">
                      <thead>
                        <tr style={{ background: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                          <th className="py-3 px-4 text-left text-[11px] font-semibold uppercase tracking-widest text-gray-400">{tr('feature')}</th>
                          <th className="py-3 px-4 text-center text-[11px] font-semibold uppercase tracking-widest text-gray-400">{tr('freeWord')}</th>
                          <th className="py-3 px-4 text-center text-[11px] font-semibold uppercase tracking-widest" style={{ color: '#7C3AED' }}>Pro</th>
                          <th className="py-3 px-4 text-center text-[11px] font-semibold uppercase tracking-widest text-gray-400">{tr('team')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {comparisonRows.map((row, i) => {
                          const cv = (v: boolean | string) => (ko && typeof v === 'string' ? valueKo(v) : v);
                          return (
                          <tr key={row.feature} style={{ borderTop: i > 0 ? '1px solid #F3F4F6' : undefined }}>
                            <td className="py-3 px-4 text-[13px] text-gray-700">{ko ? (FEATURE_KO[row.feature] ?? row.feature) : row.feature}</td>
                            <Cell value={cv(row.free)} />
                            <Cell value={cv(row.pro)} highlight />
                            <Cell value={cv(row.team)} />
                          </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                <p className="text-center text-[10px] sm:text-[11px] text-gray-400 px-4 pb-2">
                  {ko ? '무료 플랜은 카드 필요 없음 · Stripe 안전 결제 · 언제든 해지' : 'No credit card required for free plan · Secure payments via Stripe · Cancel anytime'}
                </p>
                <p className="text-center text-[10px] sm:text-[11px] text-gray-400 pb-4 sm:pb-6">
                  {ko ? '가격은 호주 달러(AUD) 기준 · 호주 외 지역은 은행이 현재 환율로 환전해요' : 'Prices shown in AUD (Australian Dollars) · If you are outside Australia, your bank will convert at the current exchange rate'}
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
