import { useMemo, useState } from 'react';
import { ArrowRight, Link2, Check, Share2 } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { LinkCard, type LinkData } from './LinkCard';

const PALETTE = ['#8B5CF6','#6366F1','#3B82F6','#0EA5E9','#10B981','#F59E0B','#EF4444','#EC4899'];
function dotColor(n: string) { return PALETTE[[...n].reduce((a,c) => a+c.charCodeAt(0),0) % PALETTE.length]; }

interface SharedBoard { token: string; category: string; synced_at: string | null; count: number; views: number; viewers: { email: string | null; viewed_at: string }[]; }

interface HomePageProps {
  links: LinkData[];
  categories: string[];
  favorites: Set<string>;
  userEmail?: string;
  sharedBoards?: SharedBoard[];
  onSelect: (id: string) => void;
  cardProps: (link: LinkData) => any;
}

export function HomePage({ links, categories, favorites, userEmail, sharedBoards = [], onSelect, cardProps }: HomePageProps) {
  const { t } = useTheme();
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  const copyShareLink = async (token: string) => {
    const base = window.location.origin.startsWith('capacitor') ? 'https://saveboard.app' : window.location.origin;
    await navigator.clipboard.writeText(`${base}/share/${token}`);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const recent = useMemo(() => [...links].sort((a,b) => b.savedAt.getTime() - a.savedAt.getTime()).slice(0, 8), [links]);

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
                    <div className="flex items-center gap-1 mb-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                      <p className="text-[10px] font-semibold" style={{ color: t.textPrimary }}>
                        {board.views} view{board.views !== 1 ? 's' : ''}
                      </p>
                    </div>
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
          <div className="columns-2 sm:columns-3 md:columns-4 lg:columns-5 gap-3.5">
            {recent.map(l => (
              <div key={l.id} className="break-inside-avoid mb-3.5">
                <LinkCard {...cardProps(l)} />
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
