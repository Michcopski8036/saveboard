import { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  Users, Link2, TrendingUp, Share2, Eye, Crown, Apple, CreditCard,
  RefreshCw, BarChart2, Tag, Folder, Calendar, ArrowUp, ArrowDown,
  Minus, Globe, Smartphone, AlertCircle, CheckCircle, XCircle, ChevronDown, Loader2,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { supabase } from '../lib/supabase';
import { WorldMap } from './WorldMap';
import { SeoPanel } from './SeoPanel';

interface AdminStats {
  overview: {
    totalUsers: number; newThisWeek: number; newThisMonth: number;
    totalLinks: number; linksThisWeek: number;
    totalSharedBoards: number; totalShareViews: number;
  };
  subscriptions: {
    proCount: number; teamCount: number; freeCount: number;
    monthlyPro: number; yearlyPro: number;
    stripeCount: number; appleCount: number; cancelledCount: number;
  };
  recentUsers: Array<{
    id: string; email: string; created_at: string;
    plan: string; status: string; source: string | null; linkCount: number; boardCount: number;
  }>;
  topCategories: Array<{ category: string; count: number }>;
  topTags: Array<{ tag: string; count: number }>;
  linksOverTime: Array<{ date: string; count: number }>;
  topSharedBoards: Array<{
    token: string; category: string; owner_email: string;
    view_count: number; created_at: string;
  }>;
  usersByCountry: Array<{ iso3: string; count: number }>;
  unknownLocationCount: number;
  generatedAt: string;
}

// ── Mini bar chart ─────────────────────────────────────────────────────────
function SparkBar({ data, color = '#7C3AED' }: { data: number[]; color?: string }) {
  const max = Math.max(...data, 1);
  return (
    <div className="flex items-end gap-[2px] h-10">
      {data.map((v, i) => (
        <div key={i} className="flex-1 rounded-sm transition-all"
          style={{ height: `${Math.max(2, (v / max) * 100)}%`, background: color, opacity: 0.7 + (i / data.length) * 0.3 }} />
      ))}
    </div>
  );
}

// ── Inline donut ───────────────────────────────────────────────────────────
function DonutRing({ segments }: { segments: Array<{ value: number; color: string; label: string }> }) {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  let offset = 0;
  const r = 30; const circ = 2 * Math.PI * r;
  return (
    <svg viewBox="0 0 80 80" className="w-20 h-20">
      {segments.map((seg, i) => {
        const dash = (seg.value / total) * circ;
        const gap  = circ - dash;
        const el = (
          <circle key={i} cx="40" cy="40" r={r}
            fill="none" stroke={seg.color} strokeWidth="12"
            strokeDasharray={`${dash} ${gap}`}
            strokeDashoffset={-offset * circ / total + circ / 4}
            strokeLinecap="butt" />
        );
        offset += seg.value;
        return el;
      })}
      <circle cx="40" cy="40" r="22" fill="white" className="dark:fill-gray-900" />
    </svg>
  );
}

// ── KPI Card ───────────────────────────────────────────────────────────────
function KpiCard({ icon: Icon, label, value, sub, color, spark }: {
  icon: React.ElementType; label: string; value: string | number;
  sub?: string; color: string; spark?: number[];
}) {
  const { t } = useTheme();
  return (
    <div className="rounded-2xl p-5 flex flex-col gap-3"
      style={{ background: t.cardBg, border: `1px solid ${t.cardBorder}`, boxShadow: t.cardShadow }}>
      <div className="flex items-center justify-between">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: color + '18' }}>
          <Icon className="w-4.5 h-4.5" style={{ color }} />
        </div>
        {spark && <SparkBar data={spark} color={color} />}
      </div>
      <div>
        <p className="text-[28px] font-bold leading-none" style={{ color: t.textPrimary }}>
          {typeof value === 'number' ? value.toLocaleString() : value}
        </p>
        <p className="text-[12px] font-semibold mt-1" style={{ color: t.textMuted }}>{label}</p>
        {sub && <p className="text-[11px] mt-0.5" style={{ color: t.textFaint }}>{sub}</p>}
      </div>
    </div>
  );
}

// ── Section header ─────────────────────────────────────────────────────────
function Section({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) {
  const { t } = useTheme();
  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <Icon className="w-4 h-4" style={{ color: '#7C3AED' }} />
        <h2 className="text-[13px] font-bold uppercase tracking-widest" style={{ color: t.textMuted }}>{title}</h2>
      </div>
      {children}
    </div>
  );
}

// ── Plan badge ─────────────────────────────────────────────────────────────
function PlanBadge({ plan, source }: { plan: string; source: string | null }) {
  if (plan === 'pro') return (
    <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-bold"
      style={{ background: 'rgba(124,58,237,0.12)', color: '#7C3AED', border: '1px solid rgba(124,58,237,0.25)' }}>
      <Crown className="w-2.5 h-2.5" /> PRO {source === 'apple' ? '🍎' : '💳'}
    </span>
  );
  if (plan === 'team') return (
    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold"
      style={{ background: 'rgba(6,182,212,0.12)', color: '#0891B2', border: '1px solid rgba(6,182,212,0.25)' }}>
      TEAM
    </span>
  );
  return (
    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold"
      style={{ background: 'rgba(107,114,128,0.10)', color: '#6B7280', border: '1px solid rgba(107,114,128,0.2)' }}>
      FREE
    </span>
  );
}

const PLAN_OPTIONS = [
  { key: 'free',        label: 'Free',           color: '#6B7280', bg: 'rgba(107,114,128,0.10)', border: 'rgba(107,114,128,0.2)' },
  { key: 'pro_monthly', label: 'Pro · Monthly',  color: '#7C3AED', bg: 'rgba(124,58,237,0.12)', border: 'rgba(124,58,237,0.25)' },
  { key: 'pro_yearly',  label: 'Pro · Yearly',   color: '#7C3AED', bg: 'rgba(124,58,237,0.12)', border: 'rgba(124,58,237,0.25)' },
  { key: 'team',        label: 'Team',           color: '#0891B2', bg: 'rgba(6,182,212,0.12)',  border: 'rgba(6,182,212,0.25)'  },
] as const;

type PlanKey = typeof PLAN_OPTIONS[number]['key'];

function planKeyFromUser(plan: string, source: string | null, billingCycle?: string): PlanKey {
  if (plan === 'team') return 'team';
  if (plan === 'pro') return billingCycle === 'yearly' ? 'pro_yearly' : 'pro_monthly';
  return 'free';
}

function PlanSelector({ userId, plan, source, onUpdate }: {
  userId: string; plan: string; source: string | null;
  onUpdate: (userId: string, planKey: PlanKey) => Promise<void>;
}) {
  const { t } = useTheme();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dropPos, setDropPos] = useState({ top: 0, left: 0 });
  const btnRef  = useRef<HTMLButtonElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);
  const current = PLAN_OPTIONS.find(o => o.key === planKeyFromUser(plan, source)) ?? PLAN_OPTIONS[0];

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      const t = e.target as Node;
      if (btnRef.current?.contains(t) || dropRef.current?.contains(t)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const handleOpen = () => {
    if (!btnRef.current) return;
    const r = btnRef.current.getBoundingClientRect();
    setDropPos({ top: r.bottom + window.scrollY + 4, left: r.left + window.scrollX });
    setOpen(v => !v);
  };

  const handleSelect = async (key: PlanKey) => {
    setOpen(false);
    if (key === planKeyFromUser(plan, source)) return;
    setSaving(true);
    await onUpdate(userId, key);
    setSaving(false);
  };

  return (
    <>
      <button ref={btnRef} onClick={handleOpen} disabled={saving}
        className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-bold transition-opacity hover:opacity-80"
        style={{ background: current.bg, color: current.color, border: `1px solid ${current.border}` }}>
        {saving
          ? <Loader2 className="w-2.5 h-2.5 animate-spin" />
          : (current.key === 'pro_monthly' || current.key === 'pro_yearly')
            ? <><Crown className="w-2.5 h-2.5" /> {current.label}</>
            : current.label
        }
        {!saving && <ChevronDown className="w-2.5 h-2.5 opacity-60" />}
      </button>

      {open && createPortal(
        <div ref={dropRef} style={{ position: 'absolute', top: dropPos.top, left: dropPos.left, width: 144, zIndex: 9999,
          background: t.modalBg, border: `1px solid ${t.modalBorder}`, borderRadius: 12,
          boxShadow: '0 8px 24px rgba(0,0,0,0.15)', padding: '4px 0' }}>
          {PLAN_OPTIONS.map(opt => (
            <button key={opt.key} onMouseDown={() => handleSelect(opt.key)}
              className="w-full text-left px-3 py-2 text-[11px] font-semibold flex items-center gap-2 transition-colors"
              style={{ color: opt.color, background: opt.key === planKeyFromUser(plan, source) ? opt.bg : 'transparent' }}
              onMouseEnter={e => { e.currentTarget.style.background = opt.bg; }}
              onMouseLeave={e => { e.currentTarget.style.background = opt.key === planKeyFromUser(plan, source) ? opt.bg : 'transparent'; }}>
              {(opt.key === 'pro_monthly' || opt.key === 'pro_yearly') ? <Crown className="w-3 h-3" /> : null}
              {opt.label}
              {opt.key === planKeyFromUser(plan, source) && <CheckCircle className="w-3 h-3 ml-auto" />}
            </button>
          ))}
        </div>,
        document.body
      )}
    </>
  );
}

// ── Bar row ────────────────────────────────────────────────────────────────
function BarRow({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const { t } = useTheme();
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="flex items-center gap-3">
      <p className="text-[12px] truncate w-32 shrink-0" style={{ color: t.textPrimary }}>{label}</p>
      <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: t.cardBorder }}>
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: color }} />
      </div>
      <p className="text-[11px] w-8 text-right shrink-0" style={{ color: t.textMuted }}>{value}</p>
    </div>
  );
}

export function AdminDashboard({ onClose, userEmail }: { onClose: () => void; userEmail: string }) {
  const { t } = useTheme();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [planOverrides, setPlanOverrides] = useState<Record<string, PlanKey>>({});
  const [planError, setPlanError] = useState<string | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');
      setAccessToken(session.access_token);
      const res = await fetch('/api/admin-stats', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setStats(data);
      setLastRefresh(new Date());
    } catch (e: any) {
      setError(e.message ?? 'Failed to load stats');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  const updatePlan = useCallback(async (userId: string, planKey: PlanKey) => {
    setPlanError(null);
    const token = accessToken;
    if (!token) { setPlanError('Session not ready — try refreshing'); return; }
    const prev = planOverrides[userId];
    setPlanOverrides(p => ({ ...p, [userId]: planKey })); // optimistic
    try {
      const res = await fetch('/api/admin-update-plan', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, planKey }),
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error ?? 'Update failed'); }
    } catch (e: any) {
      setPlanError(e.message);
      setPlanOverrides(p => { const n = { ...p }; if (prev !== undefined) n[userId] = prev; else delete n[userId]; return n; });
    }
  }, [accessToken, planOverrides]);

  const totalPaid = (stats?.subscriptions.proCount ?? 0) + (stats?.subscriptions.teamCount ?? 0);
  const totalUsers = stats?.overview.totalUsers ?? 0;
  const conversionRate = totalUsers > 0 ? ((totalPaid / totalUsers) * 100).toFixed(1) : '0';

  // Spark for links over time (last 30 days, show last 14 as spark)
  const spark14 = (stats?.linksOverTime ?? []).slice(-14).map(d => d.count);

  return (
    <div className="fixed inset-0 z-[500] overflow-y-auto" style={{ background: t.pageBg }}>

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4"
        style={{ background: t.cardBg, borderBottom: `1px solid ${t.cardBorder}`, backdropFilter: 'blur(12px)' }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg,#7C3AED,#6366F1)' }}>
            <BarChart2 className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-[15px] font-bold" style={{ color: t.textPrimary }}>SaveBoard Admin</h1>
            {lastRefresh && (
              <p className="text-[10px]" style={{ color: t.textFaint }}>
                Updated {lastRefresh.toLocaleTimeString()}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchStats} disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-semibold transition-all"
            style={{ background: t.hoverBg, color: t.textMuted }}>
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button onClick={onClose}
            className="px-4 py-1.5 rounded-xl text-[12px] font-semibold text-white"
            style={{ background: 'linear-gradient(135deg,#7C3AED,#6366F1)' }}>
            ← Back to App
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8 space-y-10">

        {/* ── Error ───────────────────────────────────────────────────────── */}
        {error && (
          <div className="flex items-center gap-3 px-4 py-3 rounded-2xl"
            style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <p className="text-[13px] text-red-400">{error}</p>
          </div>
        )}

        {/* ── Loading skeleton ─────────────────────────────────────────────── */}
        {loading && !stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-28 rounded-2xl animate-pulse" style={{ background: t.cardBg }} />
            ))}
          </div>
        )}

        {stats && (
          <>
            {/* ═══════════════════════════════════════════════════════════════
                SECTION 1 · OVERVIEW
            ═══════════════════════════════════════════════════════════════ */}
            <Section title="Overview" icon={TrendingUp}>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <KpiCard icon={Users} label="Total Users" value={stats.overview.totalUsers}
                  sub={`+${stats.overview.newThisWeek} this week`} color="#7C3AED" />
                <KpiCard icon={Crown} label="Paid Subscribers" value={totalPaid}
                  sub={`${conversionRate}% conversion`} color="#F59E0B" />
                <KpiCard icon={Link2} label="Total Links Saved" value={stats.overview.totalLinks}
                  sub={`+${stats.overview.linksThisWeek} this week`} color="#10B981" spark={spark14} />
                <KpiCard icon={Eye} label="Share Views" value={stats.overview.totalShareViews}
                  sub={`${stats.overview.totalSharedBoards} shared boards`} color="#3B82F6" />
              </div>

              {/* Links over time chart */}
              <div className="mt-4 rounded-2xl p-5"
                style={{ background: t.cardBg, border: `1px solid ${t.cardBorder}` }}>
                <p className="text-[12px] font-bold mb-4" style={{ color: t.textMuted }}>
                  LINKS SAVED — LAST 30 DAYS
                </p>
                <div className="flex items-end gap-[3px] h-28">
                  {stats.linksOverTime.map((d, i) => {
                    const max = Math.max(...stats.linksOverTime.map(x => x.count), 1);
                    const pct = Math.max(2, (d.count / max) * 100);
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
                        <div className="absolute -top-6 left-1/2 -translate-x-1/2 hidden group-hover:block z-10 whitespace-nowrap px-1.5 py-0.5 rounded text-[9px] font-semibold"
                          style={{ background: '#7C3AED', color: '#fff' }}>
                          {d.date.slice(5)} · {d.count}
                        </div>
                        <div className="w-full rounded-t-sm"
                          style={{ height: `${pct}%`, background: `linear-gradient(to top, #7C3AED, #A78BFA)`, opacity: 0.75 + (i / 30) * 0.25 }} />
                      </div>
                    );
                  })}
                </div>
                <div className="flex justify-between mt-2">
                  <p className="text-[10px]" style={{ color: t.textFaint }}>{stats.linksOverTime[0]?.date}</p>
                  <p className="text-[10px]" style={{ color: t.textFaint }}>{stats.linksOverTime[stats.linksOverTime.length - 1]?.date}</p>
                </div>
              </div>
            </Section>

            {/* ═══════════════════════════════════════════════════════════════
                SECTION 2 · USER LOCATIONS
            ═══════════════════════════════════════════════════════════════ */}
            <Section title="User Locations" icon={Globe}>
              <WorldMap
                usersByCountry={stats.usersByCountry}
                unknownLocationCount={stats.unknownLocationCount}
              />
            </Section>

            {/* ═══════════════════════════════════════════════════════════════
                SECTION 3 · REVENUE & SUBSCRIPTIONS
            ═══════════════════════════════════════════════════════════════ */}
            <Section title="Revenue & Subscriptions" icon={CreditCard}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                {/* Plan breakdown donut */}
                <div className="rounded-2xl p-5" style={{ background: t.cardBg, border: `1px solid ${t.cardBorder}` }}>
                  <p className="text-[12px] font-bold mb-4" style={{ color: t.textMuted }}>PLAN BREAKDOWN</p>
                  <div className="flex items-center gap-4">
                    <DonutRing segments={[
                      { value: stats.subscriptions.freeCount,  color: '#E5E7EB', label: 'Free'  },
                      { value: stats.subscriptions.proCount,   color: '#7C3AED', label: 'Pro'   },
                      { value: stats.subscriptions.teamCount,  color: '#0891B2', label: 'Team'  },
                    ]} />
                    <div className="space-y-2 text-[12px]">
                      {[
                        { label: 'Free',  value: stats.subscriptions.freeCount,  color: '#9CA3AF' },
                        { label: 'Pro',   value: stats.subscriptions.proCount,   color: '#7C3AED' },
                        { label: 'Team',  value: stats.subscriptions.teamCount,  color: '#0891B2' },
                      ].map(({ label, value, color }) => (
                        <div key={label} className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
                          <span style={{ color: t.textPrimary }}>{label}</span>
                          <span className="font-bold ml-auto" style={{ color: t.textPrimary }}>{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Billing cycle */}
                <div className="rounded-2xl p-5" style={{ background: t.cardBg, border: `1px solid ${t.cardBorder}` }}>
                  <p className="text-[12px] font-bold mb-4" style={{ color: t.textMuted }}>BILLING CYCLE (PRO)</p>
                  <div className="space-y-3">
                    <BarRow label="Monthly" value={stats.subscriptions.monthlyPro}
                      max={stats.subscriptions.proCount || 1} color="#7C3AED" />
                    <BarRow label="Yearly" value={stats.subscriptions.yearlyPro}
                      max={stats.subscriptions.proCount || 1} color="#A78BFA" />
                  </div>
                  <div className="mt-4 pt-4 flex items-center gap-2" style={{ borderTop: `1px solid ${t.cardBorder}` }}>
                    <XCircle className="w-3.5 h-3.5 text-red-400" />
                    <span className="text-[12px]" style={{ color: t.textMuted }}>
                      {stats.subscriptions.cancelledCount} cancelled
                    </span>
                  </div>
                </div>

                {/* Platform source */}
                <div className="rounded-2xl p-5" style={{ background: t.cardBg, border: `1px solid ${t.cardBorder}` }}>
                  <p className="text-[12px] font-bold mb-4" style={{ color: t.textMuted }}>BILLING PLATFORM</p>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                        style={{ background: 'rgba(99,102,241,0.12)' }}>
                        <CreditCard className="w-4 h-4" style={{ color: '#6366F1' }} />
                      </div>
                      <div>
                        <p className="text-[13px] font-bold" style={{ color: t.textPrimary }}>{stats.subscriptions.stripeCount}</p>
                        <p className="text-[11px]" style={{ color: t.textMuted }}>Stripe (web + Android)</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                        style={{ background: 'rgba(0,0,0,0.06)' }}>
                        <Apple className="w-4 h-4" style={{ color: t.textPrimary }} />
                      </div>
                      <div>
                        <p className="text-[13px] font-bold" style={{ color: t.textPrimary }}>{stats.subscriptions.appleCount}</p>
                        <p className="text-[11px]" style={{ color: t.textMuted }}>Apple IAP (iOS)</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Section>

            {/* ═══════════════════════════════════════════════════════════════
                SECTION 3 · RECENT USERS
            ═══════════════════════════════════════════════════════════════ */}
            <Section title="Recent Users" icon={Users}>
              {planError && (
                <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl mb-3 text-[12px]"
                  style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#EF4444' }}>
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  Plan update failed: {planError}
                </div>
              )}
              <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${t.cardBorder}` }}>
                <table className="w-full text-[12px]">
                  <thead>
                    <tr style={{ background: t.cardBg, borderBottom: `1px solid ${t.cardBorder}` }}>
                      {['Email', 'Joined', 'Plan', 'Links', 'Boards'].map(h => (
                        <th key={h} className="text-left px-4 py-3 font-bold uppercase tracking-wider text-[10px]"
                          style={{ color: t.textFaint }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {stats.recentUsers.map((u, i) => {
                      const effectivePlan = planOverrides[u.id] === 'free' ? 'free'
                        : planOverrides[u.id]?.startsWith('pro') ? 'pro'
                        : planOverrides[u.id] === 'team' ? 'team'
                        : u.plan;
                      const effectiveSource = planOverrides[u.id] ? 'admin' : u.source;
                      return (
                        <tr key={u.id}
                          style={{ background: i % 2 === 0 ? t.pageBg : t.cardBg, borderBottom: `1px solid ${t.cardBorder}` }}>
                          <td className="px-4 py-2.5 font-medium truncate max-w-[200px]" style={{ color: t.textPrimary }}>
                            {u.email}
                          </td>
                          <td className="px-4 py-2.5" style={{ color: t.textMuted }}>
                            {new Date(u.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-2.5">
                            <PlanSelector
                              userId={u.id}
                              plan={effectivePlan}
                              source={effectiveSource}
                              onUpdate={updatePlan}
                            />
                          </td>
                          <td className="px-4 py-2.5 font-bold" style={{ color: t.textPrimary }}>
                            {u.linkCount}
                          </td>
                          <td className="px-4 py-2.5 font-bold" style={{ color: t.textPrimary }}>
                            {u.boardCount}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Section>

            {/* ═══════════════════════════════════════════════════════════════
                SECTION 4 · CONTENT
            ═══════════════════════════════════════════════════════════════ */}
            <Section title="Content" icon={Folder}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                {/* Top boards */}
                <div className="rounded-2xl p-5" style={{ background: t.cardBg, border: `1px solid ${t.cardBorder}` }}>
                  <p className="text-[12px] font-bold mb-4" style={{ color: t.textMuted }}>TOP BOARDS</p>
                  <div className="space-y-2.5">
                    {stats.topCategories.slice(0, 8).map(({ category, count }) => (
                      <BarRow key={category} label={category} value={count}
                        max={stats.topCategories[0]?.count ?? 1} color="#10B981" />
                    ))}
                    {stats.topCategories.length === 0 && (
                      <p className="text-[12px]" style={{ color: t.textFaint }}>No board data yet</p>
                    )}
                  </div>
                </div>

                {/* Top tags */}
                <div className="rounded-2xl p-5" style={{ background: t.cardBg, border: `1px solid ${t.cardBorder}` }}>
                  <p className="text-[12px] font-bold mb-4" style={{ color: t.textMuted }}>TOP TAGS</p>
                  <div className="flex flex-wrap gap-2">
                    {stats.topTags.map(({ tag, count }) => (
                      <span key={tag} className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold"
                        style={{ background: 'rgba(20,184,166,0.10)', border: '1px solid rgba(20,184,166,0.22)', color: '#0D9488' }}>
                        #{tag}
                        <span className="text-[10px] opacity-60">{count}</span>
                      </span>
                    ))}
                    {stats.topTags.length === 0 && (
                      <p className="text-[12px]" style={{ color: t.textFaint }}>No tag data yet</p>
                    )}
                  </div>
                </div>
              </div>
            </Section>

            {/* ═══════════════════════════════════════════════════════════════
                SECTION 5 · SHARED BOARDS
            ═══════════════════════════════════════════════════════════════ */}
            <Section title="Shared Boards" icon={Share2}>
              <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${t.cardBorder}` }}>
                <table className="w-full text-[12px]">
                  <thead>
                    <tr style={{ background: t.cardBg, borderBottom: `1px solid ${t.cardBorder}` }}>
                      {['Board', 'Owner', 'Views', 'Created'].map(h => (
                        <th key={h} className="text-left px-4 py-3 font-bold uppercase tracking-wider text-[10px]"
                          style={{ color: t.textFaint }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {stats.topSharedBoards.map((b, i) => (
                      <tr key={b.token}
                        style={{ background: i % 2 === 0 ? t.pageBg : t.cardBg, borderBottom: `1px solid ${t.cardBorder}` }}>
                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-2">
                            <Folder className="w-3.5 h-3.5 shrink-0" style={{ color: '#7C3AED' }} />
                            <span className="font-semibold truncate max-w-[140px]" style={{ color: t.textPrimary }}>{b.category}</span>
                          </div>
                        </td>
                        <td className="px-4 py-2.5 truncate max-w-[160px]" style={{ color: t.textMuted }}>{b.owner_email}</td>
                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-1.5">
                            <Eye className="w-3 h-3" style={{ color: '#3B82F6' }} />
                            <span className="font-bold" style={{ color: t.textPrimary }}>{b.view_count}</span>
                          </div>
                        </td>
                        <td className="px-4 py-2.5" style={{ color: t.textMuted }}>
                          {new Date(b.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                    {stats.topSharedBoards.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-4 py-6 text-center text-[12px]" style={{ color: t.textFaint }}>
                          No shared boards yet
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Section>

            {/* ═══════════════════════════════════════════════════════════════
                SECTION 6 · SYSTEM HEALTH
            ═══════════════════════════════════════════════════════════════ */}
            <Section title="System" icon={Globe}>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="rounded-2xl p-4" style={{ background: t.cardBg, border: `1px solid ${t.cardBorder}` }}>
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <p className="text-[11px] font-bold" style={{ color: t.textMuted }}>WEB</p>
                  </div>
                  <p className="text-[13px] font-bold" style={{ color: t.textPrimary }}>Vercel</p>
                  <p className="text-[11px]" style={{ color: t.textFaint }}>saveboard.app</p>
                </div>
                <div className="rounded-2xl p-4" style={{ background: t.cardBg, border: `1px solid ${t.cardBorder}` }}>
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <p className="text-[11px] font-bold" style={{ color: t.textMuted }}>DATABASE</p>
                  </div>
                  <p className="text-[13px] font-bold" style={{ color: t.textPrimary }}>Supabase</p>
                  <p className="text-[11px]" style={{ color: t.textFaint }}>Postgres</p>
                </div>
                <div className="rounded-2xl p-4" style={{ background: t.cardBg, border: `1px solid ${t.cardBorder}` }}>
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <p className="text-[11px] font-bold" style={{ color: t.textMuted }}>iOS</p>
                  </div>
                  <p className="text-[13px] font-bold" style={{ color: t.textPrimary }}>In Review</p>
                  <p className="text-[11px]" style={{ color: t.textFaint }}>versionCode 1</p>
                </div>
                <div className="rounded-2xl p-4" style={{ background: t.cardBg, border: `1px solid ${t.cardBorder}` }}>
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <p className="text-[11px] font-bold" style={{ color: t.textMuted }}>ANDROID</p>
                  </div>
                  <p className="text-[13px] font-bold" style={{ color: t.textPrimary }}>In Review</p>
                  <p className="text-[11px]" style={{ color: t.textFaint }}>versionCode 1</p>
                </div>
              </div>

              {/* Quick links */}
              <div className="mt-4 flex flex-wrap gap-2">
                {[
                  { label: 'Supabase Dashboard', url: 'https://supabase.com/dashboard/project/mchikdltrcbovhdzdhhf' },
                  { label: 'Stripe Dashboard',   url: 'https://dashboard.stripe.com' },
                  { label: 'Vercel Dashboard',   url: 'https://vercel.com/dashboard' },
                  { label: 'Play Console',        url: 'https://play.google.com/console' },
                  { label: 'App Store Connect',   url: 'https://appstoreconnect.apple.com' },
                ].map(({ label, url }) => (
                  <a key={label} href={url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-semibold transition-colors"
                    style={{ background: t.hoverBg, color: t.textMuted, border: `1px solid ${t.cardBorder}` }}>
                    {label} ↗
                  </a>
                ))}
              </div>
            </Section>

            {/* ═══════════════════════════════════════════════════════════════
                SEO & AI CRAWLERS
            ═══════════════════════════════════════════════════════════════ */}
            <Section title="SEO & AI 크롤러" icon={Globe}>
              <SeoPanel accessToken={accessToken} />
            </Section>

            {/* Footer */}
            <p className="text-center text-[10px] pb-8" style={{ color: t.textFaint }}>
              Data generated at {new Date(stats.generatedAt).toLocaleString()} · Admin: {userEmail}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
