import { useState, useEffect, useCallback } from 'react';
import { CheckCircle, XCircle, RefreshCw, Bot, Clock, Globe, AlertCircle, BookOpen, Smartphone, LogIn } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { supabase } from '../lib/supabase';
import type { AdminStats } from './AdminDashboard';

interface SeoCheck { id: string; label: string; pass: boolean; detail: string; }
interface SeoResult {
  score: number; passed: number; total: number;
  checks: SeoCheck[]; checkedAt: string;
}
interface BotInfo { name: string; lastSeen: string | null; count: number; }

const BOT_ICONS: Record<string, string> = {
  ChatGPT: '🤖', Claude: '🟠', Gemini: '✦', Perplexity: '🔍', 'Meta AI': '🔵', Copilot: '🪟',
};

function timeAgo(iso: string | null): string {
  if (!iso) return '—';
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return m <= 1 ? 'Just now' : `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function ScoreRing({ score }: { score: number }) {
  const r = 36; const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  const color = score >= 80 ? '#10B981' : score >= 60 ? '#F59E0B' : '#EF4444';
  return (
    <svg viewBox="0 0 88 88" className="w-20 h-20">
      <circle cx="44" cy="44" r={r} fill="none" stroke="#E5E7EB" strokeWidth="8" />
      <circle cx="44" cy="44" r={r} fill="none" stroke={color} strokeWidth="8"
        strokeDasharray={`${dash} ${circ - dash}`} strokeDashoffset={circ / 4}
        strokeLinecap="round" style={{ transition: 'stroke-dasharray 0.8s ease' }} />
      <text x="44" y="44" textAnchor="middle" dominantBaseline="central"
        style={{ fontSize: 18, fontWeight: 700, fill: color }}>{score}</text>
    </svg>
  );
}

interface Props { accessToken: string | null; stats: AdminStats | null; }

export function SeoPanel({ accessToken, stats }: Props) {
  const { t } = useTheme();
  const [seo, setSeo]       = useState<SeoResult | null>(null);
  const [bots, setBots]     = useState<BotInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true); setError(null);
    try {
      // /api/bot-stats was merged into /api/seo-check (Vercel Hobby 12-function limit).
      const seoRes = await fetch('/api/seo-check', { headers: { Authorization: `Bearer ${accessToken}` } });
      if (seoRes.ok) { const d = await seoRes.json(); setSeo(d); setBots(d.bots ?? []); }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  return (
    <div className="space-y-4">
      {error && (
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[12px]"
          style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#EF4444' }}>
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />{error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* ── SEO Score ───────────────────────────────────────────────── */}
        <div className="rounded-2xl p-5" style={{ background: t.cardBg, border: `1px solid ${t.cardBorder}` }}>
          <div className="flex items-center justify-between mb-4">
            <p className="text-[12px] font-bold" style={{ color: t.textMuted }}>SEO 체크리스트</p>
            <button onClick={fetchAll} disabled={loading}
              className="p-1 rounded-lg transition-colors" style={{ color: t.textFaint }}
              title="Refresh">
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {seo ? (
            <div className="flex items-start gap-5">
              <div className="shrink-0"><ScoreRing score={seo.score} /></div>
              <div className="flex-1 space-y-1.5 max-h-64 overflow-y-auto">
                {seo.checks.map(c => (
                  <div key={c.id} className="flex items-start gap-2">
                    {c.pass
                      ? <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                      : <XCircle    className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
                    }
                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold leading-tight" style={{ color: t.textPrimary }}>{c.label}</p>
                      <p className="text-[10px] truncate" style={{ color: t.textFaint }}>{c.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-32 animate-pulse rounded-xl" style={{ background: t.pageBg }} />
          )}

          {seo && (
            <p className="text-[10px] mt-3" style={{ color: t.textFaint }}>
              {seo.passed}/{seo.total} 통과 · {new Date(seo.checkedAt).toLocaleTimeString()} 기준
            </p>
          )}
        </div>

        {/* ── AI Crawler Activity ──────────────────────────────────────── */}
        <div className="rounded-2xl p-5" style={{ background: t.cardBg, border: `1px solid ${t.cardBorder}` }}>
          <div className="flex items-center justify-between mb-4">
            <p className="text-[12px] font-bold" style={{ color: t.textMuted }}>AI 크롤러 활동</p>
            <Globe className="w-3.5 h-3.5" style={{ color: t.textFaint }} />
          </div>

          <div className="space-y-3">
            {bots.length > 0 ? bots.map(bot => (
              <div key={bot.name} className="flex items-center gap-3">
                <span className="text-[18px] w-7 text-center">{BOT_ICONS[bot.name] ?? '🤖'}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-semibold" style={{ color: t.textPrimary }}>{bot.name}</p>
                  <div className="flex items-center gap-1">
                    <Clock className="w-2.5 h-2.5" style={{ color: t.textFaint }} />
                    <p className="text-[10px]" style={{ color: t.textFaint }}>마지막 방문: {timeAgo(bot.lastSeen)}</p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[13px] font-bold" style={{ color: bot.lastSeen ? '#10B981' : t.textFaint }}>
                    {bot.lastSeen ? '●' : '○'}
                  </p>
                  {bot.count > 0 && (
                    <p className="text-[10px]" style={{ color: t.textFaint }}>{bot.count}회</p>
                  )}
                </div>
              </div>
            )) : (
              <div className="space-y-3">
                {['ChatGPT','Claude','Gemini','Perplexity','Meta AI','Copilot'].map(name => (
                  <div key={name} className="flex items-center gap-3">
                    <span className="text-[18px] w-7 text-center">{BOT_ICONS[name]}</span>
                    <div className="flex-1">
                      <p className="text-[12px] font-semibold" style={{ color: t.textPrimary }}>{name}</p>
                      <p className="text-[10px]" style={{ color: t.textFaint }}>아직 방문 기록 없음</p>
                    </div>
                    <span className="text-[13px]" style={{ color: t.textFaint }}>○</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <p className="text-[10px] mt-4 pt-3" style={{ color: t.textFaint, borderTop: `1px solid ${t.cardBorder}` }}>
            robots.txt 방문 시 자동 기록 · 데이터가 쌓이면 표시됩니다
          </p>
        </div>
      </div>

      {/* ── Marketing inflow (reuses admin-stats already fetched by the
          parent — no second network call) ────────────────────────────── */}
      <div className="rounded-2xl p-5" style={{ background: t.cardBg, border: `1px solid ${t.cardBorder}` }}>
        <p className="text-[12px] font-bold mb-4" style={{ color: t.textMuted }}>마케팅 유입 (최근 7일)</p>
        {stats?.traffic ? (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            <InflowTile icon={Globe} label="웹사이트 방문" value={stats.traffic.visits7d} />
            <InflowTile icon={BookOpen} label="가이드 블로그 조회" value={stats.traffic.guideViews7d} />
            <InflowTile icon={Smartphone} label="App Store 클릭" value={stats.traffic.storeClicksIos7d} />
            <InflowTile icon={Smartphone} label="Google Play 클릭" value={stats.traffic.storeClicksAndroid7d} />
            <InflowTile icon={LogIn} label="로그인" value={stats.presence?.loginsWeek ?? 0} />
          </div>
        ) : (
          <div className="h-16 animate-pulse rounded-xl" style={{ background: t.pageBg }} />
        )}
        <p className="text-[10px] mt-4 pt-3" style={{ color: t.textFaint, borderTop: `1px solid ${t.cardBorder}` }}>
          스토어 클릭은 랜딩페이지 버튼 클릭 시 기록 · 가이드 조회는 /guides 하위 경로 방문 수
        </p>
      </div>
    </div>
  );
}

function InflowTile({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: number }) {
  const { t } = useTheme();
  return (
    <div>
      <Icon className="w-3.5 h-3.5 mb-1.5" style={{ color: t.textFaint }} />
      <p className="text-[20px] font-bold leading-none" style={{ color: t.textPrimary }}>{value.toLocaleString()}</p>
      <p className="text-[10px] mt-1" style={{ color: t.textFaint }}>{label}</p>
    </div>
  );
}
