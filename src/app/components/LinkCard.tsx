import { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { MoreVertical, Link2, Check, FileText, ChevronDown, Volume2, VolumeX, Heart, Tag, Trash2, Sparkles, Clock, Play, BookOpen, ExternalLink, Pencil, GripVertical } from 'lucide-react';
import { useDrag, useDrop } from 'react-dnd';
import { CategoryPopup } from './CategoryPopup';
import { PlatformPlaceholder, isPlaceholder, getPlatformFromPlaceholder, detectPlatformFromUrl } from './PlatformPlaceholder';
import { useTheme } from '../context/ThemeContext';

export const LINK_DRAG_TYPE = 'LINK_TO_BOARD';

export interface LinkData {
  id: string; url: string; title: string; description: string;
  image: string; category: string; savedAt: Date; comments?: string[]; notes?: string; tags?: string[];
}

interface LinkCardProps {
  link: LinkData;
  onUpdateCategory?: (linkId: string, newCategory: string) => void;
  onDelete?: (linkId: string) => void;
  onAddCategory?: (category: string) => void;
  onRenameCategory?: (oldName: string, newName: string) => void;
  onUpdateNotes?: (linkId: string, notes: string) => void;
  onUpdateLink?: (linkId: string, title: string, description: string) => void;
  onUpdateTags?: (linkId: string, tags: string[]) => void;
  onToggleSelect?: (linkId: string) => void;
  onToggleFavorite?: (linkId: string) => void;
  onShowUpgrade?: () => void;
  onMoveCard?: (dragId: string, hoverId: string) => void;
  categories?: string[];
  suggestedTags?: { label: string; type: string }[];
  selectMode?: boolean; isSelected?: boolean; isFavorited?: boolean; listMode?: boolean; compact?: boolean; isPro?: boolean;
}

function getYouTubeVideoId(url: string): string | null {
  const patterns = [/(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]+)/, /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]+)/, /(?:youtu\.be\/)([a-zA-Z0-9_-]+)/];
  for (const p of patterns) { const m = url.match(p); if (m?.[1]) return m[1]; }
  return null;
}
function getVimeoVideoId(url: string): string | null {
  const m = url.match(/vimeo\.com\/(?:.*\/)?(\d+)/); return m ? m[1] : null;
}
function fakeVideoDuration(id: string): string {
  const n = [...id].reduce((a, c) => a + c.charCodeAt(0), 0);
  return `${2 + (n % 17)}:${(n % 60).toString().padStart(2, '0')}`;
}
export interface TagItem { label: string; type: string; }

export const TAG_COLORS: Record<string, { bg: string; border: string; color: string }> = {
  category: { bg: 'rgba(124,58,237,0.10)', border: 'rgba(124,58,237,0.22)', color: '#7C3AED' },
  code:     { bg: 'rgba(37,99,235,0.10)',  border: 'rgba(37,99,235,0.22)',  color: '#2563EB' },
  article:  { bg: 'rgba(5,150,105,0.10)',  border: 'rgba(5,150,105,0.22)',  color: '#059669' },
  video:    { bg: 'rgba(220,38,38,0.10)',  border: 'rgba(220,38,38,0.22)',  color: '#DC2626' },
  social:   { bg: 'rgba(234,88,12,0.10)',  border: 'rgba(234,88,12,0.22)',  color: '#EA580C' },
  design:   { bg: 'rgba(219,39,119,0.10)', border: 'rgba(219,39,119,0.22)', color: '#DB2777' },
  tutorial: { bg: 'rgba(217,119,6,0.10)',  border: 'rgba(217,119,6,0.22)',  color: '#D97706' },
  ai:       { bg: 'rgba(99,102,241,0.10)', border: 'rgba(99,102,241,0.22)', color: '#6366F1' },
  tool:     { bg: 'rgba(20,184,166,0.10)', border: 'rgba(20,184,166,0.22)', color: '#0D9488' },
  audio:    { bg: 'rgba(239,68,68,0.10)',  border: 'rgba(239,68,68,0.22)',  color: '#EF4444' },
  product:  { bg: 'rgba(245,158,11,0.10)', border: 'rgba(245,158,11,0.22)', color: '#F59E0B' },
  research: { bg: 'rgba(139,92,246,0.10)', border: 'rgba(139,92,246,0.22)', color: '#7C3AED' },
  food:     { bg: 'rgba(249,115,22,0.10)', border: 'rgba(249,115,22,0.22)', color: '#F97316' },
  travel:   { bg: 'rgba(14,165,233,0.10)', border: 'rgba(14,165,233,0.22)', color: '#0EA5E9' },
  finance:  { bg: 'rgba(34,197,94,0.10)',  border: 'rgba(34,197,94,0.22)',  color: '#16A34A' },
  health:   { bg: 'rgba(168,85,247,0.10)', border: 'rgba(168,85,247,0.22)', color: '#A855F7' },
  news:     { bg: 'rgba(100,116,139,0.10)',border: 'rgba(100,116,139,0.22)',color: '#475569' },
  user:     { bg: 'rgba(20,184,166,0.10)', border: 'rgba(20,184,166,0.22)', color: '#0D9488' },
  default:  { bg: 'rgba(107,114,128,0.10)',border: 'rgba(107,114,128,0.22)',color: '#6B7280' },
};

export function deriveAiTags(link: LinkData, domain: string): TagItem[] {
  const tags: TagItem[] = [];

  if (link.category && link.category !== 'None' && link.category !== 'Archive')
    tags.push({ label: link.category, type: 'category' });

  const tl   = link.title.toLowerCase();
  const dl   = (link.description ?? '').toLowerCase();
  const text = `${tl} ${dl}`;

  // ── Domain-based ────────────────────────────────────────────────────────────
  if (domain.includes('github') || domain.includes('gitlab') || domain.includes('bitbucket') ||
      domain.includes('stackoverflow') || domain.includes('codepen') || domain.includes('codesandbox') ||
      domain.includes('replit') || domain.includes('npmjs') || domain.includes('pypi'))
    tags.push({ label: 'code', type: 'code' });

  if (domain.includes('youtube') || domain.includes('vimeo') || domain.includes('dailymotion') ||
      domain.includes('twitch') || domain.includes('tiktok') || domain.includes('loom'))
    tags.push({ label: 'video', type: 'video' });

  if (domain.includes('twitter') || domain.includes('x.com') || domain.includes('instagram') ||
      domain.includes('reddit') || domain.includes('linkedin') || domain.includes('threads') ||
      domain.includes('facebook') || domain.includes('mastodon') || domain.includes('bsky'))
    tags.push({ label: 'social', type: 'social' });

  if (domain.includes('medium') || domain.includes('substack') || domain.includes('dev.to') ||
      domain.includes('hashnode') || domain.includes('beehiiv') || domain.includes('ghost.io') ||
      domain.includes('wordpress') || domain.includes('blogger') || domain.includes('hubspot'))
    tags.push({ label: 'article', type: 'article' });

  if (domain.includes('figma') || domain.includes('dribbble') || domain.includes('behance') ||
      domain.includes('canva') || domain.includes('adobe') || domain.includes('framer') ||
      domain.includes('sketch'))
    tags.push({ label: 'design', type: 'design' });

  if (domain.includes('spotify') || domain.includes('podcasts.apple') || domain.includes('soundcloud') ||
      domain.includes('anchor.fm') || domain.includes('overcast') || domain.includes('podcastaddict'))
    tags.push({ label: 'audio', type: 'audio' });

  if (domain.includes('notion') || domain.includes('airtable') || domain.includes('linear.app') ||
      domain.includes('trello') || domain.includes('asana') || domain.includes('clickup') ||
      domain.includes('monday.com') || domain.includes('vercel') || domain.includes('netlify') ||
      domain.includes('zapier') || domain.includes('make.com'))
    tags.push({ label: 'tool', type: 'tool' });

  if (domain.includes('amazon') || domain.includes('ebay') || domain.includes('etsy') ||
      domain.includes('producthunt') || domain.includes('shopify') || domain.includes('aliexpress') ||
      domain.includes('walmart'))
    tags.push({ label: 'product', type: 'product' });

  if (domain.includes('arxiv') || domain.includes('scholar.google') || domain.includes('researchgate') ||
      domain.includes('pubmed') || domain.includes('jstor') || domain.includes('semanticscholar'))
    tags.push({ label: 'research', type: 'research' });

  if (domain.includes('bbc') || domain.includes('cnn') || domain.includes('nytimes') ||
      domain.includes('theguardian') || domain.includes('techcrunch') || domain.includes('wired') ||
      domain.includes('theverge') || domain.includes('reuters') || domain.includes('apnews') ||
      domain.includes('bloomberg') || domain.includes('wsj') || domain.includes('ft.com') ||
      domain.includes('hacker') || domain.includes('ycombinator'))
    tags.push({ label: 'news', type: 'news' });

  // ── Title + description keyword-based ────────────────────────────────────────
  if (tl.includes('tutorial') || tl.includes('how to') || tl.includes('how-to') ||
      tl.includes('guide') || tl.includes('course') || tl.includes('learn') ||
      tl.includes('step by step') || tl.includes('beginner'))
    tags.push({ label: 'tutorial', type: 'tutorial' });

  if (/\bai\b/.test(tl) || /\bgpt\b/.test(tl) || tl.includes('machine learning') ||
      tl.includes('chatgpt') || tl.includes('claude') || tl.includes('llm') ||
      tl.includes('deep learning') || tl.includes('neural network') || tl.includes('generative'))
    tags.push({ label: 'ai', type: 'ai' });

  if (text.includes('recipe') || text.includes('ingredient') || text.includes('cook') ||
      text.includes('meal') || text.includes('dish') || text.includes('bake') ||
      text.includes('restaurant') || domain.includes('allrecipes') || domain.includes('tasty') ||
      domain.includes('foodnetwork') || domain.includes('epicurious') || domain.includes('delish'))
    tags.push({ label: 'food', type: 'food' });

  if (text.includes('travel') || text.includes('hotel') || text.includes('flight') ||
      text.includes('vacation') || text.includes('destination') || text.includes('itinerary') ||
      text.includes('backpack') || domain.includes('tripadvisor') || domain.includes('booking') ||
      domain.includes('airbnb') || domain.includes('expedia') || domain.includes('kayak'))
    tags.push({ label: 'travel', type: 'travel' });

  if (text.includes('invest') || text.includes('stock') || text.includes('crypto') ||
      text.includes('bitcoin') || text.includes('finance') || text.includes('trading') ||
      text.includes('portfolio') || text.includes('dividend') || text.includes('etf') ||
      domain.includes('coinbase') || domain.includes('binance') || domain.includes('robinhood'))
    tags.push({ label: 'finance', type: 'finance' });

  if (text.includes('fitness') || text.includes('workout') || text.includes('exercise') ||
      text.includes('nutrition') || text.includes('diet') || text.includes('yoga') ||
      text.includes('mental health') || text.includes('meditation') || text.includes('wellness') ||
      domain.includes('myfitnesspal') || domain.includes('strava') || domain.includes('healthline'))
    tags.push({ label: 'health', type: 'health' });

  return tags.slice(0, 4);
}
function getAiSummary(desc: string): string | null {
  if (!desc || desc.startsWith('Link saved from') || desc.length < 30) return null;
  return desc.length > 130 ? desc.slice(0, 127).trimEnd() + '…' : desc;
}
function getReadTime(desc: string): number {
  return Math.max(1, Math.ceil(desc.split(/\s+/).filter(Boolean).length / 200));
}

function Dropdown({ show, rect, onClose, onCopy, isCopied, onEdit, onCategory, onNotes, onDelete, hasNotes }: {
  show: boolean; rect: DOMRect | null; onClose: () => void;
  onCopy: (e: React.MouseEvent) => void; isCopied: boolean;
  onEdit: (e: React.MouseEvent) => void;
  onCategory: (e: React.MouseEvent) => void; onNotes: (e: React.MouseEvent) => void;
  onDelete: (e: React.MouseEvent) => void; hasNotes?: boolean;
}) {
  const { t } = useTheme();
  if (!show || !rect) return null;
  const row = 'w-full flex items-center gap-2.5 px-3 py-2 rounded-xl transition-colors text-left';
  const bg  = (isDelete = false) => ({
    onMouseEnter: (e: React.MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.background = isDelete ? 'rgba(239,68,68,0.08)' : t.dropdownHoverBg; },
    onMouseLeave: (e: React.MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.background = 'transparent'; },
  });
  return createPortal(
    <>
      <div className="fixed inset-0" style={{ zIndex: 298 }} onClick={onClose} />
      <div className="fixed w-48 rounded-2xl overflow-hidden"
        style={{ zIndex: 299, bottom: window.innerHeight - rect.top + 4, right: window.innerWidth - rect.right, background: t.dropdownBg, border: `1px solid ${t.dropdownBorder}`, boxShadow: t.dropdownShadow }}
        onClick={e => e.stopPropagation()}>
        <div className="p-1">
          <button onClick={onCopy} className={row} style={{ color: t.dropdownText }} {...bg()}>
            {isCopied ? <Check className="w-4 h-4 text-green-500" /> : <Link2 className="w-4 h-4" style={{ color: t.dropdownIcon }} />}
            <span className="text-[13px]">{isCopied ? 'Copied!' : 'Copy link'}</span>
          </button>
          <button onClick={onEdit} className={row} style={{ color: t.dropdownText }} {...bg()}>
            <Pencil className="w-4 h-4" style={{ color: t.dropdownIcon }} />
            <span className="text-[13px]">Edit content</span>
          </button>
          <button onClick={onCategory} className={row} style={{ color: t.dropdownText }} {...bg()}>
            <ChevronDown className="w-4 h-4" style={{ color: t.dropdownIcon }} />
            <span className="text-[13px]">Change Board</span>
          </button>
          <button onClick={onNotes} className={row} style={{ color: t.dropdownText }} {...bg()}>
            <FileText className="w-4 h-4" style={{ color: hasNotes ? '#3B82F6' : t.dropdownIcon }} />
            <span className="text-[13px]">{hasNotes ? 'Edit notes' : 'Add notes'}</span>
          </button>
          <div style={{ borderTop: `1px solid ${t.dropdownDivider}`, margin: '4px 0' }} />
          <button onClick={onDelete} className={row} {...bg(true)}>
            <Trash2 className="w-4 h-4" style={{ color: '#EF4444' }} />
            <span className="text-[13px]" style={{ color: '#EF4444' }}>Delete</span>
          </button>
        </div>
      </div>
    </>,
    document.body
  );
}

function AiTag({ label, type }: { label: string; type: string }) {
  const c = TAG_COLORS[type] ?? TAG_COLORS.default;
  return (
    <span className="text-[9px] px-1.5 py-0.5 rounded-full font-semibold"
      style={{ background: c.bg, border: `1px solid ${c.border}`, color: c.color }}>
      {type === 'category' ? label : `#${label}`}
    </span>
  );
}

export function LinkCard({
  link, onUpdateCategory, onDelete, onAddCategory, onRenameCategory, onUpdateNotes, onUpdateLink, onUpdateTags,
  onToggleSelect, onToggleFavorite, onShowUpgrade, onMoveCard, categories = [], suggestedTags = [], selectMode = false,
  isSelected = false, isFavorited = false, listMode = false, compact = false, isPro = false,
}: LinkCardProps) {
  const { t } = useTheme();
  const [showCategoryPopup, setShowCategoryPopup] = useState(false);
  const [isHovered, setIsHovered]   = useState(false);
  const [imgHovered, setImgHovered] = useState(false);
  const [isMuted, setIsMuted]       = useState(true);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [notesInput, setNotesInput] = useState(link.notes || '');
  const [isCopied, setIsCopied]     = useState(false);
  const [showMenu, setShowMenu]     = useState(false);
  const [menuRect, setMenuRect]     = useState<DOMRect | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editTitle, setEditTitle]   = useState(link.title);
  const [editDesc, setEditDesc]     = useState(link.description);
  const [editTags, setEditTags]     = useState<string[]>(link.tags ?? []);
  const [tagInput, setTagInput]     = useState('');
  const [listImgError, setListImgError] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const [{ isDragging }, dragRef] = useDrag({
    type: LINK_DRAG_TYPE,
    item: { id: link.id },
    collect: monitor => ({ isDragging: monitor.isDragging() }),
  });

  const [{ isOver }, dropRef] = useDrop<{ id: string }, void, { isOver: boolean }>({
    accept: LINK_DRAG_TYPE,
    drop(item) {
      if (item.id !== link.id) onMoveCard?.(item.id, link.id);
    },
    collect: monitor => ({ isOver: monitor.isOver() && monitor.canDrop() }),
  });

  const isMemo    = link.image === 'placeholder:memo';
  const isPdf     = link.image === 'placeholder:pdf';
  const ytId      = getYouTubeVideoId(link.url);
  const isYT      = ytId !== null;
  const isYTShort = link.url.includes('/shorts/');
  const vimeoId   = getVimeoVideoId(link.url);
  const isVimeo   = vimeoId !== null;
  const isVideo   = isYT || isVimeo || link.url.includes('dailymotion.com') || link.url.includes('twitch.tv') || link.category === 'Videos';
  const domain    = isMemo ? 'Note' : isPdf ? 'PDF' : (() => { try { return new URL(link.url).hostname.toLowerCase().replace('www.', ''); } catch { return ''; } })();
  const aiTags    = deriveAiTags(link, domain);
  const aiSummary = getAiSummary(link.description);
  const readTime  = getReadTime(link.description);
  const duration  = isYT && ytId ? fakeVideoDuration(ytId) : isVimeo && vimeoId ? fakeVideoDuration(vimeoId) : null;
  const isDefaultPlaceholder = link.image === 'placeholder:default';
  const isArticle = !isVideo && !isMemo && !isPdf && !isPlaceholder(link.image);


  const sp = (fn: () => void) => (e: React.MouseEvent) => { e.preventDefault(); e.stopPropagation(); fn(); };
  const handleCopyLink  = async (e: React.MouseEvent) => { e.preventDefault(); e.stopPropagation(); try { await navigator.clipboard.writeText(link.url); setIsCopied(true); setTimeout(() => setIsCopied(false), 2000); } catch {} setShowMenu(false); };
  const handleCatClick  = (e: React.MouseEvent) => { e.preventDefault(); e.stopPropagation(); setShowCategoryPopup(true); setShowMenu(false); };
  const handleDelClick  = (e: React.MouseEvent) => { e.preventDefault(); e.stopPropagation(); setShowMenu(false); if (onDelete && confirm('Delete this link?')) onDelete(link.id); };
  const handleNoteClick = (e: React.MouseEvent) => { e.preventDefault(); e.stopPropagation(); setShowMenu(false); setShowNotesModal(true); };
  const handleEditClick = (e: React.MouseEvent) => { e.preventDefault(); e.stopPropagation(); setEditTitle(link.title); setEditDesc(link.description); setEditTags(link.tags ?? []); setTagInput(''); setShowEditModal(true); setShowMenu(false); };
  const handleMenuTgl   = (e: React.MouseEvent) => { e.preventDefault(); e.stopPropagation(); const r = (e.currentTarget as HTMLElement).getBoundingClientRect(); setMenuRect(r); setShowMenu(p => !p); };
  const handleFav       = (e: React.MouseEvent) => { e.preventDefault(); e.stopPropagation(); onToggleFavorite?.(link.id); };
  const handleSel       = (e: React.MouseEvent) => { if (selectMode && onToggleSelect) { e.preventDefault(); onToggleSelect(link.id); } };

  const selectedBorder = isSelected && selectMode ? '#7C3AED' : undefined;

  const notesPortal = showNotesModal ? createPortal(
    <>
      <div className="fixed inset-0 backdrop-blur-sm" style={{ zIndex: 9998, background: t.modalBackdrop }} onClick={() => setShowNotesModal(false)} />
      <div className="fixed w-[500px] max-w-[90vw] p-6 rounded-2xl"
        style={{ zIndex: 9999, top: '50%', left: '50%', transform: 'translate(-50%,-50%)', background: t.modalBg, border: `1px solid ${t.modalBorder}`, boxShadow: t.modalShadow }}
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="w-3.5 h-3.5" style={{ color: '#7C3AED' }} />
          <h3 className="text-[15px] font-bold" style={{ color: t.modalTitle }}>Notes</h3>
        </div>
        <p className="text-[12px] mb-4 truncate" style={{ color: t.modalSubtitle }}>{link.title}</p>
        <textarea value={notesInput} onChange={e => setNotesInput(e.target.value)} placeholder="Add your notes here…"
          autoFocus
          className="w-full h-36 px-4 py-3 text-sm rounded-xl resize-none focus:outline-none transition-all"
          style={{ background: t.modalInputBg, border: `1px solid ${t.modalInputBorder}`, color: t.modalInputText, caretColor: '#7C3AED' }}
          onFocus={e => { e.currentTarget.style.borderColor = t.inputFocusBorder; e.currentTarget.style.boxShadow = t.inputFocusShadow; }}
          onBlur={e => { e.currentTarget.style.borderColor = t.modalInputBorder; e.currentTarget.style.boxShadow = 'none'; }} />
        <div className="flex gap-2 mt-4 justify-end">
          <button onClick={() => setShowNotesModal(false)} className="px-4 py-2 rounded-xl text-sm transition-colors"
            style={{ border: `1px solid ${t.modalInputBorder}`, color: t.textSecondary }}>Cancel</button>
          <button onClick={() => { onUpdateNotes?.(link.id, notesInput); setShowNotesModal(false); }}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-white hover:opacity-90"
            style={{ background: 'linear-gradient(135deg,#7C3AED,#4338CA)' }}>Save</button>
        </div>
      </div>
    </>,
    document.body
  ) : null;

  const editPortal = showEditModal ? createPortal(
    <>
      <div className="fixed inset-0 backdrop-blur-sm" style={{ zIndex: 9998, background: t.modalBackdrop }} onClick={() => setShowEditModal(false)} />
      <div className="fixed w-[500px] max-w-[90vw] p-6 rounded-2xl"
        style={{ zIndex: 9999, top: '50%', left: '50%', transform: 'translate(-50%,-50%)', background: t.modalBg, border: `1px solid ${t.modalBorder}`, boxShadow: t.modalShadow }}
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-2 mb-1">
          <Pencil className="w-3.5 h-3.5" style={{ color: '#7C3AED' }} />
          <h3 className="text-[15px] font-bold" style={{ color: t.modalTitle }}>Edit Content</h3>
        </div>
        <p className="text-[12px] mb-4 truncate" style={{ color: t.modalSubtitle }}>{link.url}</p>
        <div className="space-y-3">
          <div>
            <label className="text-[11px] font-semibold mb-1 block" style={{ color: t.textMuted }}>Title</label>
            <input value={editTitle} onChange={e => setEditTitle(e.target.value)}
              autoFocus
              className="w-full px-4 py-3 text-sm rounded-xl focus:outline-none transition-all"
              style={{ background: t.modalInputBg, border: `1px solid ${t.modalInputBorder}`, color: t.modalInputText }}
              onFocus={e => { e.currentTarget.style.borderColor = t.inputFocusBorder; e.currentTarget.style.boxShadow = t.inputFocusShadow; }}
              onBlur={e => { e.currentTarget.style.borderColor = t.modalInputBorder; e.currentTarget.style.boxShadow = 'none'; }} />
          </div>
          <div>
            <label className="text-[11px] font-semibold mb-1 block" style={{ color: t.textMuted }}>Description</label>
            <textarea value={editDesc} onChange={e => setEditDesc(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 text-sm rounded-xl resize-none focus:outline-none transition-all"
              style={{ background: t.modalInputBg, border: `1px solid ${t.modalInputBorder}`, color: t.modalInputText }}
              onFocus={e => { e.currentTarget.style.borderColor = t.inputFocusBorder; e.currentTarget.style.boxShadow = t.inputFocusShadow; }}
              onBlur={e => { e.currentTarget.style.borderColor = t.modalInputBorder; e.currentTarget.style.boxShadow = 'none'; }} />
          </div>
          <div>
            <label className="text-[11px] font-semibold mb-1 block" style={{ color: t.textMuted }}>Tags</label>
            {editTags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {editTags.map(tag => (
                  <span key={tag} className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-semibold"
                    style={{ background: 'rgba(20,184,166,0.10)', border: '1px solid rgba(20,184,166,0.22)', color: '#0D9488' }}>
                    #{tag}
                    <button onClick={() => setEditTags(p => p.filter(t => t !== tag))}
                      className="text-[10px] leading-none hover:opacity-60">×</button>
                  </span>
                ))}
              </div>
            )}
            <div className="relative">
              <input
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' || e.key === ',') {
                    e.preventDefault();
                    const val = tagInput.trim().toLowerCase().replace(/[^a-z0-9-]/g, '');
                    if (val && !editTags.includes(val)) setEditTags(p => [...p, val]);
                    setTagInput('');
                  } else if (e.key === 'Backspace' && !tagInput && editTags.length) {
                    setEditTags(p => p.slice(0, -1));
                  }
                }}
                placeholder="Type a tag and press Enter…"
                className="w-full px-3 py-2 text-sm rounded-xl focus:outline-none transition-all"
                style={{ background: t.modalInputBg, border: `1px solid ${t.modalInputBorder}`, color: t.modalInputText }}
                onFocus={e => { e.currentTarget.style.borderColor = t.inputFocusBorder; e.currentTarget.style.boxShadow = t.inputFocusShadow; }}
                onBlur={e => { e.currentTarget.style.borderColor = t.modalInputBorder; e.currentTarget.style.boxShadow = 'none'; }}
              />
              {(() => {
                const filtered = suggestedTags.filter(s =>
                  s.label.includes(tagInput.toLowerCase()) &&
                  !editTags.includes(s.label) &&
                  tagInput.length > 0
                );
                if (!filtered.length) return null;
                return (
                  <div className="absolute z-10 top-full left-0 right-0 mt-1 rounded-xl overflow-hidden"
                    style={{ background: t.dropdownBg, border: `1px solid ${t.dropdownBorder}`, boxShadow: t.dropdownShadow }}>
                    {filtered.map(({ label, type }) => {
                      const c = TAG_COLORS[type] ?? TAG_COLORS.default;
                      return (
                        <button key={label}
                          onMouseDown={e => e.preventDefault()}
                          onClick={() => { setEditTags(p => [...p, label]); setTagInput(''); }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors"
                          onMouseEnter={e => (e.currentTarget.style.background = t.dropdownHoverBg)}
                          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                          <span className="text-[9px] px-1.5 py-0.5 rounded-full font-semibold"
                            style={{ background: c.bg, border: `1px solid ${c.border}`, color: c.color }}>
                            #{label}
                          </span>
                          <span className="text-[12px]" style={{ color: t.dropdownText }}>{label}</span>
                        </button>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
        <div className="flex gap-2 mt-4 justify-end">
          <button onClick={() => setShowEditModal(false)} className="px-4 py-2 rounded-xl text-sm transition-colors"
            style={{ border: `1px solid ${t.modalInputBorder}`, color: t.textSecondary }}>Cancel</button>
          <button onClick={() => { onUpdateLink?.(link.id, editTitle.trim() || link.title, editDesc); onUpdateTags?.(link.id, editTags); setShowEditModal(false); }}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-white hover:opacity-90"
            style={{ background: 'linear-gradient(135deg,#7C3AED,#4338CA)' }}>Save</button>
        </div>
      </div>
    </>,
    document.body
  ) : null;

  const categoryPortal = showCategoryPopup ? createPortal(
    <CategoryPopup currentCategory={link.category} onClose={() => setShowCategoryPopup(false)}
      onSelectCategory={c => { onUpdateCategory?.(link.id, c); }} onAddCategory={onAddCategory}
      onRenameCategory={onRenameCategory} categories={categories} />,
    document.body
  ) : null;

  // ── List mode ──────────────────────────────────────────────────────────────
  if (listMode) {
    const href = selectMode || isMemo ? undefined : link.url;
    return (
      <div className="w-full flex items-center gap-3 p-3 rounded-2xl transition-all duration-200 group"
        style={{ background: t.cardBg, border: `1px solid ${selectedBorder ?? t.cardBorder}`, boxShadow: t.kanbanCardShadow }}
        onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 18px rgba(0,0,0,0.10)'; e.currentTarget.style.borderColor = selectedBorder ?? t.cardBorderHover; }}
        onMouseLeave={e => { e.currentTarget.style.boxShadow = t.kanbanCardShadow; e.currentTarget.style.borderColor = selectedBorder ?? t.cardBorder; }}>
        {selectMode && (
          <button onClick={() => onToggleSelect?.(link.id)} className="shrink-0">
            <div className="w-5 h-5 rounded-md flex items-center justify-center"
              style={{ background: isSelected ? '#7C3AED' : 'transparent', border: isSelected ? '2px solid #7C3AED' : `2px solid ${t.textFaint}` }}>
              {isSelected && <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
            </div>
          </button>
        )}
        {!isDefaultPlaceholder && (
          <a href={href} target={href ? '_blank' : undefined} rel={href ? 'noopener noreferrer' : undefined} className="shrink-0" onClick={handleSel}>
            {isPlaceholder(link.image)
              ? <PlatformPlaceholder
                  platform={getPlatformFromPlaceholder(link.image)}
                  className="w-14 h-14 rounded-xl"
                />
              : listImgError
                ? <PlatformPlaceholder
                    platform={detectPlatformFromUrl(link.url)}
                    className="w-14 h-14 rounded-xl"
                  />
                : <img src={link.image} alt={link.title} className="w-14 h-14 rounded-xl object-cover"
                    onError={() => setListImgError(true)} />}
          </a>
        )}
        <a href={href} target={href ? '_blank' : undefined} rel={href ? 'noopener noreferrer' : undefined} className="flex-1 min-w-0" onClick={handleSel}>
          <p className="text-[13px] font-semibold truncate" style={{ color: t.textPrimary }}>{link.title}</p>
          <p className="text-[11px] truncate mt-0.5" style={{ color: t.textMuted }}>{domain}</p>
          {aiSummary && <p className="text-[11px] truncate mt-0.5" style={{ color: t.textMuted }}>{aiSummary}</p>}
          {(aiTags.length > 0 || (link.tags ?? []).length > 0) && (
            <div className="flex items-center gap-1 flex-wrap mt-1">
              {aiTags.map(tag => <AiTag key={tag.label} label={tag.label} type={tag.type} />)}
              {(link.tags ?? []).map(tag => <AiTag key={`u:${tag}`} label={tag} type="user" />)}
            </div>
          )}
        </a>
        {isArticle && (
          <div className="hidden sm:flex items-center gap-1 shrink-0 mr-2">
            <Clock className="w-3 h-3" style={{ color: t.textFaint }} />
            <span className="text-[10px]" style={{ color: t.textMuted }}>{readTime}m</span>
          </div>
        )}
        <div className="flex items-center gap-0.5 shrink-0">
          <button onClick={handleFav} className="p-2 rounded-xl transition-colors"
            onMouseEnter={e => (e.currentTarget.style.background = t.hoverBg)}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
            <Heart className={`w-4 h-4 ${isFavorited ? 'fill-red-400 text-red-400' : ''}`} style={{ color: isFavorited ? undefined : t.iconAction }} />
          </button>
          <div className="relative">
            <button onClick={handleMenuTgl} className="p-2 rounded-xl transition-colors"
              onMouseEnter={e => (e.currentTarget.style.background = t.hoverBg)}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
              <MoreVertical className="w-4 h-4" style={{ color: t.iconMuted }} />
            </button>
          </div>
        </div>
        <Dropdown show={showMenu} rect={menuRect} onClose={() => setShowMenu(false)}
          onCopy={handleCopyLink} isCopied={isCopied} onEdit={handleEditClick}
          onCategory={handleCatClick} onNotes={handleNoteClick} onDelete={handleDelClick} hasNotes={!!link.notes} />
        {editPortal}
        {notesPortal}
        {categoryPortal}
      </div>
    );
  }

  // ── Card mode ──────────────────────────────────────────────────────────────
  const handleCardEnter = () => {
    setIsHovered(true);
    if (cardRef.current) {
      cardRef.current.style.transform = 'translateY(-3px) scale(1.005)';
      cardRef.current.style.boxShadow = selectedBorder
        ? `0 0 0 2px #7C3AED, ${t.cardShadowHover}`
        : t.cardShadowHover;
      cardRef.current.style.borderColor = selectedBorder ?? t.cardBorderHover;
    }
  };
  const handleCardLeave = () => {
    setIsHovered(false);
    if (cardRef.current) {
      cardRef.current.style.transform = 'translateY(0) scale(1)';
      cardRef.current.style.boxShadow = t.cardShadow;
      cardRef.current.style.borderColor = selectedBorder ?? t.cardBorder;
    }
  };

  return (
    <div ref={node => { (cardRef as React.MutableRefObject<HTMLDivElement | null>).current = node; dropRef(node); }}
      className={`group w-full rounded-2xl overflow-hidden transition-all duration-300 relative${compact ? ' flex flex-col h-full' : ''}`}
      style={{ background: t.cardBg, border: `1px solid ${isOver ? '#A259FF' : (selectedBorder ?? t.cardBorder)}`, boxShadow: isOver ? '0 0 0 2px #A259FF40' : t.cardShadow, opacity: isDragging ? 0.4 : 1 }}
      onMouseEnter={handleCardEnter} onMouseLeave={handleCardLeave}>

      {/* Thumbnail */}
      <a href={selectMode || isMemo ? undefined : link.url}
        target={selectMode || isMemo ? undefined : '_blank'}
        rel={selectMode || isMemo ? undefined : 'noopener noreferrer'}
        className={`block relative overflow-hidden rounded-t-2xl${compact ? ' h-36 shrink-0' : ''}`}
        onMouseEnter={() => setImgHovered(true)} onMouseLeave={() => setImgHovered(false)}
        onClick={handleSel}
        style={{ cursor: selectMode ? 'pointer' : isMemo ? 'default' : isArticle ? 'alias' : undefined }}>

        {isPlaceholder(link.image) ? (
          <PlatformPlaceholder platform={getPlatformFromPlaceholder(link.image)} domain={isMemo || isPdf ? undefined : domain}
            text={isMemo ? link.description : undefined}
            className={`w-full ${compact ? 'h-full object-cover' : isYTShort ? 'aspect-[9/16]' : isMemo ? '' : 'aspect-video'}`} />
        ) : (
          <img src={link.image} alt={link.title}
            className={`w-full block transition-transform duration-500 ${compact ? 'h-full object-cover' : isYTShort ? 'aspect-[9/16] object-cover' : isVideo ? 'aspect-video object-cover' : 'h-auto'} ${(isYT || isVimeo) && isHovered ? 'invisible' : ''}`}
            style={{ transform: imgHovered && !isVideo ? 'scale(1.04)' : 'scale(1)' }}
            onError={e => { const p = e.currentTarget.closest('a'); if (p) p.style.display = 'none'; }} />
        )}

        {isArticle && imgHovered && !selectMode && (
          <div className="absolute inset-0 flex items-end justify-end p-2 pointer-events-none">
            <div className="flex items-center gap-1 px-2 py-1 rounded-lg" style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)' }}>
              <ExternalLink className="w-2.5 h-2.5 text-white/80" />
              <span className="text-[10px] text-white/80 font-medium">Open</span>
            </div>
          </div>
        )}

        {isVideo && !isHovered && !selectMode && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-14 h-14 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(0,0,0,0.50)', backdropFilter: 'blur(12px)', border: '1.5px solid rgba(255,255,255,0.30)' }}>
              <Play className="w-5 h-5 text-white ml-0.5" fill="white" />
            </div>
            {duration && (
              <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md text-white text-[11px] font-semibold tabular-nums"
                style={{ background: 'rgba(0,0,0,0.70)', backdropFilter: 'blur(6px)' }}>
                {duration}
              </div>
            )}
          </div>
        )}

        {isYT && isHovered && (
          <iframe src={`https://www.youtube.com/embed/${ytId}?autoplay=1&mute=${isMuted ? '1' : '0'}&controls=0&loop=1&playlist=${ytId}`}
            className={`absolute inset-0 w-full h-full ${isYTShort ? 'aspect-[9/16]' : ''}`}
            allow="autoplay; encrypted-media" allowFullScreen />
        )}
        {isVimeo && isHovered && (
          <iframe src={`https://player.vimeo.com/video/${vimeoId}?autoplay=1&muted=${isMuted ? '1' : '0'}&loop=1&background=1`}
            className="absolute inset-0 w-full h-full" allow="autoplay; fullscreen; picture-in-picture" allowFullScreen />
        )}

        {(isYT || isVimeo) && isHovered && !selectMode && (
          <button onClick={sp(() => setIsMuted(p => !p))}
            className="absolute bottom-2 right-2 z-10 p-1.5 rounded-full transition-colors"
            style={{ background: 'rgba(0,0,0,0.60)', backdropFilter: 'blur(8px)' }}>
            {isMuted ? <VolumeX className="w-3.5 h-3.5 text-white" /> : <Volume2 className="w-3.5 h-3.5 text-white" />}
          </button>
        )}

        {selectMode && (
          <div className="absolute top-2.5 left-2.5 z-10">
            <div className="w-6 h-6 rounded-md flex items-center justify-center"
              style={{ background: isSelected ? '#7C3AED' : (t.isDark ? 'rgba(0,0,0,0.55)' : 'rgba(255,255,255,0.85)'), border: `2px solid ${isSelected ? '#7C3AED' : (t.isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.25)')}`, backdropFilter: 'blur(6px)' }}>
              {isSelected && <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
            </div>
          </div>
        )}
      </a>

      {/* Drag handle — always rendered so dragging works even without a thumbnail */}
      {!selectMode && (
        <div ref={dragRef}
          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-150 cursor-grab active:cursor-grabbing z-10 touch-none"
          onClick={e => e.preventDefault()}
          title="Drag to reorder or move to a board">
          <div className="flex items-center gap-1 px-1.5 py-1 rounded-lg" style={{ background: 'rgba(0,0,0,0.50)', backdropFilter: 'blur(8px)' }}>
            <GripVertical className="w-3 h-3 text-white/80" />
          </div>
        </div>
      )}

      {/* Info panel */}
      <div className={`px-3.5 pt-3 pb-3.5${compact ? ' flex-1 overflow-hidden' : ''}`}>
        {!isMemo && (
          <div className="flex items-center gap-1.5 mb-2">
            <img src={`https://www.google.com/s2/favicons?domain=${domain}&sz=32`} alt=""
              className="w-3.5 h-3.5 rounded-sm object-contain flex-shrink-0" style={{ opacity: 0.6 }}
              onError={e => { e.currentTarget.style.display = 'none'; }} />
            <span className="text-[10px] truncate flex-1" style={{ color: t.textMuted }}>{domain}</span>
            {link.notes && <FileText className="w-2.5 h-2.5 flex-shrink-0" style={{ color: '#3B82F6', opacity: 0.7 }} />}
            {isArticle && (
              <div className="flex items-center gap-1 shrink-0">
                <Clock className="w-2.5 h-2.5" style={{ color: t.textFaint }} />
                <span className="text-[9px] font-medium" style={{ color: t.textMuted }}>{readTime} min</span>
              </div>
            )}
            {isVideo && (
              <div className="flex items-center gap-1 shrink-0 px-1.5 py-0.5 rounded-md" style={{ background: t.badgeBg }}>
                <Play className="w-2 h-2" style={{ color: t.textMuted }} fill={t.textMuted} />
                <span className="text-[9px] font-medium" style={{ color: t.textMuted }}>Video</span>
              </div>
            )}
          </div>
        )}

        <a href={isMemo ? undefined : link.url} target={isMemo ? undefined : '_blank'} rel={isMemo ? undefined : 'noopener noreferrer'}>
          <p className="text-[13px] font-semibold line-clamp-2 leading-snug mb-2 transition-colors duration-150"
            style={{ color: t.textPrimary }}
            onMouseEnter={e => (e.currentTarget.style.color = '#7C3AED')}
            onMouseLeave={e => (e.currentTarget.style.color = t.textPrimary)}>
            {link.title}
          </p>
        </a>

        {!compact && link.notes && (
          <button onClick={handleNoteClick} className="w-full text-left mb-2.5 p-2.5 rounded-xl transition-opacity hover:opacity-80"
            style={{ background: 'rgba(251,191,36,0.10)', border: '1px solid rgba(251,191,36,0.28)' }}>
            <div className="flex items-center gap-1.5 mb-1">
              <FileText className="w-2.5 h-2.5 shrink-0" style={{ color: '#D97706' }} />
              <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: '#D97706' }}>My Note</span>
            </div>
            <p className="text-[11px] leading-relaxed line-clamp-3" style={{ color: t.textMuted }}>{link.notes}</p>
          </button>
        )}

        {!compact && isArticle && aiSummary && (
          <div className="mb-3 p-2.5 rounded-xl" style={{ background: t.aiSummaryBg, border: `1px solid ${t.aiSummaryBorder}` }}>
            <div className="flex items-center gap-1.5 mb-1.5">
              <Sparkles className="w-2.5 h-2.5 flex-shrink-0" style={{ color: '#7C3AED' }} />
              <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: t.aiSummaryLabel }}>AI Summary</span>
            </div>
            <p className="text-[11px] leading-relaxed line-clamp-2" style={{ color: t.aiSummaryText }}>{aiSummary}</p>
          </div>
        )}

        {!compact && isArticle && aiSummary && (
          <div className="flex items-center gap-1.5 mb-2.5 flex-wrap">
            <BookOpen className="w-2.5 h-2.5 shrink-0" style={{ color: '#60A5FA', opacity: 0.7 }} />
            <span className="text-[9px]" style={{ color: t.textMuted }}>Article · {readTime} min read</span>
          </div>
        )}

        <div className="flex items-center justify-between gap-2 mt-1.5">
          <div className="flex items-center gap-1 flex-wrap min-w-0">
            {aiTags.map(tag => <AiTag key={tag.label} label={tag.label} type={tag.type} />)}
            {(link.tags ?? []).map(tag => <AiTag key={`u:${tag}`} label={tag} type="user" />)}
          </div>
          <div className="flex items-center gap-0.5 shrink-0 opacity-100 xl:opacity-0 xl:group-hover:opacity-100 transition-opacity duration-150">
            <button onClick={handleFav} className="p-1.5 rounded-lg transition-colors"
              onMouseEnter={e => (e.currentTarget.style.background = t.hoverBg)}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
              <Heart className={`w-3.5 h-3.5 ${isFavorited ? 'fill-red-400 text-red-400' : ''}`} style={{ color: isFavorited ? undefined : t.iconAction }} />
            </button>
            <button onClick={handleCatClick} className="p-1.5 rounded-lg transition-colors"
              onMouseEnter={e => (e.currentTarget.style.background = t.hoverBg)}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
              <Tag className="w-3.5 h-3.5" style={{ color: t.iconAction }} />
            </button>
            <div className="relative">
              <button onClick={handleMenuTgl} className="p-1.5 rounded-lg transition-colors"
                onMouseEnter={e => (e.currentTarget.style.background = t.hoverBg)}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                <MoreVertical className="w-3.5 h-3.5" style={{ color: t.iconAction }} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <Dropdown show={showMenu} rect={menuRect} onClose={() => setShowMenu(false)}
        onCopy={handleCopyLink} isCopied={isCopied} onEdit={handleEditClick}
        onCategory={handleCatClick} onNotes={handleNoteClick} onDelete={handleDelClick} hasNotes={!!link.notes} />
      {editPortal}
      {notesPortal}
      {categoryPortal}
    </div>
  );
}
