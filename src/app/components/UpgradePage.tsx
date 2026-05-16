import { useState } from 'react';
import { X, Check, Zap, Users, Sparkles, Loader2 } from 'lucide-react';

interface UpgradePageProps {
  onClose: () => void;
  currentLinks: number;
  currentBoards: number;
  userId?: string;
  userEmail?: string;
}

export const FREE_LIMITS = { links: 30, boards: 5, fileSizeMb: 5, storageMb: 50 };

const comparisonRows: { feature: string; free: boolean | string; pro: boolean | string; team: boolean | string }[] = [
  { feature: 'Saves',            free: '30 max',     pro: '300',       team: 'Unlimited' },
  { feature: 'Boards',           free: '5 max',      pro: '30',        team: 'Unlimited' },
  { feature: 'Storage',          free: '50MB',       pro: '2GB',       team: '10GB'      },
  { feature: 'File size limit',  free: '5MB',        pro: '20MB',      team: '50MB'      },
  { feature: 'File uploads',     free: true,         pro: true,        team: true        },
  { feature: 'Notes on cards',   free: true,         pro: true,        team: true        },
  { feature: 'Favorites',        free: true,         pro: true,        team: true        },
  { feature: 'AI tags & summary',free: true,         pro: true,        team: true        },
  { feature: 'Kanban view',      free: true,         pro: true,        team: true        },
  { feature: 'Export saves',     free: true,         pro: true,        team: true        },
  { feature: 'Shared boards',    free: true,         pro: true,        team: true        },
  { feature: 'Team members',     free: '1',          pro: '3',         team: '5+'        },
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

async function startCheckout(plan: 'pro' | 'team', interval: 'monthly' | 'yearly', userId?: string, userEmail?: string) {
  if (!userId || !userEmail) { alert('Please sign in first.'); return; }
  const res = await fetch('/api/create-checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ plan, interval, userId, userEmail }),
  });
  const { url, error } = await res.json();
  if (error) { alert(`Checkout error: ${error}`); return; }
  window.location.href = url;
}

export function UpgradePage({ onClose, currentLinks, currentBoards, userId, userEmail }: UpgradePageProps) {
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const linkPct  = Math.min((currentLinks  / FREE_LIMITS.links)  * 100, 100);
  const boardPct = Math.min((currentBoards / FREE_LIMITS.boards) * 100, 100);

  const handleCheckout = async (plan: 'pro' | 'team', interval: 'monthly' | 'yearly' = 'monthly') => {
    setLoadingPlan(`${plan}-${interval}`);
    await startCheckout(plan, interval, userId, userEmail);
    setLoadingPlan(null);
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" style={{ zIndex: 9990 }} onClick={onClose} />
      <div className="fixed inset-0 overflow-y-auto" style={{ zIndex: 9991 }}>
        <div className="min-h-full flex items-center justify-center p-4 py-10">
          <div className="relative w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden bg-white">

            {/* Header */}
            <div className="relative px-8 pt-10 pb-8 text-center" style={{ background: 'linear-gradient(135deg,#7C3AED 0%,#6366F1 60%,#4F46E5 100%)' }}>
              <button onClick={onClose}
                className="absolute top-4 right-4 p-2 rounded-xl transition-colors"
                style={{ color: 'rgba(255,255,255,0.6)' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; e.currentTarget.style.color = 'white'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.6)'; }}>
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center justify-center gap-2 mb-3">
                <Sparkles className="w-5 h-5 text-yellow-300" />
                <span className="text-[11px] font-bold uppercase tracking-widest text-white/70">Upgrade SaveBoard</span>
              </div>
              <h1 className="text-[28px] font-bold text-white mb-2">Save more. Organize better.</h1>
              <p className="text-white/60 text-[14px]">15% cheaper than Raindrop · Cancel anytime</p>

              {/* Usage indicators */}
              <div className="mt-6 inline-flex gap-8 bg-white/10 rounded-2xl px-8 py-4">
                <div className="text-left">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-white/60 text-[11px]">Saves</p>
                    <p className="text-white text-[12px] font-semibold">{currentLinks}/{FREE_LIMITS.links}</p>
                  </div>
                  <div className="w-28 h-1.5 rounded-full bg-white/20">
                    <div className="h-full rounded-full transition-all" style={{ width: `${linkPct}%`, background: linkPct >= 90 ? '#F87171' : '#A78BFA' }} />
                  </div>
                </div>
                <div className="text-left">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-white/60 text-[11px]">Boards</p>
                    <p className="text-white text-[12px] font-semibold">{currentBoards}/{FREE_LIMITS.boards}</p>
                  </div>
                  <div className="w-28 h-1.5 rounded-full bg-white/20">
                    <div className="h-full rounded-full transition-all" style={{ width: `${boardPct}%`, background: boardPct >= 90 ? '#F87171' : '#A78BFA' }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Pricing cards */}
            <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-5">

              {/* Free */}
              <div className="rounded-2xl p-6 flex flex-col" style={{ border: '1px solid #E5E7EB' }}>
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Free</p>
                <p className="text-[32px] font-bold text-gray-900 leading-none mb-1">$0</p>
                <p className="text-[12px] text-gray-400 mb-5">Forever free</p>
                <ul className="space-y-2.5 mb-6 flex-1">
                  {['30 saves', '5 boards', '50MB storage', '5MB file size limit', 'All features included'].map(f => (
                    <li key={f} className="flex items-center gap-2.5 text-[13px] text-gray-500">
                      <Check className="w-3.5 h-3.5 text-gray-300 shrink-0" />{f}
                    </li>
                  ))}
                </ul>
                <button disabled className="w-full py-2.5 rounded-xl text-[13px] font-semibold text-gray-300 cursor-default" style={{ border: '1px solid #E5E7EB' }}>
                  Current plan
                </button>
              </div>

              {/* Pro */}
              <div className="rounded-2xl p-6 relative flex flex-col" style={{ border: '2px solid #7C3AED', background: 'linear-gradient(135deg,rgba(124,58,237,0.04),rgba(99,102,241,0.04))' }}>
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-[10px] font-bold text-white tracking-widest uppercase"
                  style={{ background: 'linear-gradient(135deg,#7C3AED,#6366F1)' }}>
                  Most Popular
                </div>
                <div className="flex items-center gap-1.5 mb-2">
                  <Zap className="w-3.5 h-3.5 text-purple-600" />
                  <p className="text-[10px] font-bold uppercase tracking-widest text-purple-600">Pro</p>
                </div>
                <p className="text-[32px] font-bold text-gray-900 leading-none mb-0.5">$3.49<span className="text-[16px] font-normal text-gray-400">/mo</span></p>
                <p className="text-[12px] font-semibold text-purple-600 mb-5">or $24/yr — save 43%</p>
                <ul className="space-y-2.5 mb-6 flex-1">
                  {['300 saves','30 boards','2GB storage','20MB file size limit','All features included','Priority support','3 team members'].map(f => (
                    <li key={f} className="flex items-center gap-2.5 text-[13px] text-gray-700">
                      <Check className="w-3.5 h-3.5 text-purple-500 shrink-0" />{f}
                    </li>
                  ))}
                </ul>
                <div className="flex gap-2">
                  <button
                    className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold text-white transition-opacity hover:opacity-90 flex items-center justify-center gap-1.5 disabled:opacity-60"
                    style={{ background: 'linear-gradient(135deg,#7C3AED,#6366F1)' }}
                    disabled={!!loadingPlan}
                    onClick={() => handleCheckout('pro', 'monthly')}>
                    {loadingPlan === 'pro-monthly' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                    Monthly
                  </button>
                  <button
                    className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold text-white transition-opacity hover:opacity-90 flex items-center justify-center gap-1.5 disabled:opacity-60"
                    style={{ background: 'linear-gradient(135deg,#7C3AED,#6366F1)' }}
                    disabled={!!loadingPlan}
                    onClick={() => handleCheckout('pro', 'yearly')}>
                    {loadingPlan === 'pro-yearly' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                    Yearly −43%
                  </button>
                </div>
              </div>

              {/* Team */}
              <div className="rounded-2xl p-6 flex flex-col" style={{ border: '1px solid #E5E7EB' }}>
                <div className="flex items-center gap-1.5 mb-2">
                  <Users className="w-3.5 h-3.5 text-gray-500" />
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Team</p>
                </div>
                <p className="text-[32px] font-bold text-gray-900 leading-none mb-0.5">$6<span className="text-[16px] font-normal text-gray-400">/seat/mo</span></p>
                <p className="text-[12px] text-gray-400 mb-5">Min 3 seats · billed monthly</p>
                <ul className="space-y-2.5 mb-6 flex-1">
                  {['Unlimited saves','Unlimited boards','10GB storage','50MB file size limit','All features included','5+ team members','Admin dashboard'].map(f => (
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
                  Get Team →
                </button>
              </div>
            </div>

            {/* Comparison table */}
            <div className="px-8 pb-8">
              <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid #E5E7EB' }}>
                <table className="w-full border-collapse">
                  <thead>
                    <tr style={{ background: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                      <th className="py-3 px-4 text-left text-[11px] font-semibold uppercase tracking-widest text-gray-400">Feature</th>
                      <th className="py-3 px-4 text-center text-[11px] font-semibold uppercase tracking-widest text-gray-400">Free</th>
                      <th className="py-3 px-4 text-center text-[11px] font-semibold uppercase tracking-widest" style={{ color: '#7C3AED' }}>Pro</th>
                      <th className="py-3 px-4 text-center text-[11px] font-semibold uppercase tracking-widest text-gray-400">Team</th>
                    </tr>
                  </thead>
                  <tbody>
                    {comparisonRows.map((row, i) => (
                      <tr key={row.feature} style={{ borderTop: i > 0 ? '1px solid #F3F4F6' : undefined }}>
                        <td className="py-3 px-4 text-[13px] text-gray-700">{row.feature}</td>
                        <Cell value={row.free} />
                        <Cell value={row.pro} highlight />
                        <Cell value={row.team} />
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <p className="text-center text-[11px] text-gray-400 pb-6">
              No credit card required for free plan · Secure payments via Stripe · Cancel anytime
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
