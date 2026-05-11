import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { MoreVertical, Link2, Check, FileText, ChevronDown, Volume2, VolumeX, Heart, Tag, Trash2, Sparkles, Clock, Play, BookOpen, ExternalLink } from 'lucide-react';
import { CategoryPopup } from './CategoryPopup';
import { PlatformPlaceholder, isPlaceholder, getPlatformFromPlaceholder } from './PlatformPlaceholder';
import { useTheme } from '../context/ThemeContext';

export interface LinkData {
  id: string; url: string; title: string; description: string;
  image: string; category: string; savedAt: Date; comments?: string[]; notes?: string;
}

interface LinkCardProps {
  link: LinkData;
  onUpdateCategory?: (linkId: string, newCategory: string) => void;
  onDelete?: (linkId: string) => void;
  onAddCategory?: (category: string) => void;
  onRenameCategory?: (oldName: string, newName: string) => void;
  onUpdateNotes?: (linkId: string, notes: string) => void;
  onToggleSelect?: (linkId: string) => void;
  onToggleFavorite?: (linkId: string) => void;
  categories?: string[];
  selectMode?: boolean; isSelected?: boolean; isFavorited?: boolean; listMode?: boolean;
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
function deriveAiTags(link: LinkData, domain: string): string[] {
  const tags = new Set<string>();
  if (link.category && link.category !== 'None' && link.category !== 'Archive') tags.add(link.category);
  if (domain.includes('github') || domain.includes('gitlab')) tags.add('code');
  if (domain.includes('medium') || domain.includes('substack') || domain.includes('dev.to')) tags.add('article');
  if (domain.includes('youtube') || domain.includes('vimeo')) tags.add('video');
  if (domain.includes('twitter') || domain.includes('x.com') || domain.includes('instagram')) tags.add('social');
  if (domain.includes('figma') || domain.includes('dribbble') || domain.includes('behance')) tags.add('design');
  const t = link.title.toLowerCase();
  if (t.includes('tutorial') || t.includes('how to') || t.includes('guide')) tags.add('tutorial');
  if (t.includes('ai') || t.includes('gpt') || t.includes('machine learning')) tags.add('AI');
  return [...tags].slice(0, 3);
}
function getAiSummary(desc: string): string | null {
  if (!desc || desc.startsWith('Link saved from') || desc.length < 30) return null;
  return desc.length > 130 ? desc.slice(0, 127).trimEnd() + '…' : desc;
}
function getReadTime(desc: string): number {
  return Math.max(1, Math.ceil(desc.split(/\s+/).filter(Boolean).length / 200));
}

function Dropdown({ show, onCopy, isCopied, onCategory, onNotes, onDelete, hasNotes }: {
  show: boolean; onCopy: (e: React.MouseEvent) => void; isCopied: boolean;
  onCategory: (e: React.MouseEvent) => void; onNotes: (e: React.MouseEvent) => void;
  onDelete: (e: React.MouseEvent) => void; hasNotes?: boolean;
}) {
  const { t } = useTheme();
  if (!show) return null;
  const row = 'w-full flex items-center gap-2.5 px-3 py-2 rounded-xl transition-colors text-left';
  const bg  = (isDelete = false) => ({
    onMouseEnter: (e: React.MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.background = isDelete ? 'rgba(239,68,68,0.08)' : t.dropdownHoverBg; },
    onMouseLeave: (e: React.MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.background = 'transparent'; },
  });
  return (
    <div className="absolute right-0 bottom-full mb-1 z-[60] w-44 overflow-hidden rounded-2xl"
      style={{ background: t.dropdownBg, border: `1px solid ${t.dropdownBorder}`, boxShadow: t.dropdownShadow }}>
      <div className="p-1">
        <button onClick={onCopy} className={row} style={{ color: t.dropdownText }} {...bg()}>
          {isCopied ? <Check className="w-4 h-4 text-green-500" /> : <Link2 className="w-4 h-4" style={{ color: t.dropdownIcon }} />}
          <span className="text-[13px]">{isCopied ? 'Copied!' : 'Copy link'}</span>
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
  );
}

function AiTag({ label }: { label: string }) {
  const { t } = useTheme();
  return (
    <span className="text-[9px] px-1.5 py-0.5 rounded-full font-medium"
      style={{ background: t.aiTagBg, border: `1px solid ${t.aiTagBorder}`, color: t.aiTagText }}>
      {label}
    </span>
  );
}

export function LinkCard({
  link, onUpdateCategory, onDelete, onAddCategory, onRenameCategory, onUpdateNotes,
  onToggleSelect, onToggleFavorite, categories = [], selectMode = false,
  isSelected = false, isFavorited = false, listMode = false,
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
  const menuRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const isMemo    = link.image === 'placeholder:memo';
  const isPdf     = link.image === 'placeholder:pdf';
  const ytId      = getYouTubeVideoId(link.url);
  const isYT      = ytId !== null;
  const isYTShort = link.url.includes('/shorts/');
  const vimeoId   = getVimeoVideoId(link.url);
  const isVimeo   = vimeoId !== null;
  const isVideo   = isYT || isVimeo || link.url.includes('dailymotion.com') || link.url.includes('twitch.tv') || link.category === 'Videos';
  const domain    = isMemo ? 'Note' : isPdf ? 'PDF' : (() => { try { return new URL(link.url).hostname.replace('www.', ''); } catch { return ''; } })();
  const aiTags    = deriveAiTags(link, domain);
  const aiSummary = getAiSummary(link.description);
  const readTime  = getReadTime(link.description);
  const duration  = isYT && ytId ? fakeVideoDuration(ytId) : isVimeo && vimeoId ? fakeVideoDuration(vimeoId) : null;
  const isArticle = !isVideo && !isMemo && !isPdf && !isPlaceholder(link.image);

  useEffect(() => {
    const fn = (e: MouseEvent) => { if (menuRef.current && !menuRef.current.contains(e.target as Node)) setShowMenu(false); };
    if (showMenu) document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, [showMenu]);

  const sp = (fn: () => void) => (e: React.MouseEvent) => { e.preventDefault(); e.stopPropagation(); fn(); };
  const handleCopyLink  = async (e: React.MouseEvent) => { e.preventDefault(); e.stopPropagation(); try { await navigator.clipboard.writeText(link.url); setIsCopied(true); setTimeout(() => setIsCopied(false), 2000); } catch {} setShowMenu(false); };
  const handleCatClick  = (e: React.MouseEvent) => { e.preventDefault(); e.stopPropagation(); setShowCategoryPopup(true); setShowMenu(false); };
  const handleDelClick  = (e: React.MouseEvent) => { e.preventDefault(); e.stopPropagation(); setShowMenu(false); if (onDelete && confirm('Delete this link?')) onDelete(link.id); };
  const handleNoteClick = (e: React.MouseEvent) => { e.preventDefault(); e.stopPropagation(); setShowNotesModal(true); setShowMenu(false); };
  const handleMenuTgl   = (e: React.MouseEvent) => { e.preventDefault(); e.stopPropagation(); setShowMenu(p => !p); };
  const handleFav       = (e: React.MouseEvent) => { e.preventDefault(); e.stopPropagation(); onToggleFavorite?.(link.id); };
  const handleSel       = (e: React.MouseEvent) => { if (selectMode && onToggleSelect) { e.preventDefault(); onToggleSelect(link.id); } };

  const selectedBorder = isSelected && selectMode ? '#7C3AED' : undefined;

  const Modals = () => (
    <>
      {showCategoryPopup && createPortal(
        <CategoryPopup currentCategory={link.category} onClose={() => setShowCategoryPopup(false)}
          onSelectCategory={c => { onUpdateCategory?.(link.id, c); }} onAddCategory={onAddCategory}
          onRenameCategory={onRenameCategory} categories={categories} />,
        document.body
      )}
      {showNotesModal && createPortal(
        <>
          <div className="fixed inset-0 z-50 backdrop-blur-sm" style={{ background: t.modalBackdrop }} onClick={() => setShowNotesModal(false)} />
          <div className="fixed z-50 w-[500px] max-w-[90vw] p-6 rounded-2xl"
            style={{ top: '50%', left: '50%', transform: 'translate(-50%,-50%)', background: t.modalBg, border: `1px solid ${t.modalBorder}`, boxShadow: t.modalShadow }}
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-3.5 h-3.5" style={{ color: '#7C3AED' }} />
              <h3 className="text-[15px] font-bold" style={{ color: t.modalTitle }}>Notes</h3>
            </div>
            <p className="text-[12px] mb-4 truncate" style={{ color: t.modalSubtitle }}>{link.title}</p>
            <textarea value={notesInput} onChange={e => setNotesInput(e.target.value)} placeholder="Add your notes here…"
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
      )}
    </>
  );

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
        <a href={href} target={href ? '_blank' : undefined} rel={href ? 'noopener noreferrer' : undefined} className="shrink-0" onClick={handleSel}>
          {isPlaceholder(link.image)
            ? <PlatformPlaceholder platform={getPlatformFromPlaceholder(link.image)} text={isMemo ? link.description : undefined} className="w-14 h-14 rounded-xl" />
            : <img src={link.image} alt={link.title} crossOrigin="anonymous" className="w-14 h-14 rounded-xl object-cover" />}
        </a>
        <a href={href} target={href ? '_blank' : undefined} rel={href ? 'noopener noreferrer' : undefined} className="flex-1 min-w-0" onClick={handleSel}>
          <p className="text-[13px] font-semibold truncate" style={{ color: t.textPrimary }}>{link.title}</p>
          <p className="text-[11px] truncate mt-0.5" style={{ color: t.textMuted }}>{domain}</p>
          {aiSummary && <p className="text-[11px] truncate mt-0.5" style={{ color: t.textMuted }}>{aiSummary}</p>}
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
          <div className="relative" ref={menuRef}>
            <button onClick={handleMenuTgl} className="p-2 rounded-xl transition-colors"
              onMouseEnter={e => (e.currentTarget.style.background = t.hoverBg)}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
              <MoreVertical className="w-4 h-4" style={{ color: t.iconMuted }} />
            </button>
            <Dropdown show={showMenu} onCopy={handleCopyLink} isCopied={isCopied}
              onCategory={handleCatClick} onNotes={handleNoteClick} onDelete={handleDelClick} hasNotes={!!link.notes} />
          </div>
        </div>
        <Modals />
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
    <div ref={cardRef} className="group w-full rounded-2xl overflow-hidden transition-all duration-300"
      style={{ background: t.cardBg, border: `1px solid ${selectedBorder ?? t.cardBorder}`, boxShadow: t.cardShadow }}
      onMouseEnter={handleCardEnter} onMouseLeave={handleCardLeave}>

      {/* Thumbnail */}
      <a href={selectMode || isMemo ? undefined : link.url}
        target={selectMode || isMemo ? undefined : '_blank'}
        rel={selectMode || isMemo ? undefined : 'noopener noreferrer'}
        className="block relative overflow-hidden"
        onMouseEnter={() => setImgHovered(true)} onMouseLeave={() => setImgHovered(false)}
        onClick={handleSel}
        style={{ cursor: selectMode ? 'pointer' : isMemo ? 'default' : isArticle ? 'alias' : undefined }}>

        {isPlaceholder(link.image) ? (
          <PlatformPlaceholder platform={getPlatformFromPlaceholder(link.image)} domain={isMemo || isPdf ? undefined : domain}
            text={isMemo ? link.description : undefined}
            className={`w-full ${isYTShort ? 'aspect-[9/16]' : isVideo ? 'aspect-video' : isMemo ? '' : 'aspect-[4/3]'}`} />
        ) : (
          <img src={link.image} alt={link.title} crossOrigin="anonymous"
            className={`w-full block transition-transform duration-500 ${isYTShort ? 'aspect-[9/16] object-cover' : isVideo ? 'aspect-video object-cover' : 'h-auto'} ${(isYT || isVimeo) && isHovered ? 'invisible' : ''}`}
            style={{ transform: imgHovered && !isVideo ? 'scale(1.04)' : 'scale(1)' }} />
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

      {/* Info panel */}
      <div className="px-3.5 pt-3 pb-3.5">
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

        {isArticle && aiSummary && (
          <div className="mb-3 p-2.5 rounded-xl" style={{ background: t.aiSummaryBg, border: `1px solid ${t.aiSummaryBorder}` }}>
            <div className="flex items-center gap-1.5 mb-1.5">
              <Sparkles className="w-2.5 h-2.5 flex-shrink-0" style={{ color: '#7C3AED' }} />
              <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: t.aiSummaryLabel }}>AI Summary</span>
            </div>
            <p className="text-[11px] leading-relaxed line-clamp-2" style={{ color: t.aiSummaryText }}>{aiSummary}</p>
          </div>
        )}

        {isArticle && aiSummary && (
          <div className="flex items-center gap-1.5 mb-2.5 flex-wrap">
            <BookOpen className="w-2.5 h-2.5 shrink-0" style={{ color: '#60A5FA', opacity: 0.7 }} />
            <span className="text-[9px]" style={{ color: t.textMuted }}>Article · {readTime} min read</span>
          </div>
        )}

        <div className="flex items-center justify-between gap-2 mt-1.5">
          <div className="flex items-center gap-1 flex-wrap min-w-0">
            {aiTags.map(tag => <AiTag key={tag} label={tag} />)}
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
            <div className="relative" ref={menuRef}>
              <button onClick={handleMenuTgl} className="p-1.5 rounded-lg transition-colors"
                onMouseEnter={e => (e.currentTarget.style.background = t.hoverBg)}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                <MoreVertical className="w-3.5 h-3.5" style={{ color: t.iconAction }} />
              </button>
              <Dropdown show={showMenu} onCopy={handleCopyLink} isCopied={isCopied}
                onCategory={handleCatClick} onNotes={handleNoteClick} onDelete={handleDelClick} hasNotes={!!link.notes} />
            </div>
          </div>
        </div>
      </div>

      <Modals />
    </div>
  );
}
