import { useState, useRef, useEffect } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { MoreVertical, Heart, Trash2, Link2, Check, Sparkles } from 'lucide-react';
import { isPlaceholder, getPlatformFromPlaceholder, detectPlatformFromUrl, PlatformPlaceholder } from './PlatformPlaceholder';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import type { LinkData } from './LinkCard';

const DRAG_TYPE = 'KANBAN_CARD';

const COL_PALETTE = ['#8B5CF6','#6366F1','#3B82F6','#0EA5E9','#10B981','#F59E0B','#EF4444','#EC4899','#14B8A6'];
function colColor(name: string): string {
  const i = [...name].reduce((a, c) => a + c.charCodeAt(0), 0) % COL_PALETTE.length;
  return COL_PALETTE[i];
}
function domain(link: LinkData): string {
  try { return new URL(link.url).hostname.replace('www.', ''); } catch { return ''; }
}

interface KanbanCardProps {
  link: LinkData; isFavorited: boolean;
  onToggleFavorite: (id: string) => void; onDelete: (id: string) => void;
  onUpdateCategory: (id: string, cat: string) => void; categories: string[];
}

function KanbanCard({ link, isFavorited, onToggleFavorite, onDelete }: KanbanCardProps) {
  const { t } = useTheme();
  const [showMenu, setShowMenu] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [thumbError, setThumbError] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const isMemo = link.image === 'placeholder:memo';
  const dom = isMemo ? 'Note' : link.image === 'placeholder:pdf' ? 'PDF' : domain(link);

  const [{ isDragging }, drag] = useDrag({
    type: DRAG_TYPE,
    item: { id: link.id, category: link.category },
    collect: monitor => ({ isDragging: monitor.isDragging() }),
  });

  useEffect(() => {
    const fn = (e: MouseEvent) => { if (menuRef.current && !menuRef.current.contains(e.target as Node)) setShowMenu(false); };
    if (showMenu) document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, [showMenu]);

  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    try { await navigator.clipboard.writeText(link.url); setIsCopied(true); setTimeout(() => setIsCopied(false), 2000); } catch {}
    setShowMenu(false);
  };

  return (
    <div ref={node => { drag(node); }} className="group rounded-xl p-3 transition-all duration-200 cursor-grab active:cursor-grabbing"
      style={{
        background: t.kanbanCardBg,
        border: `1px solid ${t.kanbanCardBorder}`,
        boxShadow: t.kanbanCardShadow,
        opacity: isDragging ? 0.4 : 1,
      }}
      onMouseEnter={e => { if (!isDragging) { e.currentTarget.style.boxShadow = t.kanbanCardHoverShadow; e.currentTarget.style.borderColor = t.kanbanCardHoverBorder; e.currentTarget.style.transform = 'translateY(-1px)'; } }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = t.kanbanCardShadow; e.currentTarget.style.borderColor = t.kanbanCardBorder; e.currentTarget.style.transform = 'translateY(0)'; }}>

      <div className="flex gap-2.5 mb-2.5">
        <div className="w-11 h-11 rounded-lg overflow-hidden shrink-0">
          {/* A link with no image at all used to fall through to <img src="">, which
              renders as a broken-image icon. Fall back the way LinkCard does. */}
          {isPlaceholder(link.image || '')
            ? <PlatformPlaceholder platform={getPlatformFromPlaceholder(link.image)} text={isMemo ? link.description : undefined} className="w-full h-full" />
            : !link.image || thumbError
              ? <PlatformPlaceholder platform={detectPlatformFromUrl(link.url)} className="w-full h-full" />
              : <img src={link.image} alt={link.title} crossOrigin="anonymous" onError={() => setThumbError(true)} className="w-full h-full object-cover" />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[12px] font-semibold line-clamp-2 leading-snug" style={{ color: t.kanbanColTitle }}>{link.title}</p>
          <p className="text-[10px] mt-0.5 truncate" style={{ color: t.textMuted }}>{dom}</p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1 flex-wrap">
          {link.category && link.category !== 'None' && (
            <span className="text-[9px] px-1.5 py-0.5 rounded-full font-medium"
              style={{ background: t.kanbanCatPillBg, color: t.kanbanCatPillText }}>
              {link.category}
            </span>
          )}
          {link.notes && <Sparkles className="w-2.5 h-2.5" style={{ color: '#7C3AED' }} />}
        </div>
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150 shrink-0">
          <button onClick={e => { e.preventDefault(); e.stopPropagation(); onToggleFavorite(link.id); }}
            className="p-1 rounded-lg transition-colors"
            onMouseEnter={e => (e.currentTarget.style.background = t.kanbanActionHoverBg)}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
            <Heart className={`w-3 h-3 ${isFavorited ? 'fill-red-400 text-red-400' : ''}`} style={{ color: isFavorited ? undefined : t.iconAction }} />
          </button>
          <div className="relative" ref={menuRef}>
            <button onClick={e => { e.preventDefault(); e.stopPropagation(); setShowMenu(p => !p); }}
              className="p-1 rounded-lg transition-colors"
              onMouseEnter={e => (e.currentTarget.style.background = t.kanbanActionHoverBg)}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
              <MoreVertical className="w-3 h-3" style={{ color: t.iconMuted }} />
            </button>
            {showMenu && (
              <div className="absolute right-0 bottom-full mb-1 z-50 w-40 rounded-xl overflow-hidden"
                style={{ background: t.dropdownBg, border: `1px solid ${t.dropdownBorder}`, boxShadow: t.dropdownShadow }}>
                <div className="p-1">
                  {[
                    { label: isCopied ? 'Copied!' : 'Copy link', Icon: isCopied ? Check : Link2, action: handleCopy, isDelete: false },
                    { label: 'Delete', Icon: Trash2, action: (e: React.MouseEvent) => { e.preventDefault(); e.stopPropagation(); setShowMenu(false); if (confirm('Delete?')) onDelete(link.id); }, isDelete: true },
                  ].map(({ label, Icon, action, isDelete }) => (
                    <button key={label} onClick={action}
                      className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-left transition-colors"
                      style={{ color: isDelete ? '#EF4444' : t.dropdownText }}
                      onMouseEnter={e => { e.currentTarget.style.background = isDelete ? 'rgba(239,68,68,0.08)' : t.dropdownHoverBg; }}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                      <Icon className="w-3.5 h-3.5" style={{ color: isDelete ? '#EF4444' : (label === 'Copied!' ? '#22C55E' : t.dropdownIcon) }} />
                      <span className="text-[12px]">{label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

interface KanbanViewProps {
  links: LinkData[]; categories: string[]; favorites: Set<string>;
  selected?: string;
  onToggleFavorite: (id: string) => void; onDelete: (id: string) => void; onUpdateCategory: (id: string, cat: string) => void;
}

interface KanbanColumnProps {
  col: { id: string; label: string; links: LinkData[] };
  color: string;
  favorites: Set<string>;
  categories: string[];
  onToggleFavorite: (id: string) => void;
  onDelete: (id: string) => void;
  onUpdateCategory: (id: string, cat: string) => void;
}

function KanbanColumn({ col, color, favorites, categories, onToggleFavorite, onDelete, onUpdateCategory }: KanbanColumnProps) {
  const { t } = useTheme();
  const { tr } = useLanguage();

  const [{ isOver, canDrop }, drop] = useDrop({
    accept: DRAG_TYPE,
    drop: (item: { id: string; category: string | undefined }) => {
      const targetCategory = col.id === 'none' ? 'None' : col.id;
      const currentCategory = item.category ?? 'None';
      if (currentCategory !== targetCategory) {
        onUpdateCategory(item.id, targetCategory);
      }
    },
    canDrop: (item: { id: string; category: string | undefined }) => {
      const targetCategory = col.id === 'none' ? 'None' : col.id;
      return (item.category ?? 'None') !== targetCategory;
    },
    collect: monitor => ({ isOver: monitor.isOver(), canDrop: monitor.canDrop() }),
  });

  const isActive = isOver && canDrop;

  return (
    <div ref={node => { drop(node); }} className="flex flex-col shrink-0 rounded-2xl transition-all duration-150"
      style={{
        width: 270,
        background: t.kanbanColBg,
        border: `1px solid ${isActive ? color : t.kanbanColBorder}`,
        boxShadow: isActive ? `0 0 0 2px ${color}40` : undefined,
      }}>
      <div className="px-4 py-3.5 flex items-center justify-between shrink-0"
        style={{ borderBottom: `1px solid ${t.kanbanColDivider}` }}>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: color, boxShadow: `0 0 7px ${color}60` }} />
          <span className="text-[13px] font-semibold" style={{ color: t.kanbanColTitle }}>{col.label}</span>
        </div>
        <span className="text-[10px] px-1.5 py-0.5 rounded-md font-semibold tabular-nums"
          style={{ background: t.kanbanColCountBg, color: t.kanbanColCountText }}>
          {col.links.length}
        </span>
      </div>
      <div className="h-[2px] mx-4 rounded-full" style={{ background: `linear-gradient(90deg, ${color}50, transparent)` }} />
      <div className="flex-1 overflow-y-auto p-3 space-y-2" style={{ minHeight: 80 }}>
        {isActive && col.links.length === 0 && (
          <div className="rounded-xl border-2 border-dashed h-16 flex items-center justify-center"
            style={{ borderColor: color, background: `${color}10` }}>
            <p className="text-[11px] font-medium" style={{ color }}>{tr('dropHere')}</p>
          </div>
        )}
        {col.links.length === 0 && !isActive ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <p className="text-[11px]" style={{ color: t.kanbanEmptyText }}>{tr('noLinksShort')}</p>
          </div>
        ) : (
          col.links.map(link => (
            <KanbanCard key={link.id} link={link} isFavorited={favorites.has(link.id)}
              onToggleFavorite={onToggleFavorite} onDelete={onDelete}
              onUpdateCategory={onUpdateCategory} categories={categories} />
          ))
        )}
        {isActive && col.links.length > 0 && (
          <div className="rounded-xl border-2 border-dashed h-12 flex items-center justify-center"
            style={{ borderColor: color, background: `${color}10` }}>
            <p className="text-[11px] font-medium" style={{ color }}>{tr('dropHere')}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export function KanbanView({ links, categories, favorites, selected, onToggleFavorite, onDelete, onUpdateCategory }: KanbanViewProps) {
  const selectedCat = selected?.startsWith('cat:') ? selected.slice(4) : null;

  const allColumns = [
    { id: 'none', label: 'Unsorted', links: links.filter(l => !l.category || l.category === 'None') },
    ...categories.map(cat => ({ id: cat, label: cat, links: links.filter(l => l.category === cat) })),
    { id: 'archive', label: 'Archive', links: links.filter(l => l.category === 'Archive') },
  ];

  const columns = selectedCat
    ? allColumns.filter(col => col.id === 'none' || col.id === selectedCat)
    : allColumns.filter(col => col.links.length > 0 || col.id === 'none');

  return (
    <div className="flex gap-4 pb-6 overflow-x-auto" style={{ minHeight: 'calc(100vh - 200px)' }}>
      {columns.map(col => {
        const color = col.id === 'none' ? '#9CA3AF' : col.id === 'archive' ? '#6B7280' : colColor(col.label);
        return (
          <KanbanColumn key={col.id} col={col} color={color}
            favorites={favorites} categories={categories}
            onToggleFavorite={onToggleFavorite} onDelete={onDelete}
            onUpdateCategory={onUpdateCategory} />
        );
      })}
    </div>
  );
}
