import { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  Users, Link2, TrendingUp, Share2, Eye, Crown, Apple, CreditCard,
  RefreshCw, BarChart2, Tag, Folder, Calendar, ArrowUp, ArrowDown,
  Minus, Globe, Smartphone, AlertCircle, CheckCircle, XCircle, ChevronDown, Loader2, Search,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { supabase } from '../lib/supabase';
import { WorldMap } from './WorldMap';
import { SeoPanel } from './SeoPanel';
import { ReleasePanel } from './ReleasePanel';

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
    locale: string; platform: string; lastSeen: string; provider: string; country: string;
  }>;
  usersByPlatform: Record<string, number>;
  presence: { activeNow: number; activeToday: number; activeWeek: number; neverSeen: number };
  activeUsers: Array<{
    id: string; email: string; lastSeen: string;
    platform: string; country: string; online: boolean;
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
  activation?: {
    signedUp: number; everSaved: number; savedThreePlus: number; madeABoard: number;
    medianFirstSaveHours: number | null;
    neverSaved: Array<{ email: string; createdAt: string }>;
    dormant: Array<{ email: string; lastSeen: string | null; linkCount: number }>;
    excludedTestAccounts: number;
  };
  traffic?: {
    visits7d: number; visits7dPrev: number; boardClicks7d: number;
    byPath: Array<{ path: string; views: number; boardClicks: number }>;
    topReferrers: Array<{ referrer: string; n: number }>;
    topSources: Array<{ source: string; n: number }>;
  };
  automations?: Array<{
    routine: string; status: string; summary: string | null;
    artifact_url: string | null; ran_at: string;
  }>;
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
/** A number with its week-over-week move. "—" when nothing has been recorded yet. */
function WeekStat({ label, value, prev, hint }: { label: string; value: number; prev?: number; hint?: string }) {
  const { t } = useTheme();
  const hasData = value > 0 || (prev ?? 0) > 0;
  const delta = prev === undefined ? null : value - prev;
  const deltaColor = delta === null || delta === 0 ? t.textFaint : delta > 0 ? '#10B981' : '#EF4444';
  return (
    <div className="rounded-2xl p-4" style={{ background: t.cardBg, border: `1px solid ${t.cardBorder}` }}>
      <p className="text-[11px] font-bold mb-1" style={{ color: t.textMuted }}>{label}</p>
      <p className="text-[22px] font-extrabold" style={{ color: t.textPrimary }}>
        {hasData ? value : '—'}
      </p>
      <p className="text-[11px]" style={{ color: deltaColor }}>
        {!hasData ? (hint ?? '아직 데이터 없음') : delta === null ? (hint ?? '') : `${delta > 0 ? '+' : ''}${delta} vs 지난주`}
      </p>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, { bg: string; fg: string; label: string }> = {
    success: { bg: 'rgba(16,185,129,0.12)', fg: '#10B981', label: '성공' },
    partial: { bg: 'rgba(245,158,11,0.12)', fg: '#F59E0B', label: '일부' },
    failed:  { bg: 'rgba(239,68,68,0.12)',  fg: '#EF4444', label: '실패' },
  };
  const v = map[status] ?? { bg: 'rgba(148,163,184,0.12)', fg: '#94A3B8', label: status };
  return (
    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ background: v.bg, color: v.fg }}>
      {v.label}
    </span>
  );
}

function relativeTime(iso: string) {
  const diff = Date.now() - Date.parse(iso);
  const h = Math.floor(diff / 3600000);
  if (h < 1) return '방금';
  if (h < 24) return `${h}시간 전`;
  return `${Math.floor(h / 24)}일 전`;
}

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

// ── Device / locale display ────────────────────────────────────────────────
const PLATFORM_META: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  ios:     { label: 'iOS',     icon: Apple,      color: '#6B7280' },
  android: { label: 'Android', icon: Smartphone, color: '#3DDC84' },
  web:     { label: 'Web',     icon: Globe,      color: '#3B82F6' },
};

// ISO3 → flag emoji, via the ISO2 prefix of the regional-indicator block.
const ISO3_TO_ISO2: Record<string, string> = {
  AUS:'AU', USA:'US', GBR:'GB', CAN:'CA', NZL:'NZ', SGP:'SG', IND:'IN', IRL:'IE',
  KOR:'KR', JPN:'JP', CHN:'CN', TWN:'TW', HKG:'HK', FRA:'FR', DEU:'DE', ESP:'ES',
  MEX:'MX', BRA:'BR', PRT:'PT', ITA:'IT', NLD:'NL', RUS:'RU', SAU:'SA', TUR:'TR',
  VNM:'VN', THA:'TH', IDN:'ID', MYS:'MY', PHL:'PH',
};
const flagOf = (iso3: string) => {
  const iso2 = ISO3_TO_ISO2[iso3];
  if (!iso2) return '';
  return String.fromCodePoint(...[...iso2].map(c => 0x1F1E6 + c.charCodeAt(0) - 65));
};

// "3m ago" / "2h ago" / "5d ago" — short enough for a table cell.
function relTime(iso: string): string {
  const ms = Date.now() - Date.parse(iso);
  if (!Number.isFinite(ms)) return '—';
  const m = Math.floor(ms / 60000);
  if (m < 1)  return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function DeviceCell({ platform }: { platform: string }) {
  const { t } = useTheme();
  const meta = PLATFORM_META[platform];
  if (!meta) return <span className="text-[11px]" style={{ color: t.textFaint }}>—</span>;
  const Icon = meta.icon;
  return (
    <span className="flex items-center gap-1.5 text-[11px]" style={{ color: t.textMuted }}>
      <Icon className="w-3 h-3" style={{ color: meta.color }} />{meta.label}
    </span>
  );
}

// ── User table sorting ─────────────────────────────────────────────────────
type UserSortKey = 'email' | 'created_at' | 'lastSeen' | 'plan' | 'platform' | 'country' | 'linkCount' | 'boardCount';

const USER_COLUMNS: { key: UserSortKey; label: string }[] = [
  { key: 'email',      label: 'Email'    },
  { key: 'created_at', label: 'Joined'   },
  { key: 'plan',       label: 'Plan'     },
  { key: 'platform',   label: 'Device'   },
  { key: 'country',    label: 'Location' },
  { key: 'lastSeen',   label: 'Last seen' },
  { key: 'linkCount',  label: 'Links'    },
  { key: 'boardCount', label: 'Boards'   },
];

// Free < Pro < Team, so sorting by plan groups the paying users together.
const PLAN_RANK: Record<string, number> = { free: 0, pro: 1, team: 2 };

type Tab = 'overview' | 'users' | 'revenue' | 'content' | 'seo' | 'system' | 'marketing';

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'overview',  label: 'Overview',  icon: TrendingUp },
  { id: 'users',     label: 'Users',     icon: Users },
  { id: 'revenue',   label: 'Revenue',   icon: CreditCard },
  { id: 'content',   label: 'Content',   icon: Folder },
  { id: 'seo',       label: 'SEO',       icon: Globe },
  { id: 'system',    label: 'System',    icon: CheckCircle },
  { id: 'marketing', label: 'Marketing', icon: Smartphone },
];

export function AdminDashboard({ onClose, userEmail }: { onClose: () => void; userEmail: string }) {
  const { t } = useTheme();
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [planOverrides, setPlanOverrides] = useState<Record<string, PlanKey>>({});
  const [planError, setPlanError] = useState<string | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  // Round-trip time of the stats call, which is dominated by the database.
  // The free-tier instance degrades quietly (2026-08-02: a 65-row query took
  // 14s), so surfacing this makes the next episode visible before it is felt.
  const [apiMs, setApiMs] = useState<number | null>(null);
  const [userQuery, setUserQuery] = useState('');
  const [userSort, setUserSort] = useState<{ key: UserSortKey; dir: 'asc' | 'desc' }>({ key: 'created_at', dir: 'desc' });

  // `silent` skips the spinner so background polling doesn't flicker the UI.
  const fetchStats = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');
      setAccessToken(session.access_token);
      const startedAt = performance.now();
      const res = await fetch('/api/admin-stats', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      setApiMs(Math.round(performance.now() - startedAt));
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setStats(data);
      setLastRefresh(new Date());
    } catch (e: any) {
      setError(e.message ?? 'Failed to load stats');
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  // "Signed in now" and the relative times go stale on a static page, so poll
  // while the Users tab is open and visible. Other tabs stay manual-refresh.
  useEffect(() => {
    if (activeTab !== 'users') return;
    const id = setInterval(() => {
      if (document.visibilityState === 'visible') fetchStats(true);
    }, 60_000);
    return () => clearInterval(id);
  }, [activeTab, fetchStats]);

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

  // "확인할 것" — built only from data already on this page, so it can never
  // claim something needs attention that the dashboard cannot show.
  const todo: Array<{ text: string; tab: Tab }> = [];
  const failedRuns = (stats?.automations ?? []).filter(a => a.status !== 'success');
  if (failedRuns.length) {
    todo.push({ text: `루틴 ${failedRuns.length}건이 성공하지 못했어요 (${failedRuns[0].routine})`, tab: 'marketing' });
  }
  const emptyBoards = (stats?.topSharedBoards ?? []).filter(b => b.view_count === 0);
  if (emptyBoards.length) {
    todo.push({ text: `공유 보드 ${emptyBoards.length}개가 아직 조회 0회예요`, tab: 'content' });
  }
  if (stats?.traffic && stats.traffic.visits7d > 0 && stats.traffic.boardClicks7d === 0) {
    todo.push({ text: '방문은 있는데 보드 클릭이 0이에요 — CTA 점검', tab: 'marketing' });
  }

  // Plan overrides are applied before filtering so a just-changed plan sorts/filters correctly.
  const effectivePlanOf = useCallback((u: { id: string; plan: string }) => {
    const o = planOverrides[u.id];
    if (!o) return u.plan;
    return o === 'free' ? 'free' : o === 'team' ? 'team' : 'pro';
  }, [planOverrides]);

  const visibleUsers = (() => {
    const q = userQuery.trim().toLowerCase();
    const rows = (stats?.recentUsers ?? []).filter(u =>
      !q || u.email.toLowerCase().includes(q) || effectivePlanOf(u).includes(q)
        || (u.platform ?? '').includes(q) || (u.country ?? '').toLowerCase().includes(q)
        || (u.locale ?? '').toLowerCase().includes(q));
    const dir = userSort.dir === 'asc' ? 1 : -1;
    return [...rows].sort((a, b) => {
      switch (userSort.key) {
        case 'email':      return a.email.localeCompare(b.email) * dir;
        case 'created_at': return (Date.parse(a.created_at) - Date.parse(b.created_at)) * dir;
        case 'plan':       return ((PLAN_RANK[effectivePlanOf(a)] ?? 0) - (PLAN_RANK[effectivePlanOf(b)] ?? 0)) * dir;
        case 'platform':   return (a.platform ?? '').localeCompare(b.platform ?? '') * dir;
        case 'country':    return (a.country ?? '').localeCompare(b.country ?? '') * dir;
        // Never-seen accounts sort to the bottom rather than pretending to be oldest.
        case 'lastSeen':   return ((Date.parse(a.lastSeen ?? '') || 0) - (Date.parse(b.lastSeen ?? '') || 0)) * dir;
        case 'linkCount':  return (a.linkCount - b.linkCount) * dir;
        case 'boardCount': return (a.boardCount - b.boardCount) * dir;
      }
    });
  })();

  const toggleSort = (key: UserSortKey) =>
    setUserSort(s => s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' }
                                   : { key, dir: key === 'email' ? 'asc' : 'desc' });

  return (
    <div className="fixed inset-0 z-[500] flex flex-col" style={{ background: t.pageBg }}>

      {/* ── Top bar ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-6 py-3 shrink-0"
        style={{ background: t.cardBg, borderBottom: `1px solid ${t.cardBorder}` }}>
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg,#7C3AED,#6366F1)' }}>
            <BarChart2 className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-[14px] font-bold" style={{ color: t.textPrimary }}>SaveBoard Admin</span>
          {lastRefresh && <span className="text-[10px]" style={{ color: t.textFaint }}>· {lastRefresh.toLocaleTimeString()}</span>}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => fetchStats()} disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold"
            style={{ background: t.hoverBg, color: t.textMuted }}>
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button onClick={onClose}
            className="px-3 py-1.5 rounded-lg text-[12px] font-semibold text-white"
            style={{ background: 'linear-gradient(135deg,#7C3AED,#6366F1)' }}>
            ← Back
          </button>
        </div>
      </div>

      {/* ── Tab bar ─────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-1 px-6 py-2 shrink-0 overflow-x-auto"
        style={{ background: t.cardBg, borderBottom: `1px solid ${t.cardBorder}` }}>
        {TABS.map(tab => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold whitespace-nowrap transition-all"
              style={{
                background: active ? 'rgba(124,58,237,0.10)' : 'transparent',
                color: active ? '#7C3AED' : t.textMuted,
                border: active ? '1px solid rgba(124,58,237,0.20)' : '1px solid transparent',
              }}>
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ── Content ─────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto px-6 py-6 space-y-6">

          {error && (
            <div className="flex items-center gap-3 px-4 py-3 rounded-2xl"
              style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <p className="text-[13px] text-red-400">{error}</p>
            </div>
          )}

          {loading && !stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-28 rounded-2xl animate-pulse" style={{ background: t.cardBg }} />
              ))}
            </div>
          )}

          {stats && (
            <>
              {/* OVERVIEW */}
              {activeTab === 'overview' && (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <WeekStat label="이번 주 가입" value={stats.overview.newThisWeek} />
                    <WeekStat label="이번 주 저장" value={stats.overview.linksThisWeek} />
                    <WeekStat label="방문 (7일)" value={stats.traffic?.visits7d ?? 0} prev={stats.traffic?.visits7dPrev} />
                    <WeekStat label="보드 클릭 (7일)" value={stats.traffic?.boardClicks7d ?? 0}
                      hint={stats.traffic && stats.traffic.visits7d > 0
                        ? `방문의 ${Math.round((stats.traffic.boardClicks7d / stats.traffic.visits7d) * 100)}%`
                        : undefined} />
                  </div>

                  {todo.length > 0 ? (
                    <Section title="확인할 것" icon={CheckCircle}>
                      <div className="flex flex-col gap-2">
                        {todo.map((item, i) => (
                          <div key={i} className="flex items-center justify-between gap-3 rounded-xl px-3 py-2"
                            style={{ background: t.hoverBg, border: `1px solid ${t.cardBorder}` }}>
                            <p className="text-[12px]" style={{ color: t.textPrimary }}>{item.text}</p>
                            <button onClick={() => setActiveTab(item.tab)}
                              className="text-[11px] font-semibold shrink-0" style={{ color: '#7C3AED' }}>
                              보기 →
                            </button>
                          </div>
                        ))}
                      </div>
                    </Section>
                  ) : (
                    <div className="rounded-2xl px-4 py-3" style={{ background: t.cardBg, border: `1px solid ${t.cardBorder}` }}>
                      <p className="text-[12px]" style={{ color: t.textMuted }}>확인할 것 없음 ✓</p>
                    </div>
                  )}

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
                  <div className="rounded-2xl p-5" style={{ background: t.cardBg, border: `1px solid ${t.cardBorder}` }}>
                    <p className="text-[12px] font-bold mb-4" style={{ color: t.textMuted }}>LINKS SAVED — LAST 30 DAYS</p>
                    <div className="flex items-end gap-[3px] h-32">
                      {stats.linksOverTime.map((d, i) => {
                        const max = Math.max(...stats.linksOverTime.map(x => x.count), 1);
                        const pct = Math.max(2, (d.count / max) * 100);
                        return (
                          <div key={i} className="flex-1 flex h-full flex-col items-center justify-end group relative">
                            <div className="absolute -top-6 left-1/2 -translate-x-1/2 hidden group-hover:block z-10 whitespace-nowrap px-1.5 py-0.5 rounded text-[9px] font-semibold"
                              style={{ background: '#7C3AED', color: '#fff' }}>
                              {d.date.slice(5)} · {d.count}
                            </div>
                            <div className="w-full rounded-t-sm"
                              style={{ height: `${pct}%`, background: `linear-gradient(to top,#7C3AED,#A78BFA)`, opacity: 0.7 + (i / 30) * 0.3 }} />
                          </div>
                        );
                      })}
                    </div>
                    <div className="flex justify-between mt-2">
                      <p className="text-[10px]" style={{ color: t.textFaint }}>{stats.linksOverTime[0]?.date}</p>
                      <p className="text-[10px]" style={{ color: t.textFaint }}>{stats.linksOverTime[stats.linksOverTime.length - 1]?.date}</p>
                    </div>
                  </div>
                </>
              )}

              {/* USERS */}
              {activeTab === 'users' && (
                <>
                  {stats.activation && (
                    <Section title="가입한 사람 중 실제로 쓰는 사람" icon={TrendingUp}>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {[
                          { label: '가입', n: stats.activation.signedUp },
                          { label: '1개 이상 저장', n: stats.activation.everSaved },
                          { label: '3개 이상 저장', n: stats.activation.savedThreePlus },
                          { label: '보드 만듦', n: stats.activation.madeABoard },
                        ].map(({ label, n }, i, arr) => {
                          const pct = arr[0].n > 0 ? Math.round((n / arr[0].n) * 100) : 0;
                          return (
                            <div key={label} className="rounded-xl p-3" style={{ background: t.hoverBg, border: `1px solid ${t.cardBorder}` }}>
                              <p className="text-[11px] font-bold mb-1" style={{ color: t.textMuted }}>{label}</p>
                              <p className="text-[20px] font-extrabold" style={{ color: t.textPrimary }}>{n}</p>
                              <div className="h-1 rounded-full mt-2" style={{ background: t.cardBorder }}>
                                <div className="h-1 rounded-full" style={{ width: `${pct}%`, background: i === 0 ? '#7C3AED' : pct >= 50 ? '#10B981' : '#F59E0B' }} />
                              </div>
                              <p className="text-[10px] mt-1" style={{ color: t.textFaint }}>{i === 0 ? '테스트 계정 제외' : `${pct}%`}</p>
                            </div>
                          );
                        })}
                      </div>
                      <p className="text-[11px] mt-3" style={{ color: t.textMuted }}>
                        {stats.activation.medianFirstSaveHours !== null
                          ? `가입 후 첫 저장까지 중앙값 ${stats.activation.medianFirstSaveHours < 1
                              ? `${Math.round(stats.activation.medianFirstSaveHours * 60)}분`
                              : `${stats.activation.medianFirstSaveHours}시간`}`
                          : '아직 첫 저장 기록 없음'}
                        {stats.activation.excludedTestAccounts > 0 && ` · 테스트 계정 ${stats.activation.excludedTestAccounts}개 제외`}
                      </p>
                    </Section>
                  )}

                  {stats.activation && (stats.activation.neverSaved.length > 0 || stats.activation.dormant.length > 0) && (
                    <div className="grid md:grid-cols-2 gap-4">
                      <Section title="가입만 하고 안 쓴 사람" icon={AlertCircle}>
                        {stats.activation.neverSaved.length === 0 ? (
                          <p className="text-[12px]" style={{ color: t.textMuted }}>없음 ✓</p>
                        ) : (
                          <div className="flex flex-col gap-1">
                            {stats.activation.neverSaved.map(u => (
                              <div key={u.email} className="flex items-center justify-between gap-2 py-1 border-b" style={{ borderColor: t.cardBorder }}>
                                <p className="text-[12px] truncate" style={{ color: t.textPrimary }}>{u.email}</p>
                                <p className="text-[11px] shrink-0" style={{ color: t.textFaint }}>{u.createdAt.slice(0, 10)} 가입</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </Section>

                      <Section title="쓰다가 끊긴 사람 (2주+)" icon={XCircle}>
                        {stats.activation.dormant.length === 0 ? (
                          <p className="text-[12px]" style={{ color: t.textMuted }}>없음 ✓</p>
                        ) : (
                          <div className="flex flex-col gap-1">
                            {stats.activation.dormant.map(u => (
                              <div key={u.email} className="flex items-center justify-between gap-2 py-1 border-b" style={{ borderColor: t.cardBorder }}>
                                <p className="text-[12px] truncate" style={{ color: t.textPrimary }}>{u.email}</p>
                                <p className="text-[11px] shrink-0" style={{ color: t.textFaint }}>
                                  링크 {u.linkCount} · {u.lastSeen ? u.lastSeen.slice(0, 10) : '기록 없음'}
                                </p>
                              </div>
                            ))}
                          </div>
                        )}
                      </Section>
                    </div>
                  )}
                </>
              )}

              {activeTab === 'users' && (
                <>
                  {/* Who is signed in right now */}
                  <div className="rounded-2xl p-5" style={{ background: t.cardBg, border: `1px solid ${t.cardBorder}` }}>
                    <div className="flex items-center gap-2 mb-4">
                      <span className="relative flex w-2 h-2">
                        {(stats.presence?.activeNow ?? 0) > 0 && (
                          <span className="absolute inline-flex w-full h-full rounded-full animate-ping"
                            style={{ background: '#10B981', opacity: 0.6 }} />
                        )}
                        <span className="relative inline-flex w-2 h-2 rounded-full"
                          style={{ background: (stats.presence?.activeNow ?? 0) > 0 ? '#10B981' : t.textFaint }} />
                      </span>
                      <p className="text-[12px] font-bold uppercase tracking-wider" style={{ color: t.textMuted }}>
                        Signed in now
                      </p>
                      <span className="text-[11px] ml-auto" style={{ color: t.textFaint }}>active in the last 15 min</span>
                    </div>

                    <div className="flex items-baseline gap-6 mb-4 flex-wrap">
                      <div>
                        <p className="text-[32px] font-bold leading-none" style={{ color: t.textPrimary }}>
                          {stats.presence?.activeNow ?? 0}
                        </p>
                        <p className="text-[11px] mt-1" style={{ color: t.textFaint }}>right now</p>
                      </div>
                      {[{ n: stats.presence?.activeToday ?? 0, l: 'today' },
                        { n: stats.presence?.activeWeek  ?? 0, l: 'this week' },
                        { n: stats.presence?.neverSeen   ?? 0, l: 'never recorded' }].map(({ n, l }) => (
                        <div key={l}>
                          <p className="text-[18px] font-bold leading-none" style={{ color: t.textMuted }}>{n}</p>
                          <p className="text-[11px] mt-1" style={{ color: t.textFaint }}>{l}</p>
                        </div>
                      ))}
                    </div>

                    {(stats.activeUsers ?? []).length > 0 ? (
                      <div className="flex flex-col gap-1.5 max-h-64 overflow-y-auto">
                        {stats.activeUsers.map(u => (
                          <div key={u.id} className="flex items-center gap-3 px-3 py-2 rounded-xl"
                            style={{ background: u.online ? 'rgba(16,185,129,0.07)' : t.pageBg }}>
                            <span className="w-1.5 h-1.5 rounded-full shrink-0"
                              style={{ background: u.online ? '#10B981' : t.textFaint }} />
                            <span className="text-[12px] font-medium truncate flex-1" style={{ color: t.textPrimary }}>
                              {u.email}
                            </span>
                            <DeviceCell platform={u.platform} />
                            {u.country && (
                              <span className="text-[11px] shrink-0" style={{ color: t.textMuted }}>
                                {flagOf(u.country)} {u.country}
                              </span>
                            )}
                            <span className="text-[11px] w-16 text-right shrink-0"
                              style={{ color: u.online ? '#10B981' : t.textFaint }}>
                              {relTime(u.lastSeen)}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[12px]" style={{ color: t.textFaint }}>
                        No sessions recorded yet — this fills in as users open the app on a build that includes the heartbeat.
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {(['ios', 'android', 'web', 'unknown'] as const).map(p => {
                      const meta = PLATFORM_META[p];
                      const Icon = meta?.icon ?? AlertCircle;
                      const count = stats.usersByPlatform?.[p] ?? 0;
                      const pct = totalUsers > 0 ? Math.round((count / totalUsers) * 100) : 0;
                      return (
                        <div key={p} className="rounded-2xl p-4" style={{ background: t.cardBg, border: `1px solid ${t.cardBorder}` }}>
                          <div className="flex items-center gap-2 mb-2">
                            <Icon className="w-4 h-4" style={{ color: meta?.color ?? t.textFaint }} />
                            <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: t.textMuted }}>
                              {meta?.label ?? 'Not recorded'}
                            </p>
                          </div>
                          <p className="text-[22px] font-bold leading-none" style={{ color: t.textPrimary }}>{count}</p>
                          <p className="text-[11px] mt-1" style={{ color: t.textFaint }}>{pct}% of users</p>
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-[11px] -mt-2" style={{ color: t.textFaint }}>
                    Device and location are recorded when a user signs in, so “Not recorded” clears as existing users return.
                  </p>

                  <WorldMap usersByCountry={stats.usersByCountry} unknownLocationCount={stats.unknownLocationCount} />
                  <div>
                    {planError && (
                      <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl mb-3 text-[12px]"
                        style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#EF4444' }}>
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />Plan update failed: {planError}
                      </div>
                    )}
                    <div className="flex items-center gap-3 mb-3">
                      <div className="relative flex-1 max-w-xs">
                        <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: t.textFaint }} />
                        <input value={userQuery} onChange={e => setUserQuery(e.target.value)}
                          placeholder="Search email or plan…"
                          className="w-full pl-9 pr-3 py-2 rounded-xl text-[12px] outline-none"
                          style={{ background: t.cardBg, border: `1px solid ${t.cardBorder}`, color: t.textPrimary }} />
                      </div>
                      <span className="text-[11px]" style={{ color: t.textFaint }}>
                        {visibleUsers.length} of {stats.recentUsers.length}
                      </span>
                    </div>
                    <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${t.cardBorder}` }}>
                      <table className="w-full text-[12px]">
                        <thead>
                          <tr style={{ background: t.cardBg, borderBottom: `1px solid ${t.cardBorder}` }}>
                            {USER_COLUMNS.map(({ key, label }) => (
                              <th key={key} onClick={() => toggleSort(key)}
                                className="text-left px-4 py-3 font-bold uppercase tracking-wider text-[10px] cursor-pointer select-none"
                                style={{ color: userSort.key === key ? '#7C3AED' : t.textFaint }}>
                                <span className="inline-flex items-center gap-1">
                                  {label}
                                  {userSort.key === key
                                    ? (userSort.dir === 'asc' ? <ArrowUp className="w-2.5 h-2.5" /> : <ArrowDown className="w-2.5 h-2.5" />)
                                    : <Minus className="w-2.5 h-2.5 opacity-25" />}
                                </span>
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {visibleUsers.map((u, i) => {
                            const effectivePlan = effectivePlanOf(u);
                            const effectiveSource = planOverrides[u.id] ? 'admin' : u.source;
                            return (
                              <tr key={u.id} style={{ background: i % 2 === 0 ? t.pageBg : t.cardBg, borderBottom: `1px solid ${t.cardBorder}` }}>
                                <td className="px-4 py-2.5 font-medium truncate max-w-[200px]" style={{ color: t.textPrimary }}>{u.email}</td>
                                <td className="px-4 py-2.5" style={{ color: t.textMuted }}>{new Date(u.created_at).toLocaleDateString()}</td>
                                <td className="px-4 py-2.5">
                                  <PlanSelector userId={u.id} plan={effectivePlan} source={effectiveSource} onUpdate={updatePlan} />
                                </td>
                                <td className="px-4 py-2.5"><DeviceCell platform={u.platform} /></td>
                                <td className="px-4 py-2.5" style={{ color: t.textMuted }}>
                                  {u.country
                                    ? <span title={u.locale}>{flagOf(u.country)} {u.country}</span>
                                    : <span style={{ color: t.textFaint }}>—</span>}
                                </td>
                                <td className="px-4 py-2.5">
                                  {(() => {
                                    const online = Date.now() - Date.parse(u.lastSeen ?? '') <= 15 * 60 * 1000;
                                    return (
                                      <span className="flex items-center gap-1.5 text-[11px]"
                                        style={{ color: online ? '#10B981' : t.textMuted }}>
                                        {online && <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#10B981' }} />}
                                        {relTime(u.lastSeen)}
                                      </span>
                                    );
                                  })()}
                                </td>
                                <td className="px-4 py-2.5 font-bold" style={{ color: t.textPrimary }}>{u.linkCount}</td>
                                <td className="px-4 py-2.5 font-bold" style={{ color: t.textPrimary }}>{u.boardCount}</td>
                              </tr>
                            );
                          })}
                          {visibleUsers.length === 0 && (
                            <tr><td colSpan={USER_COLUMNS.length} className="px-4 py-6 text-center text-[12px]" style={{ color: t.textFaint }}>
                              No users match “{userQuery}”
                            </td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}

              {/* REVENUE */}
              {activeTab === 'revenue' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="rounded-2xl p-5" style={{ background: t.cardBg, border: `1px solid ${t.cardBorder}` }}>
                    <p className="text-[12px] font-bold mb-4" style={{ color: t.textMuted }}>PLAN BREAKDOWN</p>
                    <div className="flex items-center gap-4">
                      <DonutRing segments={[
                        { value: stats.subscriptions.freeCount, color: '#E5E7EB', label: 'Free' },
                        { value: stats.subscriptions.proCount,  color: '#7C3AED', label: 'Pro' },
                        { value: stats.subscriptions.teamCount, color: '#0891B2', label: 'Team' },
                      ]} />
                      <div className="space-y-2 text-[12px]">
                        {[{ label: 'Free', value: stats.subscriptions.freeCount, color: '#9CA3AF' },
                          { label: 'Pro',  value: stats.subscriptions.proCount,  color: '#7C3AED' },
                          { label: 'Team', value: stats.subscriptions.teamCount, color: '#0891B2' }].map(({ label, value, color }) => (
                          <div key={label} className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
                            <span style={{ color: t.textPrimary }}>{label}</span>
                            <span className="font-bold ml-auto" style={{ color: t.textPrimary }}>{value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="rounded-2xl p-5" style={{ background: t.cardBg, border: `1px solid ${t.cardBorder}` }}>
                    <p className="text-[12px] font-bold mb-4" style={{ color: t.textMuted }}>BILLING CYCLE (PRO)</p>
                    <div className="space-y-3">
                      <BarRow label="Monthly" value={stats.subscriptions.monthlyPro} max={stats.subscriptions.proCount || 1} color="#7C3AED" />
                      <BarRow label="Yearly"  value={stats.subscriptions.yearlyPro}  max={stats.subscriptions.proCount || 1} color="#A78BFA" />
                    </div>
                    <div className="mt-4 pt-4 flex items-center gap-2" style={{ borderTop: `1px solid ${t.cardBorder}` }}>
                      <XCircle className="w-3.5 h-3.5 text-red-400" />
                      <span className="text-[12px]" style={{ color: t.textMuted }}>{stats.subscriptions.cancelledCount} cancelled</span>
                    </div>
                  </div>
                  <div className="rounded-2xl p-5" style={{ background: t.cardBg, border: `1px solid ${t.cardBorder}` }}>
                    <p className="text-[12px] font-bold mb-4" style={{ color: t.textMuted }}>BILLING PLATFORM</p>
                    <div className="space-y-4">
                      {[{ icon: CreditCard, count: stats.subscriptions.stripeCount, label: 'Stripe (web + Android)', color: '#6366F1', bg: 'rgba(99,102,241,0.12)' },
                        { icon: Apple,      count: stats.subscriptions.appleCount,  label: 'Apple IAP (iOS)',       color: t.textPrimary, bg: 'rgba(0,0,0,0.06)' }].map(({ icon: Icon, count, label, color, bg }) => (
                        <div key={label} className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: bg }}>
                            <Icon className="w-4 h-4" style={{ color }} />
                          </div>
                          <div>
                            <p className="text-[13px] font-bold" style={{ color: t.textPrimary }}>{count}</p>
                            <p className="text-[11px]" style={{ color: t.textMuted }}>{label}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* CONTENT */}
              {activeTab === 'content' && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="rounded-2xl p-5" style={{ background: t.cardBg, border: `1px solid ${t.cardBorder}` }}>
                      <p className="text-[12px] font-bold mb-4" style={{ color: t.textMuted }}>TOP BOARDS</p>
                      <div className="space-y-2.5">
                        {stats.topCategories.slice(0, 8).map(({ category, count }) => (
                          <BarRow key={category} label={category} value={count} max={stats.topCategories[0]?.count ?? 1} color="#10B981" />
                        ))}
                        {stats.topCategories.length === 0 && <p className="text-[12px]" style={{ color: t.textFaint }}>No board data yet</p>}
                      </div>
                    </div>
                    <div className="rounded-2xl p-5" style={{ background: t.cardBg, border: `1px solid ${t.cardBorder}` }}>
                      <p className="text-[12px] font-bold mb-4" style={{ color: t.textMuted }}>TOP TAGS</p>
                      <div className="flex flex-wrap gap-2">
                        {stats.topTags.map(({ tag, count }) => (
                          <span key={tag} className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold"
                            style={{ background: 'rgba(20,184,166,0.10)', border: '1px solid rgba(20,184,166,0.22)', color: '#0D9488' }}>
                            #{tag}<span className="text-[10px] opacity-60">{count}</span>
                          </span>
                        ))}
                        {stats.topTags.length === 0 && <p className="text-[12px]" style={{ color: t.textFaint }}>No tag data yet</p>}
                      </div>
                    </div>
                  </div>
                  <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${t.cardBorder}` }}>
                    <p className="text-[12px] font-bold px-4 pt-4 pb-2" style={{ color: t.textMuted }}>SHARED BOARDS</p>
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
                          <tr key={b.token} style={{ background: i % 2 === 0 ? t.pageBg : t.cardBg, borderBottom: `1px solid ${t.cardBorder}` }}>
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
                            <td className="px-4 py-2.5" style={{ color: t.textMuted }}>{new Date(b.created_at).toLocaleDateString()}</td>
                          </tr>
                        ))}
                        {stats.topSharedBoards.length === 0 && (
                          <tr><td colSpan={4} className="px-4 py-6 text-center text-[12px]" style={{ color: t.textFaint }}>No shared boards yet</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </>
              )}

              {/* SEO */}
              {activeTab === 'seo' && <SeoPanel accessToken={accessToken} />}

              {/* SYSTEM */}
              {activeTab === 'system' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    {[{ label: 'WEB', name: 'Vercel', detail: 'saveboard.app' },
                      { label: 'DATABASE', name: 'Supabase',
                        detail: apiMs === null ? 'Postgres'
                          : `Postgres · 응답 ${(apiMs / 1000).toFixed(1)}초${apiMs > 3000 ? ' — 느림' : ''}` }].map(({ label, name, detail }) => (
                      <div key={label} className="rounded-2xl p-4" style={{ background: t.cardBg, border: `1px solid ${t.cardBorder}` }}>
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle className="w-4 h-4 text-green-400" />
                          <p className="text-[11px] font-bold" style={{ color: t.textMuted }}>{label}</p>
                        </div>
                        <p className="text-[13px] font-bold" style={{ color: t.textPrimary }}>{name}</p>
                        <p className="text-[11px]" style={{
                          color: label === 'DATABASE' && apiMs !== null && apiMs > 3000 ? '#EF4444' : t.textFaint,
                        }}>{detail}</p>
                      </div>
                    ))}
                  </div>

                  <Section title="App releases" icon={Smartphone}>
                    <ReleasePanel accessToken={accessToken} />
                  </Section>

                  <div className="flex flex-wrap gap-2">
                    {[{ label: 'Supabase', url: 'https://supabase.com/dashboard/project/mchikdltrcbovhdzdhhf' },
                      { label: 'Stripe',   url: 'https://dashboard.stripe.com' },
                      { label: 'Vercel',   url: 'https://vercel.com/dashboard' },
                      { label: 'Play Console', url: 'https://play.google.com/console' },
                      { label: 'App Store Connect', url: 'https://appstoreconnect.apple.com' }].map(({ label, url }) => (
                      <a key={label} href={url} target="_blank" rel="noopener noreferrer"
                        className="px-3 py-1.5 rounded-xl text-[11px] font-semibold"
                        style={{ background: t.hoverBg, color: t.textMuted, border: `1px solid ${t.cardBorder}` }}>
                        {label} ↗
                      </a>
                    ))}
                  </div>
                </>
              )}

              {/* MARKETING */}
              {activeTab === 'marketing' && (
                <>
                  <Section title="페이지별 유입 (7일)" icon={TrendingUp}>
                    {(stats.traffic?.byPath.length ?? 0) === 0 ? (
                      <p className="text-[12px]" style={{ color: t.textMuted }}>
                        아직 기록된 방문이 없어요. 방문이 생기면 여기에 경로별로 쌓입니다.
                      </p>
                    ) : (
                      <div className="flex flex-col gap-1">
                        {stats.traffic!.byPath.map(row => (
                          <div key={row.path} className="flex items-center justify-between gap-3 py-1.5 border-b"
                            style={{ borderColor: t.cardBorder }}>
                            <p className="text-[12px] truncate" style={{ color: t.textPrimary }}>{row.path}</p>
                            <div className="flex items-center gap-4 shrink-0">
                              <span className="text-[12px] font-bold" style={{ color: t.textPrimary }}>{row.views}</span>
                              <span className="text-[11px]" style={{ color: row.boardClicks > 0 ? '#10B981' : t.textFaint }}>
                                보드 {row.boardClicks}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </Section>

                  <Section title="유입 경로" icon={Globe}>
                    {(stats.traffic?.topSources.length ?? 0) === 0 && (stats.traffic?.topReferrers.length ?? 0) === 0 ? (
                      <p className="text-[12px]" style={{ color: t.textMuted }}>아직 외부 유입 기록 없음</p>
                    ) : (
                      <div className="flex flex-col gap-2">
                        {stats.traffic!.topSources.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {stats.traffic!.topSources.map(s => (
                              <span key={s.source} className="px-3 py-1.5 rounded-xl text-[11px] font-semibold"
                                style={{ background: t.hoverBg, color: t.textPrimary, border: `1px solid ${t.cardBorder}` }}>
                                {s.source} · {s.n}
                              </span>
                            ))}
                          </div>
                        )}
                        {stats.traffic!.topReferrers.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {stats.traffic!.topReferrers.map(r => (
                              <span key={r.referrer} className="px-3 py-1.5 rounded-xl text-[11px] font-semibold"
                                style={{ background: t.hoverBg, color: t.textMuted, border: `1px solid ${t.cardBorder}` }}>
                                {r.referrer} · {r.n}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </Section>

                  <Section title="자동으로 도는 것" icon={CheckCircle}>
                    {(stats.automations?.length ?? 0) === 0 ? (
                      <p className="text-[12px]" style={{ color: t.textMuted }}>
                        아직 실행 기록이 없어요. 루틴이 돌면 여기에 남습니다 (첫 주간 가이드 루틴: 매주 수요일).
                      </p>
                    ) : (
                      <div className="flex flex-col gap-2">
                        {stats.automations!.map((a, i) => (
                          <div key={i} className="flex items-center justify-between gap-3 rounded-xl px-3 py-2"
                            style={{ background: t.hoverBg, border: `1px solid ${t.cardBorder}` }}>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="text-[12px] font-bold truncate" style={{ color: t.textPrimary }}>{a.routine}</p>
                                <StatusPill status={a.status} />
                              </div>
                              <p className="text-[11px] truncate" style={{ color: t.textMuted }}>
                                {relativeTime(a.ran_at)} · {a.summary ?? '—'}
                              </p>
                            </div>
                            {a.artifact_url && (
                              <a href={a.artifact_url} target="_blank" rel="noopener noreferrer"
                                className="text-[11px] font-semibold shrink-0" style={{ color: '#7C3AED' }}>열기 ↗</a>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    <a href="https://claude.ai/code/routines" target="_blank" rel="noopener noreferrer"
                      className="inline-block mt-3 text-[11px] font-semibold" style={{ color: '#7C3AED' }}>
                      루틴 설정 열기 ↗
                    </a>
                  </Section>
                </>
              )}

              <p className="text-center text-[10px] pb-4" style={{ color: t.textFaint }}>
                {stats.generatedAt ? `Data from ${new Date(stats.generatedAt).toLocaleString()} · ` : ''}{userEmail}
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
