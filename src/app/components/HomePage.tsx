import { useMemo } from 'react';
import Masonry, { ResponsiveMasonry } from 'react-responsive-masonry';
import { Bookmark, Clock, Heart, Inbox, ArrowRight, Plus, Globe, Zap } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import type { LinkData } from './LinkCard';

const PALETTE = ['#8B5CF6','#6366F1','#3B82F6','#0EA5E9','#10B981','#F59E0B','#EF4444','#EC4899'];
function dotColor(n: string) { return PALETTE[[...n].reduce((a,c) => a+c.charCodeAt(0),0) % PALETTE.length]; }
function hexToRgb(hex: string) {
  const r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);
  return `${r},${g},${b}`;
}
function domain(url: string) { try { return new URL(url).hostname.replace('www.',''); } catch { return ''; } }
function timeAgo(d: Date) {
  const s = Math.floor((Date.now() - d.getTime()) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s/60)}m ago`;
  if (s < 86400) return `${Math.floor(s/3600)}h ago`;
  return `${Math.floor(s/86400)}d ago`;
}

interface HomePageProps {
  links: LinkData[];
  categories: string[];
  favorites: Set<string>;
  userEmail?: string;
  onSelect: (id: string) => void;
  onAddLink: () => void;
}

export function HomePage({ links, categories, favorites, userEmail, onSelect, onAddLink }: HomePageProps) {
  const { t } = useTheme();

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
    <div className="space-y-8 pb-48">

      {/* ── Greeting ─────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[13px] font-medium mb-0.5" style={{ color: t.textMuted }}>{greeting}{name ? `, ${name}` : ''}!</p>
          <h1 className="text-[24px] font-bold leading-tight" style={{ color: t.textPrimary }}>Your SaveBoard</h1>
        </div>
        <button onClick={onAddLink}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-semibold text-white shrink-0 transition-opacity hover:opacity-90"
          style={{ background: 'linear-gradient(135deg,#7C3AED,#6366F1)' }}>
          <Plus className="w-4 h-4" />
          Add Link
        </button>
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
          <ResponsiveMasonry columnsCountBreakPoints={{ 0: 2, 360: 2, 768: 3, 1280: 4, 1600: 5 }}>
            <Masonry gutter="12px">
              {recent.map(l => (
                <a key={l.id} href={l.url} target="_blank" rel="noopener noreferrer"
                  className="block rounded-2xl overflow-hidden transition-all hover:-translate-y-0.5"
                  style={{ background: t.cardBg, border: `1px solid ${t.cardBorder}` }}>
                  {l.image && l.image !== 'placeholder:memo' && l.image !== 'placeholder:pdf' ? (
                    <div className="w-full overflow-hidden">
                      <img src={l.image} alt={l.title} className="w-full h-auto object-cover"
                        onError={e => { (e.currentTarget.parentElement as HTMLElement).style.display = 'none'; }} />
                    </div>
                  ) : (
                    <div className="w-full h-28 flex items-center justify-center"
                      style={{ background: `rgba(${hexToRgb(dotColor(l.category || 'x'))},0.08)` }}>
                      <Bookmark className="w-7 h-7" style={{ color: dotColor(l.category || 'x'), opacity: 0.35 }} />
                    </div>
                  )}
                  <div className="p-3">
                    <p className="text-[12px] font-semibold line-clamp-2 leading-snug" style={{ color: t.textPrimary }}>{l.title}</p>
                    {l.description && (
                      <p className="text-[11px] mt-1 line-clamp-2 leading-snug" style={{ color: t.textMuted }}>{l.description}</p>
                    )}
                    <div className="flex items-center gap-1 mt-2">
                      <Globe className="w-3 h-3 shrink-0" style={{ color: t.textFaint }} />
                      <p className="text-[10px] truncate" style={{ color: t.textFaint }}>{domain(l.url) || timeAgo(l.savedAt)}</p>
                    </div>
                  </div>
                </a>
              ))}
            </Masonry>
          </ResponsiveMasonry>
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
