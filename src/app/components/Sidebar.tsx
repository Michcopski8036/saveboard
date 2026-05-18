import { useState, useRef, useEffect } from 'react';
import { Bookmark, Home, Clock, Heart, Inbox, Plus, Sparkles, Zap, PanelLeftOpen, PanelLeftClose, MoreHorizontal, Pencil, Trash2, Share2 } from 'lucide-react';
import { useDrop } from 'react-dnd';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import type { LinkData } from './LinkCard';
import { TAG_COLORS, deriveAiTags, LINK_DRAG_TYPE } from './LinkCard';

const PALETTE = ['#8B5CF6','#6366F1','#3B82F6','#0EA5E9','#10B981','#F59E0B','#EF4444','#EC4899'];
function dotColor(n: string): string { const i = [...n].reduce((a,c) => a+c.charCodeAt(0), 0) % PALETTE.length; return PALETTE[i]; }

export type Collection = string;

interface SidebarProps {
  categories: string[];
  selected: Collection;
  onSelect: (id: Collection) => void;
  links: LinkData[];
  favorites: Set<string>;
  onAddCategory?: (name: string) => void;
  onRenameCategory?: (old: string, neu: string) => void;
  onDeleteCategory?: (cat: string) => void;
  onShareCategory?: (cat: string) => void;
  onUpdateCategory?: (linkId: string, cat: string) => void;
  sidebarOpen: boolean;
  onToggleSidebar?: () => void;
}

const SMART_IDS = [
  { id: 'all',       key: 'home'         as const, Icon: Home    },
  { id: 'favorites', key: 'favorites'    as const, Icon: Heart   },
  { id: 'unsorted',  key: 'unsorted'     as const, Icon: Inbox   },
] as const;



interface BoardDropItemProps {
  cat: string;
  active: boolean;
  count: number;
  color: string;
  isRenaming: boolean;
  renameValue: string;
  isMenuOpen: boolean;
  menuRef: React.RefObject<HTMLDivElement>;
  t: any;
  onSelect: (id: string) => void;
  onUpdateCategory?: (linkId: string, cat: string) => void;
  setRenameValue: (v: string) => void;
  commitRename: (cat: string) => void;
  setRenamingCat: (v: string | null) => void;
  setMenuCat: (v: string | null) => void;
  startRename: (cat: string) => void;
  onShareCategory?: (cat: string) => void;
  onDeleteCategory?: (cat: string) => void;
}

function BoardDropItem({ cat, active, count, color, isRenaming, renameValue, isMenuOpen, menuRef, t, onSelect, onUpdateCategory, setRenameValue, commitRename, setRenamingCat, setMenuCat, startRename, onShareCategory, onDeleteCategory }: BoardDropItemProps) {
  const [{ isOver }, dropRef] = useDrop({
    accept: LINK_DRAG_TYPE,
    drop: (item: { id: string }) => { onUpdateCategory?.(item.id, cat); },
    collect: monitor => ({ isOver: monitor.isOver() }),
  });

  return (
    <div ref={dropRef} className="group relative flex items-center rounded-xl transition-all duration-150"
      style={{
        background: isOver ? `${color}22` : active ? t.boardActiveBg : 'transparent',
        border: isOver ? `1.5px solid ${color}66` : active ? `1px solid ${t.boardActiveBorder}` : '1px solid transparent',
        transform: isOver ? 'scale(1.02)' : 'scale(1)',
        zIndex: isMenuOpen ? 50 : undefined,
      }}>
      <button onClick={() => onSelect(`cat:${cat}`)}
        className="flex-1 flex items-center gap-2.5 px-2.5 py-[9px] text-left min-w-0"
        style={{ color: active ? t.boardActiveText : t.boardInactiveText }}>
        <div className="w-2 h-2 rounded-full shrink-0" style={{ background: color, boxShadow: (active || isOver) ? `0 0 7px ${color}80` : 'none' }} />
        {isRenaming ? (
          <input autoFocus value={renameValue}
            onChange={e => setRenameValue(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') commitRename(cat); if (e.key === 'Escape') setRenamingCat(null); }}
            onBlur={() => commitRename(cat)}
            onClick={e => e.stopPropagation()}
            className="flex-1 min-w-0 text-[13px] font-medium bg-transparent focus:outline-none border-b"
            style={{ color: active ? t.boardActiveText : t.boardInactiveText, borderColor: color }}
          />
        ) : (
          <span className="flex-1 text-[13px] font-medium truncate">{cat}</span>
        )}
        {isOver && !isRenaming && (
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md" style={{ background: color, color: 'white' }}>Drop</span>
        )}
      </button>
      {!isRenaming && (
        <>
          {!isMenuOpen && count > 0 && !isOver && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-md font-semibold tabular-nums mr-2 group-hover:hidden"
              style={{ background: t.boardCountBg, color: t.boardCountText }}>
              {count}
            </span>
          )}
          <div className="relative" ref={isMenuOpen ? menuRef : undefined}>
            <button
              onClick={e => { e.stopPropagation(); setMenuCat(isMenuOpen ? null : cat); }}
              className={`p-1 mr-1.5 rounded-md transition-all ${isMenuOpen ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
              style={{ color: t.iconMuted }}
              onMouseEnter={e => (e.currentTarget.style.background = t.hoverBg)}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
              <MoreHorizontal className="w-3.5 h-3.5" />
            </button>
            {isMenuOpen && (
              <div className="absolute right-0 top-full mt-1 z-[200] w-36 rounded-xl overflow-hidden"
                style={{ background: t.dropdownBg, border: `1px solid ${t.dropdownBorder}`, boxShadow: t.dropdownShadow }}>
                <div className="p-1">
                  <button onClick={() => startRename(cat)}
                    className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-left transition-colors"
                    style={{ color: t.dropdownText }}
                    onMouseEnter={e => (e.currentTarget.style.background = t.dropdownHoverBg)}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    <Pencil className="w-3.5 h-3.5" style={{ color: t.dropdownIcon }} />
                    <span className="text-[12px]">Rename</span>
                  </button>
                  <button onClick={() => { setMenuCat(null); onShareCategory?.(cat); }}
                    className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-left transition-colors"
                    style={{ color: t.dropdownText }}
                    onMouseEnter={e => (e.currentTarget.style.background = t.dropdownHoverBg)}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    <Share2 className="w-3.5 h-3.5" style={{ color: t.dropdownIcon }} />
                    <span className="text-[12px]">Share</span>
                  </button>
                  <button onClick={() => { setMenuCat(null); onDeleteCategory?.(cat); }}
                    className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-left transition-colors"
                    style={{ color: '#EF4444' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.08)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    <Trash2 className="w-3.5 h-3.5 text-red-400" />
                    <span className="text-[12px]">Delete</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export function Sidebar({ categories, selected, onSelect, links, favorites, onAddCategory, onRenameCategory, onDeleteCategory, onShareCategory, onUpdateCategory, sidebarOpen, onToggleSidebar }: SidebarProps) {
  const { t } = useTheme();
  const { tr } = useLanguage();

  const SMART = SMART_IDS.map(({ id, key, Icon }) => ({ id, label: tr(key), Icon }));
  const [addingBoard, setAddingBoard] = useState(false);
  const [boardName, setBoardName]     = useState('');
  const [menuCat, setMenuCat]         = useState<string | null>(null);
  const [renamingCat, setRenamingCat] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fn = (e: MouseEvent) => { if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuCat(null); };
    if (menuCat) document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, [menuCat]);

  const startRename = (cat: string) => { setMenuCat(null); setRenamingCat(cat); setRenameValue(cat); };
  const commitRename = (cat: string) => {
    const v = renameValue.trim();
    if (v && v !== cat) onRenameCategory?.(cat, v);
    setRenamingCat(null);
  };

  const now = Date.now();
  const wk  = 7 * 24 * 60 * 60 * 1000;
  const recentCount = links.filter(l => now - l.savedAt.getTime() < wk).length;
  const counts: Record<string, number> = {
    all:       links.length,
    recent:    recentCount,
    favorites: favorites.size,
    unsorted:  links.filter(l => !l.category || l.category === 'None').length,
  };

  // Merge user-added tags + auto-derived non-category tags
  // Auto-derived first so their color type takes priority; Sets avoid double-counting
  const allTagsMap: Record<string, { type: string; ids: Set<string> }> = {};
  links.forEach(l => {
    const domain = (() => { try { return new URL(l.url).hostname.toLowerCase().replace('www.', ''); } catch { return ''; } })();
    deriveAiTags(l, domain).filter(t => t.type !== 'category').forEach(({ label, type }) => {
      const key = label.toLowerCase();
      if (!allTagsMap[key]) allTagsMap[key] = { type, ids: new Set() };
      allTagsMap[key].ids.add(l.id);
    });
    (l.tags ?? []).forEach(tag => {
      const key = tag.toLowerCase();
      if (!allTagsMap[key]) allTagsMap[key] = { type: 'user', ids: new Set() };
      allTagsMap[key].ids.add(l.id);
    });
  });
  const allSidebarTags = Object.entries(allTagsMap)
    .map(([label, { type, ids }]) => ({ label, type, count: ids.size }))
    .sort((a, b) => a.label.localeCompare(b.label));

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
          <button onClick={() => onSelect('all')} className="flex items-center gap-2.5 min-w-0 flex-1 text-left">
            <div className="w-8 h-8 rounded-[10px] flex items-center justify-center shrink-0"
              style={{ background: t.logoIconBg, boxShadow: t.logoIconShadow }}>
              <Bookmark className="w-4 h-4 text-white" strokeWidth={2.5} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[15px] font-bold tracking-tight leading-none">
                <span style={{ color: t.logoText }}>Save</span>
                <span style={{ background: t.logoTextGradient, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Board</span>
              </p>
              <div className="flex items-center gap-1 mt-0.5">
                <Sparkles className="w-2.5 h-2.5" style={{ color: '#7C3AED' }} />
                <p className="text-[9px] font-medium tracking-widest" style={{ color: 'rgba(124,58,237,0.55)' }}>AI POWERED</p>
              </div>
            </div>
          </button>
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
            <p className="text-[9px] font-bold uppercase tracking-[0.18em] px-2 mb-2" style={{ color: t.navSectionLabel }}>{tr('collections')}</p>
            {SMART.map(({ id, label, Icon }) => <NavBtn key={id} id={id} label={label} Icon={Icon} count={id === 'all' ? undefined : counts[id]} />)}
          </section>

          <section>
            <div className="flex items-center justify-between px-2 mb-2">
              <p className="text-[9px] font-bold uppercase tracking-[0.18em]" style={{ color: t.navSectionLabel }}>{tr('boards')}</p>
              <button onClick={() => setAddingBoard(true)} className="p-0.5 rounded-md transition-all"
                style={{ color: t.iconMuted }}
                onMouseEnter={e => { e.currentTarget.style.background = t.hoverBg; e.currentTarget.style.color = t.textSecondary; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = t.iconMuted; }}>
                <Plus className="w-3 h-3" />
              </button>
            </div>
            <div className="space-y-0.5">
              {/* All boards shortcut */}
              <div className="group relative flex items-center rounded-xl transition-all duration-150"
                style={{ background: isActive('browse') ? t.boardActiveBg : 'transparent', border: isActive('browse') ? `1px solid ${t.boardActiveBorder}` : '1px solid transparent' }}>
                <button onClick={() => onSelect('browse')}
                  className="flex-1 flex items-center gap-2.5 px-2.5 py-[9px] text-left min-w-0"
                  style={{ color: isActive('browse') ? t.boardActiveText : t.boardInactiveText }}>
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ background: '#9CA3AF' }} />
                  <span className="flex-1 text-[13px] font-medium truncate">{tr('all')}</span>
                  {links.length > 0 && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-md font-semibold tabular-nums"
                      style={{ background: t.boardCountBg, color: t.boardCountText }}>
                      {links.length}
                    </span>
                  )}
                </button>
              </div>
              {categories.map(cat => (
                <BoardDropItem
                  key={cat}
                  cat={cat}
                  active={isActive(`cat:${cat}`)}
                  count={links.filter(l => l.category === cat).length}
                  color={dotColor(cat)}
                  isRenaming={renamingCat === cat}
                  renameValue={renameValue}
                  isMenuOpen={menuCat === cat}
                  menuRef={menuRef}
                  t={t}
                  onSelect={onSelect}
                  onUpdateCategory={onUpdateCategory}
                  setRenameValue={setRenameValue}
                  commitRename={commitRename}
                  setRenamingCat={setRenamingCat}
                  setMenuCat={setMenuCat}
                  startRename={startRename}
                  onShareCategory={onShareCategory}
                  onDeleteCategory={onDeleteCategory}
                />
              ))}
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
            <p className="text-[9px] font-bold uppercase tracking-[0.18em] px-2 mb-2" style={{ color: t.navSectionLabel }}>{tr('tags')}</p>
            {allSidebarTags.length === 0 ? (
              <p className="px-2 text-[11px] leading-relaxed" style={{ color: t.textFaint }}>
                Tags appear here automatically as you save links.
              </p>
            ) : (
              <div className="px-1 flex flex-wrap gap-1.5">
                {allSidebarTags.map(({ label, type, count }) => {
                  const active = isActive(`tag:${label}`);
                  const c = TAG_COLORS[type] ?? TAG_COLORS.default;
                  return (
                    <button key={label}
                      onClick={() => onSelect(`tag:${label}`)}
                      className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold transition-all"
                      style={{
                        background: active ? c.bg.replace('0.10', '0.22') : c.bg,
                        border: `1px solid ${active ? c.border.replace('0.22', '0.45') : c.border}`,
                        color: c.color,
                      }}>
                      #{label}
                      {count > 1 && <span className="ml-0.5 text-[9px] opacity-60">{count}</span>}
                    </button>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        {/* Quick Stats */}
        <div className="px-4 pb-5 pt-4 shrink-0" style={{ borderTop: `1px solid ${t.logoDivider}` }}>
          <div className="flex items-center gap-1.5 mb-3">
            <Zap className="w-3 h-3" style={{ color: '#7C3AED' }} />
            <p className="text-[9px] font-bold uppercase tracking-[0.18em]" style={{ color: 'rgba(124,58,237,0.60)' }}>{tr('quickStats')}</p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-xl p-3" style={{ background: t.statCard1Bg, border: `1px solid ${t.statCard1Border}` }}>
              <p className="text-[9px] font-medium mb-1.5" style={{ color: t.statCard1Label }}>{tr('totalLinks')}</p>
              <p className="text-xl font-bold tabular-nums" style={{ color: t.statCard1Number }}>{totalLinks}</p>
            </div>
            <div className="rounded-xl p-3 relative overflow-hidden"
              style={{ background: 'linear-gradient(135deg,rgba(124,58,237,0.12),rgba(99,102,241,0.08))', border: '1px solid rgba(124,58,237,0.20)' }}>

              <p className="text-[9px] font-medium mb-1.5" style={{ color: 'rgba(124,58,237,0.60)' }}>{tr('thisWeek')}</p>
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
