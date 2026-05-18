import { useMemo, useState } from 'react';
import { Bookmark, Clock, Heart, Inbox, ArrowRight, Zap, Link2, Check, Share2 } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import type { LinkData } from './LinkCard';
import { isPlaceholder, PlatformPlaceholder, detectPlatformFromUrl } from './PlatformPlaceholder';

const PALETTE = ['#8B5CF6','#6366F1','#3B82F6','#0EA5E9','#10B981','#F59E0B','#EF4444','#EC4899'];
function dotColor(n: string) { return PALETTE[[...n].reduce((a,c) => a+c.charCodeAt(0),0) % PALETTE.length]; }
function hexToRgb(hex: string) {
  const r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);
  return `${r},${g},${b}`;
}
function domain(url: string) { try { return new URL(url).hostname.replace('www.',''); } catch { return ''; } }

interface SharedBoard { token: string; category: string; synced_at: string | null; count: number; views: number; viewers: { email: string | null; viewed_at: string }[]; }

interface HomePageProps {
  links: LinkData[];
  categories: string[];
  favorites: Set<string>;
  userEmail?: string;
  sharedBoards?: SharedBoard[];
  onSelect: (id: string) => void;
}

export function HomePage({ links, categories, favorites, userEmail, sharedBoards = [], onSelect }: HomePageProps) {
  const { t } = useTheme();
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  const copyShareLink = async (token: string) => {
    await navigator.clipboard.writeText(`${window.location.origin}/share/${token}`);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const now = Date.now();
  const weekMs = 7 * 24 * 60 * 60 * 1000;
  const thisWeek = links.filter(l => now - l.savedAt.getTime() < weekMs).length;
  const unsorted = links.filter(l => !l.category || l.category === 'None').length;
  const recent = useMemo(() => [...links].sort((a,b) => b.savedAt.getTime() - a.savedAt.getTime()).slice(0,8), [links]);

  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  }, []);

  const name = userEmail?.split('@')[0] ?? '';

  return (
    <div className="space-y-8 pb-4">

      {/* ── Greeting ─────────────────────────────────────────────────── */}
      <div>
        <p className="text-[13px] font-medium mb-0.5" style={{ color: t.textMuted }}>{greeting}{name ? `, ${name}` : ''}!</p>
        <h1 className="text-[24px] font-bold leading-tight" style={{ color: t.textPrimary }}>Your SaveBoard</h1>
      </div>

      {/* ── Recently Saved ───────────────────────────────────────────── */}
      {recent.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: t.navSectionLabel }}>Recently Saved</p>
            <button onClick={() => onSelect('recent')}
              className="flex items-center gap-1 text-[12px] font-medium transition-opacity hover:opacity-70"
              style={{ color: '#7C3AED' }}>
              View all <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
          {/* Horizontal scroll row */}
          <div className="flex gap-3 overflow-x-auto pb-1 -mx-4 px-4 sm:-mx-6 sm:px-6"
            style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' } as React.CSSProperties}>
            {recent.map(l => (
              <a key={l.id} href={l.url} target="_blank" rel="noopener noreferrer"
                className="flex-none w-[148px] rounded-2xl overflow-hidden transition-all hover:-translate-y-0.5"
                style={{ background: t.cardBg, border: `1px solid ${t.cardBorder}` }}>
                {/* Fixed-height image */}
                <div className="w-full h-[88px] overflow-hidden">
                  {l.image && !isPlaceholder(l.image) ? (
                    <img src={l.image} alt={l.title} className="w-full h-full object-cover"
                      onError={e => { e.currentTarget.style.display = 'none'; }} />
                  ) : (
                    <PlatformPlaceholder
                      platform={isPlaceholder(l.image) ? (l.image.replace('placeholder:', '') as any) : detectPlatformFromUrl(l.url)}
                      className="w-full h-full"
                    />
                  )}
                </div>
                {/* Content */}
                <div className="p-2.5">
                  <p className="text-[12px] font-semibold line-clamp-2 leading-snug mb-1.5" style={{ color: t.textPrimary }}>{l.title}</p>
                  <div className="flex items-center gap-1">
                    <img src={`https://www.google.com/s2/favicons?domain=${domain(l.url)}&sz=16`} alt=""
                      className="w-3 h-3 rounded-sm flex-shrink-0"
                      onError={e => { e.currentTarget.style.display = 'none'; }} />
                    <p className="text-[10px] truncate" style={{ color: t.textFaint }}>{domain(l.url)}</p>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* ── Recently Shared Board ────────────────────────────────────── */}
      {sharedBoards.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Share2 className="w-3.5 h-3.5" style={{ color: '#7C3AED' }} />
              <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: t.navSectionLabel }}>Recently Shared Board</p>
            </div>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
              style={{ background: 'rgba(124,58,237,0.08)', color: '#7C3AED' }}>
              {sharedBoards.length} board{sharedBoards.length !== 1 ? 's' : ''}
            </span>
          </div>
          {/* Horizontal scroll cards */}
          <div className="flex gap-3 overflow-x-auto pb-1 -mx-4 px-4 sm:-mx-6 sm:px-6"
            style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' } as React.CSSProperties}>
            {sharedBoards.map(board => {
              const color = dotColor(board.category);
              return (
                <div key={board.token} className="flex-none w-[148px] rounded-2xl overflow-hidden"
                  style={{ background: t.cardBg, border: `1px solid ${t.cardBorder}` }}>
                  <div className="p-2.5">
                    <p className="text-[12px] font-semibold truncate mb-0.5" style={{ color: t.textPrimary }}>{board.category}</p>
                    <p className="text-[10px] mb-1.5" style={{ color: t.textMuted }}>
                      {board.count} link{board.count !== 1 ? 's' : ''}
                    </p>
                    {/* View count */}
                    <div className="flex items-center gap-1 mb-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                      <p className="text-[10px] font-semibold" style={{ color: t.textPrimary }}>
                        {board.views} view{board.views !== 1 ? 's' : ''}
                      </p>
                    </div>
                    {/* Viewer avatars */}
                    {board.viewers.length > 0 && (
                      <div className="flex items-center gap-1 mb-2 flex-wrap">
                        {board.viewers.slice(0, 4).map((v, i) => (
                          <div key={i} title={v.email ?? 'Anonymous'}
                            className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white shrink-0"
                            style={{ background: v.email ? dotColor(v.email) : '#9CA3AF' }}>
                            {v.email ? v.email[0].toUpperCase() : '?'}
                          </div>
                        ))}
                        {board.viewers.length > 4 && (
                          <span className="text-[9px] font-medium" style={{ color: t.textFaint }}>+{board.viewers.length - 4}</span>
                        )}
                      </div>
                    )}
                    {/* Copy button */}
                    <button
                      onClick={() => copyShareLink(board.token)}
                      className="w-full flex items-center justify-center gap-1 py-1 rounded-lg text-[10px] font-semibold transition-colors"
                      style={{ background: copiedToken === board.token ? 'rgba(34,197,94,0.10)' : `${color}15`, color: copiedToken === board.token ? '#16A34A' : color }}>
                      {copiedToken === board.token
                        ? <><Check className="w-3 h-3" />Copied!</>
                        : <><Link2 className="w-3 h-3" />Copy link</>}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Boards ───────────────────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: t.navSectionLabel }}>Boards</p>
          <button onClick={() => onSelect('browse')}
            className="flex items-center gap-1 text-[12px] font-medium transition-opacity hover:opacity-70"
            style={{ color: '#7C3AED' }}>
            View all <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
        {categories.length === 0 ? (
          <div className="rounded-2xl p-8 text-center" style={{ background: t.cardBg, border: `1px solid ${t.cardBorder}` }}>
            <p className="text-[13px]" style={{ color: t.textMuted }}>No boards yet — add one from the sidebar</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {categories.map(cat => {
              const color = dotColor(cat);
              const catLinks = links.filter(l => l.category === cat);
              const top = catLinks.slice(0, 3);
              return (
                <button key={cat} onClick={() => onSelect(`cat:${cat}`)}
                  className="rounded-2xl p-4 text-left transition-all hover:-translate-y-0.5 group"
                  style={{ background: t.cardBg, border: `1px solid ${t.cardBorder}` }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = color; e.currentTarget.style.boxShadow = `0 4px 16px rgba(${hexToRgb(color)},0.10)`; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = t.cardBorder; e.currentTarget.style.boxShadow = 'none'; }}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: color, boxShadow: `0 0 8px ${color}60` }} />
                      <span className="text-[14px] font-semibold" style={{ color: t.textPrimary }}>{cat}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] px-2 py-0.5 rounded-md font-semibold tabular-nums"
                        style={{ background: t.badgeBg, color: t.badgeText }}>{catLinks.length}</span>
                      <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color }} />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    {top.length === 0 ? (
                      <p className="text-[11px]" style={{ color: t.textFaint }}>No links yet</p>
                    ) : top.map(l => (
                      <div key={l.id} className="flex items-center gap-2">
                        <div className="w-1 h-1 rounded-full shrink-0" style={{ background: t.textFaint }} />
                        <p className="text-[11px] truncate" style={{ color: t.textMuted }}>{l.title}</p>
                      </div>
                    ))}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Quick Stats ──────────────────────────────────────────────── */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Zap className="w-3.5 h-3.5" style={{ color: '#7C3AED' }} />
          <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: t.navSectionLabel }}>Quick Stats</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl p-4" style={{ background: t.cardBg, border: `1px solid ${t.cardBorder}` }}>
            <p className="text-[11px] font-medium mb-1.5" style={{ color: t.textMuted }}>Total Links</p>
            <p className="text-[28px] font-bold leading-none" style={{ color: t.textPrimary }}>{links.length}</p>
          </div>
          <div className="rounded-2xl p-4" style={{ background: 'linear-gradient(135deg,#7C3AED,#6366F1)' }}>
            <p className="text-[11px] font-medium mb-1.5" style={{ color: 'rgba(255,255,255,0.7)' }}>This Week</p>
            <p className="text-[28px] font-bold leading-none text-white">{thisWeek}</p>
          </div>
          <div className="rounded-2xl p-4" style={{ background: t.cardBg, border: `1px solid ${t.cardBorder}` }}>
            <p className="text-[11px] font-medium mb-1.5" style={{ color: t.textMuted }}>Favorites</p>
            <p className="text-[28px] font-bold leading-none" style={{ color: t.textPrimary }}>{favorites.size}</p>
          </div>
          <div className="rounded-2xl p-4" style={{ background: t.cardBg, border: `1px solid ${t.cardBorder}` }}>
            <p className="text-[11px] font-medium mb-1.5" style={{ color: t.textMuted }}>Boards</p>
            <p className="text-[28px] font-bold leading-none" style={{ color: t.textPrimary }}>{categories.length}</p>
          </div>
        </div>
      </div>

      {/* ── Quick nav ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { id: 'browse', label: 'All Saves', Icon: Bookmark, desc: `${links.length} saved`, color: '#7C3AED' },
          { id: 'recent', label: 'Recent', Icon: Clock, desc: `${thisWeek} this week`, color: '#6366F1' },
          { id: 'favorites', label: 'Favorites', Icon: Heart, desc: `${favorites.size} links`, color: '#EC4899' },
          { id: 'unsorted', label: 'Unsorted', Icon: Inbox, desc: `${unsorted} links`, color: '#F59E0B' },
        ].map(({ id, label, Icon, desc, color }) => (
          <button key={id} onClick={() => onSelect(id)}
            className="flex items-center gap-3 p-3.5 rounded-2xl text-left transition-all hover:-translate-y-0.5"
            style={{ background: t.cardBg, border: `1px solid ${t.cardBorder}` }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = color; e.currentTarget.style.boxShadow = `0 4px 16px rgba(${hexToRgb(color)},0.12)`; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = t.cardBorder; e.currentTarget.style.boxShadow = 'none'; }}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: `rgba(${hexToRgb(color)},0.10)` }}>
              <Icon className="w-4 h-4" style={{ color }} />
            </div>
            <div className="min-w-0">
              <p className="text-[13px] font-semibold truncate" style={{ color: t.textPrimary }}>{label}</p>
              <p className="text-[11px]" style={{ color: t.textMuted }}>{desc}</p>
            </div>
          </button>
        ))}
      </div>

    </div>
  );
}
