import { useState } from 'react';
import { Bookmark, Home, Clock, Heart, Inbox, Archive, Plus, Hash, Sparkles, Brain, BookOpen, Zap, Star, PanelLeftOpen, PanelLeftClose } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import type { LinkData } from './LinkCard';

const PALETTE = ['#8B5CF6','#6366F1','#3B82F6','#0EA5E9','#10B981','#F59E0B','#EF4444','#EC4899'];
function dotColor(n: string): string { const i = [...n].reduce((a,c) => a+c.charCodeAt(0), 0) % PALETTE.length; return PALETTE[i]; }
function hexToRgb(hex: string): string {
  const r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);
  return `${r},${g},${b}`;
}

export type Collection = string;

interface SidebarProps {
  categories: string[];
  selected: Collection;
  onSelect: (id: Collection) => void;
  links: LinkData[];
  favorites: Set<string>;
  onAddCategory?: (name: string) => void;
  sidebarOpen: boolean;
  onToggleSidebar?: () => void;
}

const SMART = [
  { id: 'all',       label: 'Home',           Icon: Home    },
  { id: 'recent',    label: 'Recently Saved',  Icon: Clock   },
  { id: 'favorites', label: 'Favorites',       Icon: Heart   },
  { id: 'unsorted',  label: 'Unsorted',        Icon: Inbox   },
  { id: 'archive',   label: 'Archive',         Icon: Archive },
] as const;

const AI_FOLDERS = [
  { id: 'ai:suggested', label: 'AI Suggested', Icon: Brain,    color: '#7C3AED', darkColor: '#A78BFA' },
  { id: 'ai:reading',   label: 'Reading List',  Icon: BookOpen, color: '#2563EB', darkColor: '#60A5FA' },
  { id: 'ai:trending',  label: 'Trending Now',  Icon: Zap,      color: '#D97706', darkColor: '#FB923C' },
  { id: 'ai:picks',     label: 'Top Picks',     Icon: Star,     color: '#B45309', darkColor: '#FBBF24' },
] as const;

const TAGS = ['design','dev','youtube','kdrama','inspiration','tools','news','read-later','ai','startup'];

export function Sidebar({ categories, selected, onSelect, links, favorites, onAddCategory, sidebarOpen, onToggleSidebar }: SidebarProps) {
  const { t } = useTheme();
  const [addingBoard, setAddingBoard] = useState(false);
  const [boardName, setBoardName]     = useState('');
  const [aiExpanded, setAiExpanded]   = useState(true);

  const now = Date.now();
  const wk  = 7 * 24 * 60 * 60 * 1000;
  const recentCount = links.filter(l => now - l.savedAt.getTime() < wk).length;
  const counts: Record<string, number> = {
    all:       links.length,
    recent:    recentCount,
    favorites: favorites.size,
    unsorted:  links.filter(l => !l.category || l.category === 'None').length,
    archive:   links.filter(l => l.category === 'Archive').length,
    'ai:suggested': Math.min(links.length, 12),
    'ai:reading':   links.filter(l => ['Articles','Blog','News'].includes(l.category)).length || Math.floor(links.length * 0.3),
    'ai:trending':  recentCount,
    'ai:picks':     favorites.size,
  };

  const weekLinks  = counts.recent;
  const totalLinks = links.length;
  const isActive   = (id: string) => selected === id;
  const submit     = () => { const n = boardName.trim(); if (n) { onAddCategory?.(n); setBoardName(''); setAddingBoard(false); } };

  // ── Full sidebar nav item ──────────────────────────────────────────────────
  const NavBtn = ({ id, label, Icon, count }: { id: string; label: string; Icon: React.ElementType; count?: number }) => {
    const active = isActive(id);
    return (
      <button onClick={() => onSelect(id)}
        className="w-full flex items-center gap-2.5 px-2.5 py-[9px] rounded-xl mb-0.5 transition-all duration-150 text-left"
        style={{ background: active ? t.navActiveBg : 'transparent', border: active ? `1px solid ${t.navActiveBorder}` : '1px solid transparent', color: active ? t.navActiveText : t.navInactiveText }}>
        <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 transition-all"
          style={{ background: active ? t.navActiveIconBg : t.navInactiveIconBg }}>
          <Icon className="w-3.5 h-3.5" style={{ color: active ? t.navActiveIcon : t.navInactiveIcon }} />
        </div>
        <span className="flex-1 text-[13px] font-medium truncate">{label}</span>
        {(count ?? 0) > 0 && (
          <span className="text-[10px] px-1.5 py-0.5 rounded-md font-semibold tabular-nums"
            style={{ background: active ? t.navActiveIconBg : t.badgeBg, color: active ? t.navActiveIcon : t.badgeText }}>
            {count}
          </span>
        )}
      </button>
    );
  };

  // ── Rail icon button (tablet) ──────────────────────────────────────────────
  const RailBtn = ({ id, label, Icon, count }: { id: string; label: string; Icon: React.ElementType; count?: number }) => {
    const active = isActive(id);
    return (
      <button title={label} onClick={() => onSelect(id)}
        className="relative w-10 h-10 rounded-xl flex items-center justify-center transition-all shrink-0"
        style={{
          background: active ? t.navActiveBg : 'transparent',
          border: active ? `1px solid ${t.navActiveBorder}` : '1px solid transparent',
        }}>
        <Icon className="w-[18px] h-[18px]" style={{ color: active ? t.navActiveIcon : t.navInactiveIcon }} />
        {(count ?? 0) > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[14px] h-[14px] rounded-full text-[7px] font-bold flex items-center justify-center text-white px-0.5"
            style={{ background: '#7C3AED' }}>
            {(count as number) > 9 ? '9+' : count}
          </span>
        )}
      </button>
    );
  };

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-20 flex flex-col transition-all duration-300 ease-in-out
        ${sidebarOpen
          ? 'w-[260px] translate-x-0'
          : 'w-[260px] md:w-16 xl:w-[260px] -translate-x-full md:translate-x-0'}`}
      style={{ background: t.sidebarBg, borderRight: `1px solid ${t.sidebarBorder}`, boxShadow: t.sidebarShadow }}>

      {/* ── Full sidebar: mobile drawer + tablet expanded + desktop ─────────── */}
      <div className={`flex flex-col h-full ${sidebarOpen ? '' : 'md:hidden xl:flex'}`}>

        {/* Logo */}
        <div className="px-5 pt-5 pb-4 flex items-center gap-2.5 shrink-0" style={{ borderBottom: `1px solid ${t.logoDivider}` }}>
          <div className="w-8 h-8 rounded-[10px] flex items-center justify-center shrink-0"
            style={{ background: t.logoIconBg, boxShadow: t.logoIconShadow }}>
            <Bookmark className="w-4 h-4 text-white" strokeWidth={2.5} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[15px] font-bold tracking-tight leading-none">
              <span style={{ color: t.logoText }}>Link</span>
              <span style={{ background: t.logoTextGradient, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Board</span>
            </p>
            <div className="flex items-center gap-1 mt-0.5">
              <Sparkles className="w-2.5 h-2.5" style={{ color: '#7C3AED' }} />
              <p className="text-[9px] font-medium tracking-widest" style={{ color: 'rgba(124,58,237,0.55)' }}>AI POWERED</p>
            </div>
          </div>
          {/* Collapse button — shown when in drawer/expanded overlay mode (not permanent desktop) */}
          {sidebarOpen && (
            <button
              onClick={() => onToggleSidebar?.()}
              title="Collapse sidebar"
              className="p-1.5 rounded-xl transition-all shrink-0"
              style={{ color: t.iconMuted }}
              onMouseEnter={e => { e.currentTarget.style.background = t.hoverBg; e.currentTarget.style.color = t.textSecondary; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = t.iconMuted; }}>
              <PanelLeftClose className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-5">

          <section>
            <p className="text-[9px] font-bold uppercase tracking-[0.18em] px-2 mb-2" style={{ color: t.navSectionLabel }}>Collections</p>
            {SMART.map(({ id, label, Icon }) => <NavBtn key={id} id={id} label={label} Icon={Icon} count={counts[id]} />)}
          </section>

          <section>
            <button onClick={() => setAiExpanded(p => !p)} className="w-full flex items-center justify-between px-2 mb-2">
              <div className="flex items-center gap-1.5">
                <Brain className="w-2.5 h-2.5" style={{ color: '#7C3AED' }} />
                <p className="text-[9px] font-bold uppercase tracking-[0.18em]" style={{ color: 'rgba(124,58,237,0.65)' }}>AI Smart Folders</p>
              </div>
              <span className="text-[8px] px-1.5 py-0.5 rounded-full font-bold"
                style={{ background: t.accentChipBg, color: t.accentChipText, border: `1px solid ${t.accentChipBorder}` }}>NEW</span>
            </button>
            {aiExpanded && AI_FOLDERS.map(({ id, label, Icon, color, darkColor }) => {
              const active = isActive(id);
              const col = t.isDark ? darkColor : color;
              const count = counts[id] ?? 0;
              return (
                <button key={id} onClick={() => onSelect(id)}
                  className="w-full flex items-center gap-2.5 px-2.5 py-[9px] rounded-xl mb-0.5 transition-all duration-150 text-left"
                  style={{
                    background: active ? `rgba(${hexToRgb(col)},0.12)` : 'transparent',
                    border: active ? `1px solid rgba(${hexToRgb(col)},0.25)` : '1px solid transparent',
                    color: active ? col : t.navInactiveText,
                  }}>
                  <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: active ? `rgba(${hexToRgb(col)},0.18)` : t.navInactiveIconBg }}>
                    <Icon className="w-3.5 h-3.5" style={{ color: active ? col : t.navInactiveIcon }} />
                  </div>
                  <span className="flex-1 text-[13px] font-medium truncate">{label}</span>
                  {count > 0 && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-md font-semibold tabular-nums"
                      style={{ background: active ? `rgba(${hexToRgb(col)},0.15)` : t.badgeBg, color: active ? col : t.badgeText }}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </section>

          <section>
            <div className="flex items-center justify-between px-2 mb-2">
              <p className="text-[9px] font-bold uppercase tracking-[0.18em]" style={{ color: t.navSectionLabel }}>Boards</p>
              <button onClick={() => setAddingBoard(true)} className="p-0.5 rounded-md transition-all"
                style={{ color: t.iconMuted }}
                onMouseEnter={e => { e.currentTarget.style.background = t.hoverBg; e.currentTarget.style.color = t.textSecondary; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = t.iconMuted; }}>
                <Plus className="w-3 h-3" />
              </button>
            </div>
            <div className="space-y-0.5">
              {categories.map(cat => {
                const active = isActive(`cat:${cat}`);
                const count = links.filter(l => l.category === cat).length;
                const color = dotColor(cat);
                return (
                  <button key={cat} onClick={() => onSelect(`cat:${cat}`)}
                    className="w-full flex items-center gap-2.5 px-2.5 py-[9px] rounded-xl transition-all duration-150 text-left"
                    style={{ background: active ? t.boardActiveBg : 'transparent', border: active ? `1px solid ${t.boardActiveBorder}` : '1px solid transparent', color: active ? t.boardActiveText : t.boardInactiveText }}>
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ background: color, boxShadow: active ? `0 0 7px ${color}80` : 'none' }} />
                    <span className="flex-1 text-[13px] font-medium truncate">{cat}</span>
                    {count > 0 && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-md font-semibold tabular-nums"
                        style={{ background: t.boardCountBg, color: t.boardCountText }}>
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            {addingBoard && (
              <div className="mt-2 px-1">
                <input type="text" value={boardName}
                  onChange={e => setBoardName(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') submit(); if (e.key === 'Escape') { setAddingBoard(false); setBoardName(''); } }}
                  onBlur={() => { if (!boardName.trim()) setAddingBoard(false); }}
                  placeholder="Board name…" autoFocus
                  className="w-full px-3 py-2 text-[12px] rounded-xl focus:outline-none"
                  style={{ background: t.boardInputBg, border: `1px solid ${t.boardInputBorder}`, color: t.boardInputText }}
                  onFocus={e => { e.currentTarget.style.borderColor = t.inputFocusBorder; e.currentTarget.style.boxShadow = '0 0 0 2px rgba(124,58,237,0.10)'; }}
                />
              </div>
            )}
          </section>

          <section>
            <p className="text-[9px] font-bold uppercase tracking-[0.18em] px-2 mb-2" style={{ color: t.navSectionLabel }}>Tags</p>
            <div className="px-1 flex flex-wrap gap-1.5">
              {TAGS.map(tag => (
                <button key={tag}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium transition-all"
                  style={{ background: t.tagBg, border: `1px solid ${t.tagBorder}`, color: t.tagText }}
                  onMouseEnter={e => { e.currentTarget.style.background = t.tagHoverBg; e.currentTarget.style.borderColor = t.tagHoverBorder; e.currentTarget.style.color = t.tagHoverText; }}
                  onMouseLeave={e => { e.currentTarget.style.background = t.tagBg; e.currentTarget.style.borderColor = t.tagBorder; e.currentTarget.style.color = t.tagText; }}>
                  <Hash className="w-2.5 h-2.5" />
                  {tag}
                </button>
              ))}
            </div>
          </section>
        </div>

        {/* Quick Stats */}
        <div className="px-4 pb-5 pt-4 shrink-0" style={{ borderTop: `1px solid ${t.logoDivider}` }}>
          <div className="flex items-center gap-1.5 mb-3">
            <Zap className="w-3 h-3" style={{ color: '#7C3AED' }} />
            <p className="text-[9px] font-bold uppercase tracking-[0.18em]" style={{ color: 'rgba(124,58,237,0.60)' }}>Quick Stats</p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-xl p-3" style={{ background: t.statCard1Bg, border: `1px solid ${t.statCard1Border}` }}>
              <p className="text-[9px] font-medium mb-1.5" style={{ color: t.statCard1Label }}>Total Links</p>
              <p className="text-xl font-bold tabular-nums" style={{ color: t.statCard1Number }}>{totalLinks}</p>
            </div>
            <div className="rounded-xl p-3 relative overflow-hidden"
              style={{ background: 'linear-gradient(135deg,rgba(124,58,237,0.12),rgba(99,102,241,0.08))', border: '1px solid rgba(124,58,237,0.20)' }}>

              <p className="text-[9px] font-medium mb-1.5" style={{ color: 'rgba(124,58,237,0.60)' }}>This Week</p>
              <p className="text-xl font-bold tabular-nums"
                style={{ background: 'linear-gradient(90deg,#7C3AED,#6366F1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{weekLinks}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Rail: tablet only (md → xl), hidden when expanded ───────────────── */}
      <div className={sidebarOpen ? 'hidden' : 'hidden md:flex xl:hidden flex-col items-center gap-1 py-4 h-full overflow-y-auto'}>

        {/* Logo mark */}
        <div className="w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0"
          style={{ background: t.logoIconBg, boxShadow: t.logoIconShadow }}>
          <Bookmark className="w-4 h-4 text-white" strokeWidth={2.5} />
        </div>

        {/* Expand button */}
        <button
          onClick={() => onToggleSidebar?.()}
          title="Expand sidebar"
          className="w-10 h-10 rounded-xl flex items-center justify-center transition-all shrink-0 mt-1"
          style={{ color: t.iconMuted }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(124,58,237,0.10)'; e.currentTarget.style.color = '#7C3AED'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = t.iconMuted; }}>
          <PanelLeftOpen className="w-4 h-4" />
        </button>

        <div className="w-7 h-px my-1 shrink-0" style={{ background: t.logoDivider }} />

        {/* Smart collections */}
        {SMART.map(({ id, label, Icon }) => (
          <RailBtn key={id} id={id} label={label} Icon={Icon} count={counts[id]} />
        ))}

        <div className="w-7 h-px my-1 shrink-0" style={{ background: t.logoDivider }} />

        {/* AI folders (brain icon represents all) */}
        <RailBtn id="ai:suggested" label="AI Smart Folders" Icon={Brain} count={counts['ai:suggested']} />

        <div className="w-7 h-px my-1 shrink-0" style={{ background: t.logoDivider }} />

        {/* Boards (colored dots) */}
        {categories.map(cat => {
          const active = isActive(`cat:${cat}`);
          const color = dotColor(cat);
          return (
            <button key={cat} title={cat}
              onClick={() => onSelect(`cat:${cat}`)}
              className="w-10 h-10 rounded-xl flex items-center justify-center transition-all shrink-0"
              style={{
                background: active ? t.boardActiveBg : 'transparent',
                border: active ? `1px solid ${t.boardActiveBorder}` : '1px solid transparent',
              }}>
              <div className="w-2.5 h-2.5 rounded-full"
                style={{ background: color, boxShadow: active ? `0 0 8px ${color}90` : 'none' }} />
            </button>
          );
        })}

        {/* Add board */}
        <button title="Add board"
          onClick={() => { const n = window.prompt('Board name:'); if (n?.trim()) onAddCategory?.(n.trim()); }}
          className="w-10 h-10 rounded-xl flex items-center justify-center transition-all shrink-0 mt-0.5"
          style={{ color: t.iconMuted }}
          onMouseEnter={e => { e.currentTarget.style.background = t.hoverBg; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
          <Plus className="w-4 h-4" />
        </button>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Stats indicator */}
        <div title={`${totalLinks} links · ${weekLinks} this week`}
          className="w-10 h-10 rounded-xl flex items-center justify-center mb-2 shrink-0 cursor-default"
          style={{ background: 'rgba(124,58,237,0.12)' }}>
          <Zap className="w-4 h-4" style={{ color: '#7C3AED' }} />
        </div>
      </div>
    </aside>
  );
}
