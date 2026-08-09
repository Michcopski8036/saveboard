import { useState, useEffect, useRef, useCallback } from 'react';
import { ExternalLink, Link2, RefreshCw, Clock, FileText, Heart, Tag, Trash2, Check, X, Folder, Play } from 'lucide-react';
import { CARD_STRIP_GRADIENT } from '../lib/brand';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { isPlaceholder, getPlatformFromPlaceholder, PlatformPlaceholder } from './PlatformPlaceholder';
import { RichTextEditor } from './RichTextEditor';
import { YouTubePlayer } from './YouTubePlayer';
import { getYouTubeId } from '../lib/youtube';
import { TAG_COLORS, deriveAiTags } from './LinkCard';
import type { LinkData } from './LinkCard';

interface GalleryViewProps {
  links: LinkData[];
  favorites: Set<string>;
  categories?: string[];
  onUpdateLink?: (id: string, title: string, description: string) => void;
  onUpdateTags?: (id: string, tags: string[]) => void;
  onToggleFavorite?: (id: string) => void;
  onUpdateCategory?: (id: string, category: string) => void;
  onDelete?: (id: string) => void;
}

function getDomain(link: LinkData): string {
  if (link.image === 'placeholder:memo') return 'Note';
  if (link.image === 'placeholder:pdf') return 'PDF';
  try { return new URL(link.url).hostname.replace('www.', ''); } catch { return ''; }
}
function getAiSummary(desc: string): string | null {
  if (!desc || desc.startsWith('Link saved from')) return null;
  const plain = desc.trimStart().startsWith('<') ? desc.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() : desc;
  if (plain.length < 30) return null;
  return plain.length > 120 ? plain.slice(0, 117).trimEnd() + '…' : plain;
}
function getReadTime(desc: string): number {
  return Math.max(1, Math.ceil(desc.split(/\s+/).filter(Boolean).length / 200));
}
function isVideoLink(link: LinkData): boolean {
  return /youtube\.com|youtu\.be|vimeo\.com|dailymotion\.com|twitch\.tv/.test(link.url) || link.category === 'Videos';
}

// Sites that hard-block iframes — show "open in new tab" immediately
const IFRAME_BLOCKED = [
  'twitter.com', 'x.com', 'facebook.com',
  'linkedin.com', 'tiktok.com', 'netflix.com', 'spotify.com',
];
function isIframeBlocked(url: string): boolean {
  try {
    const host = new URL(url).hostname.replace('www.', '');
    return IFRAME_BLOCKED.some(d => host === d || host.endsWith('.' + d));
  } catch { return false; }
}

// Sites we proxy server-side to bypass X-Frame-Options
const PROXY_HOSTS = ['medium.com'];
function needsProxy(url: string): boolean {
  try {
    const host = new URL(url).hostname.replace('www.', '');
    return PROXY_HOSTS.some(d => host === d || host.endsWith('.' + d));
  } catch { return false; }
}
function proxyUrl(url: string): string {
  return `/api/proxy?url=${encodeURIComponent(url)}`;
}

// Convert watch/share URLs to embeddable URLs
function getEmbedUrl(url: string): string {
  // YouTube
  const ytPatterns = [
    /youtube\.com\/watch\?v=([a-zA-Z0-9_-]+)/,
    /youtu\.be\/([a-zA-Z0-9_-]+)/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]+)/,
  ];
  for (const p of ytPatterns) {
    const m = url.match(p);
    if (m?.[1]) return `https://www.youtube.com/embed/${m[1]}?autoplay=0&playsinline=1`;
  }
  // Vimeo
  const vm = url.match(/vimeo\.com\/(?:.*\/)?(\d+)/);
  if (vm?.[1]) return `https://player.vimeo.com/video/${vm[1]}`;
  // Instagram Reels / Posts / IGTV
  const igReel = url.match(/instagram\.com\/reel\/([A-Za-z0-9_-]+)/);
  if (igReel?.[1]) return `https://www.instagram.com/reel/${igReel[1]}/embed/`;
  const igPost = url.match(/instagram\.com\/p\/([A-Za-z0-9_-]+)/);
  if (igPost?.[1]) return `https://www.instagram.com/p/${igPost[1]}/embed/`;
  const igTv = url.match(/instagram\.com\/tv\/([A-Za-z0-9_-]+)/);
  if (igTv?.[1]) return `https://www.instagram.com/tv/${igTv[1]}/embed/`;

  return url;
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

function GalleryCard({ link, isActive, onClick }: { link: LinkData; isActive: boolean; onClick: () => void }) {
  const { t } = useTheme();
  const { tr } = useLanguage();
  const dom       = getDomain(link);
  const isMemoCard = link.image === 'placeholder:memo';
  const isPdfCard  = link.image === 'placeholder:pdf';
  const vid        = isVideoLink(link);
  const aiTags     = deriveAiTags(link, dom);
  const summary    = getAiSummary(link.description);
  const readTime   = getReadTime(link.description);
  const isArticle  = !vid && !isMemoCard && !isPdfCard && !isPlaceholder(link.image);
  // Match LinkCard: generic placeholders and memos get the thin accent strip,
  // not a big gradient tile (memo text was getting cropped by the fixed-aspect
  // tile in this narrow column). PDF / file tiles carry meaning, so they stay.
  const isContentIcon = isPdfCard || link.image === 'placeholder:file';
  const noThumb    = !isContentIcon && isPlaceholder(link.image);
  // Memo body preview, flattened to plain text; skip a first line that just
  // repeats the title.
  const memoBody = isMemoCard ? (() => {
    const plain = (link.description ?? '').trimStart().startsWith('<')
      ? link.description.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
      : link.description.replace(/^\[sz:(sm|md|lg)\]/, '').trim();
    if (!plain) return '';
    const lines = plain.split('\n');
    return (lines[0].trim() === link.title.trim() ? lines.slice(1).join('\n') : plain).trim();
  })() : '';

  return (
    <button
      onClick={onClick}
      className="w-full text-left rounded-2xl overflow-hidden transition-all duration-200 group"
      style={{
        background: t.cardBg,
        border: `1.5px solid ${isActive ? '#7C3AED' : t.cardBorder}`,
        boxShadow: isActive
          ? '0 0 0 3px rgba(124,58,237,0.15), 0 4px 16px rgba(0,0,0,0.10)'
          : t.cardShadow,
      }}
      onMouseEnter={e => { if (!isActive) { e.currentTarget.style.boxShadow = t.cardShadowHover; e.currentTarget.style.borderColor = t.cardBorderHover; } }}
      onMouseLeave={e => { if (!isActive) { e.currentTarget.style.boxShadow = t.cardShadow; e.currentTarget.style.borderColor = t.cardBorder; } }}
    >
      {/* ── Thumbnail — text-only links get the thin accent strip instead ── */}
      {noThumb ? (
        <div className="w-full h-0.5" style={{ background: CARD_STRIP_GRADIENT }} />
      ) : (
      <div className="relative overflow-hidden rounded-t-2xl"
        style={{ background: t.emptyIconContainerBg }}>
        {isPlaceholder(link.image) ? (
          <PlatformPlaceholder
            platform={getPlatformFromPlaceholder(link.image)}
            domain={isMemoCard || isPdfCard ? undefined : dom}
            text={isMemoCard ? link.description : undefined}
            className="w-full aspect-[2/1]"
          />
        ) : (
          <img
            src={link.image}
            alt={link.title}
            className="w-full aspect-[2/1] object-cover block"
            onError={e => { (e.currentTarget.parentElement as HTMLElement).style.display = 'none'; }}
          />
        )}
        {vid && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(0,0,0,0.50)', backdropFilter: 'blur(8px)' }}>
              <Play className="w-3.5 h-3.5 text-white ml-0.5" fill="white" />
            </div>
          </div>
        )}
      </div>
      )}

      {/* ── Info ── */}
      <div className="px-3 pt-2 pb-2.5">
        {isMemoCard && (
          <div className="flex items-center gap-1 mb-1">
            <FileText className="w-2.5 h-2.5 flex-shrink-0" style={{ color: '#7C3AED', opacity: 0.75 }} />
            <span className="text-[8px] font-bold uppercase tracking-widest" style={{ color: '#7C3AED', opacity: 0.75 }}>Note</span>
          </div>
        )}
        {/* Domain row */}
        {!isMemoCard && (
          <div className="flex items-center gap-1 mb-1">
            <img
              src={`https://www.google.com/s2/favicons?domain=${dom}&sz=32`}
              alt=""
              className="w-3 h-3 rounded-sm object-contain flex-shrink-0"
              style={{ opacity: 0.6 }}
              onError={e => { e.currentTarget.style.display = 'none'; }}
            />
            <span className="text-[9px] truncate flex-1" style={{ color: t.textMuted }}>{dom}</span>
            {link.notes && <FileText className="w-2.5 h-2.5 flex-shrink-0" style={{ color: '#3B82F6', opacity: 0.7 }} />}
            {isArticle && (
              <div className="flex items-center gap-0.5 shrink-0">
                <Clock className="w-2.5 h-2.5" style={{ color: t.textFaint }} />
                <span className="text-[9px]" style={{ color: t.textMuted }}>{readTime}m</span>
              </div>
            )}
          </div>
        )}

        {/* Title */}
        <p className="text-[12px] font-semibold leading-snug line-clamp-2 mb-1.5"
          style={{ color: t.textPrimary }}>
          {link.title}
        </p>

        {/* Memo body preview */}
        {memoBody && (
          <p className="text-[10px] leading-relaxed line-clamp-2 mb-1.5" style={{ color: t.textMuted }}>
            {memoBody}
          </p>
        )}

        {/* Tags */}
        {(aiTags.length > 0 || (link.tags ?? []).length > 0) && (
          <div className="flex items-center gap-1 flex-wrap">
            {aiTags.map(tag => <AiTag key={tag.label} label={tag.label} type={tag.type} />)}
            {(link.tags ?? []).map(tag => <AiTag key={`u:${tag}`} label={tag} type="user" />)}
          </div>
        )}
      </div>
    </button>
  );
}

export function GalleryView({ links, favorites, categories = [], onUpdateLink, onUpdateTags, onToggleFavorite, onUpdateCategory, onDelete }: GalleryViewProps) {
  const { t } = useTheme();
  const { tr } = useLanguage();
  const [selected, setSelected] = useState<LinkData | null>(links[0] ?? null);
  const [iframeError, setIframeError] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);
  const [editTitle, setEditTitle] = useState(links[0]?.title ?? '');
  const [tagInput, setTagInput] = useState('');
  const [showCatMenu, setShowCatMenu] = useState(false);
  const [showTagInput, setShowTagInput] = useState(false);
  const tagInputRef = useRef<HTMLInputElement>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Tag icon kept for non-memo toolbar usage
  void Tag;

  useEffect(() => {
    const found = links.find(l => l.id === selected?.id) ?? links[0] ?? null;
    setSelected(found);
    setEditTitle(found?.title ?? '');
    setIframeError(false);
    setIframeKey(k => k + 1);
  }, [links]);

  const handleSelect = (link: LinkData) => {
    setSelected(link);
    setEditTitle(link.title);
    setIframeError(false);
    setIframeKey(k => k + 1);
    setShowCatMenu(false);
    setTagInput('');
  };

  const autoSave = useCallback((title: string, desc: string) => {
    if (!selected || !onUpdateLink) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => onUpdateLink(selected.id, title.trim() || selected.title, desc), 800);
  }, [selected, onUpdateLink]);

  const isMemo    = selected?.image === 'placeholder:memo';
  const isPdf     = selected?.image === 'placeholder:pdf';
  const isBlocked = selected ? isIframeBlocked(selected.url) : false;
  const isEmbeddable = selected && !isMemo && !isBlocked && selected.url !== '#';
  const isFav = selected ? favorites.has(selected.id) : false;

  return (
    <div className="flex flex-1 overflow-hidden rounded-2xl" style={{ border: `1px solid ${t.cardBorder}`, minHeight: 0 }}>

      {/* ── Left: card list ───────────────────────────────────────────── */}
      <div className="w-[14%] shrink-0 overflow-y-auto" style={{ borderRight: `1px solid ${t.cardBorder}`, background: t.pageBg, direction: 'rtl' }}>
        <div className="p-3 space-y-2" style={{ direction: 'ltr' }}>
          {links.map(link => (
            <GalleryCard
              key={link.id}
              link={link}
              isActive={selected?.id === link.id}
              onClick={() => handleSelect(link)}
            />
          ))}
        </div>
        {links.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full py-16 px-4 text-center">
            <Link2 className="w-8 h-8 mb-3" style={{ color: t.textFaint }} />
            <p className="text-[13px]" style={{ color: t.textMuted }}>{tr('noLinksHere')}</p>
          </div>
        )}
      </div>

      {/* ── Right: preview panel ──────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden" style={{ background: t.pageBg }}>

        {selected ? (
          <>
            {/* Toolbar */}
            <div className="flex items-center gap-2 px-4 py-2.5 shrink-0"
              style={{ borderBottom: `1px solid ${t.cardBorder}`, background: t.cardBg }}>
              <div className="flex-1 min-w-0">
                {isMemo
                  ? <input value={editTitle} onChange={e => { setEditTitle(e.target.value); autoSave(e.target.value, selected.description ?? ''); }}
                      className="w-full text-[14px] font-semibold bg-transparent focus:outline-none"
                      style={{ color: t.textPrimary }} />
                  : <>
                      <p className="text-[13px] font-semibold truncate" style={{ color: t.textPrimary }}>{selected.title}</p>
                      {selected.url !== '#' && <p className="text-[11px] truncate" style={{ color: t.textMuted }}>{selected.url}</p>}
                    </>
                }
              </div>
              <div className="flex items-center gap-0.5 shrink-0">
                {/* Favorite */}
                <button onClick={() => onToggleFavorite?.(selected.id)}
                  className="p-1.5 rounded-lg transition-colors" title={tr('favorite')}
                  style={{ color: isFav ? '#EF4444' : t.textMuted }}
                  onMouseEnter={e => { e.currentTarget.style.background = t.hoverBg; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
                  <Heart className={`w-4 h-4 ${isFav ? 'fill-red-400' : ''}`} />
                </button>

                {/* Move board */}
                {categories.length > 0 && (
                  <div className="relative">
                    <button onClick={() => { setShowCatMenu(v => !v); setShowTagInput(false); }}
                      className="p-1.5 rounded-lg transition-colors" title={tr('moveToBoard')}
                      style={{ color: t.textMuted }}
                      onMouseEnter={e => { e.currentTarget.style.background = t.hoverBg; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
                      <Folder className="w-4 h-4" />
                    </button>
                    {showCatMenu && (
                      <div className="absolute right-0 top-full mt-1 w-44 rounded-xl shadow-xl z-50 py-1 overflow-hidden"
                        style={{ background: t.modalBg, border: `1px solid ${t.modalBorder}` }}>
                        {['None', ...categories].map(cat => (
                          <button key={cat} onClick={() => { onUpdateCategory?.(selected.id, cat); setShowCatMenu(false); }}
                            className="w-full text-left px-3 py-1.5 text-[12px] transition-colors flex items-center gap-2"
                            style={{ color: selected.category === cat ? '#7C3AED' : t.textPrimary }}
                            onMouseEnter={e => { e.currentTarget.style.background = t.hoverBg; }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
                            {selected.category === cat && <Check className="w-3 h-3 text-violet-500" />}
                            {cat}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Reload (non-memo) */}
                {isEmbeddable && (
                  <button onClick={() => { setIframeError(false); setIframeKey(k => k + 1); }}
                    title={tr('reload')} className="p-1.5 rounded-lg transition-colors" style={{ color: t.textMuted }}
                    onMouseEnter={e => { e.currentTarget.style.background = t.hoverBg; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                )}

                {/* Open link */}
                {selected.url !== '#' && (
                  <a href={selected.url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold text-white transition-opacity hover:opacity-90 ml-1"
                    style={{ background: 'linear-gradient(135deg,#7C3AED,#6366F1)' }}>
                    <ExternalLink className="w-3 h-3" />Open
                  </a>
                )}

                {/* Delete */}
                <button onClick={() => { if (confirm('Delete this item?')) { onDelete?.(selected.id); } }}
                  className="p-1.5 rounded-lg transition-colors ml-1" title={tr('delete')}
                  style={{ color: t.textMuted }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; e.currentTarget.style.color = '#EF4444'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = t.textMuted; }}>
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Preview */}
            <div className="flex-1 overflow-y-auto flex flex-col" style={{ minHeight: 0 }}>
              {isMemo ? (
                <div className="flex-1 p-6 overflow-y-auto">
                  <div className="max-w-2xl mx-auto space-y-4">
                    <RichTextEditor
                      key={selected.id}
                      content={(selected.description ?? '').replace(/^\[sz:(sm|md|lg)\]/, '')}
                      onChange={desc => autoSave(editTitle, desc)}
                      placeholder={tr('writeMoreDetails')}
                    />

                    {/* Tags editor */}
                    <div>
                      <label className="text-[11px] font-semibold mb-1.5 block" style={{ color: t.textMuted }}>{tr('tagsLabel')}</label>
                      {(selected.tags ?? []).length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-2">
                          {(selected.tags ?? []).map(tag => (
                            <span key={tag} className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-semibold"
                              style={{ background: 'rgba(20,184,166,0.10)', border: '1px solid rgba(20,184,166,0.22)', color: '#0D9488' }}>
                              #{tag}
                              <button onClick={() => onUpdateTags?.(selected.id, (selected.tags ?? []).filter(t => t !== tag))}>
                                <X className="w-2.5 h-2.5 hover:opacity-60" />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                      <div className="relative">
                        <input ref={tagInputRef} value={tagInput} onChange={e => setTagInput(e.target.value)}
                          placeholder={tr('tagPlaceholder')}
                          className="w-full px-4 py-3 rounded-xl focus:outline-none transition-all text-[14px]"
                          style={{ background: t.modalInputBg, border: `1px solid ${t.modalInputBorder}`, color: t.modalInputText }}
                          onFocus={e => { e.currentTarget.style.borderColor = t.inputFocusBorder; e.currentTarget.style.boxShadow = t.inputFocusShadow; }}
                          onBlur={e => { e.currentTarget.style.borderColor = t.modalInputBorder; e.currentTarget.style.boxShadow = 'none'; }}
                          onKeyDown={e => {
                            if (e.key === 'Enter' && tagInput.trim()) {
                              const newTags = [...new Set([...(selected.tags ?? []), tagInput.trim()])];
                              onUpdateTags?.(selected.id, newTags);
                              setTagInput('');
                            }
                            if (e.key === 'Backspace' && !tagInput && (selected.tags ?? []).length > 0) {
                              onUpdateTags?.(selected.id, (selected.tags ?? []).slice(0, -1));
                            }
                          }} />
                      </div>
                    </div>
                  </div>
                </div>
              ) : isPdf ? (
                <iframe key={iframeKey} src={selected.url}
                  style={{ flex: 1, width: '100%', border: 'none', display: 'block', minHeight: 0 }}
                  title={selected.title} />
              ) : (isBlocked || iframeError) ? (
                <div className="flex-1 flex flex-col items-center justify-center gap-4 px-8 text-center">
                  <div className="w-16 h-16 rounded-2xl overflow-hidden flex items-center justify-center"
                    style={{ background: t.emptyIconContainerBg, border: `1px solid ${t.cardBorder}` }}>
                    {selected.image && !isPlaceholder(selected.image)
                      ? <img src={selected.image} alt="" className="w-full h-full object-cover" />
                      : <Link2 className="w-7 h-7" style={{ color: t.emptyIconColor }} />}
                  </div>
                  <div>
                    <p className="text-[15px] font-semibold mb-1" style={{ color: t.textPrimary }}>{selected.title}</p>
                    <p className="text-[13px]" style={{ color: t.textMuted }}>{tr('cantPreview')}</p>
                  </div>
                  <a href={selected.url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13px] font-semibold text-white transition-opacity hover:opacity-90"
                    style={{ background: 'linear-gradient(135deg,#7C3AED,#6366F1)' }}>
                    <ExternalLink className="w-4 h-4" />
                    Open in new tab
                  </a>
                </div>
              ) : /instagram\.com/.test(selected.url) ? (
                /* Instagram: natural size, centered, scrollable */
                <div style={{ flex: 1, overflowY: 'auto', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', padding: '16px' }}>
                  <iframe
                    key={iframeKey}
                    src={getEmbedUrl(selected.url)}
                    style={{ width: '400px', height: '700px', border: 'none', display: 'block', flexShrink: 0 }}
                    title={selected.title}
                    allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture; web-share"
                    onError={() => setIframeError(true)}
                    onLoad={e => {
                      try {
                        const frame = e.currentTarget as HTMLIFrameElement;
                        const doc = frame.contentDocument;
                        if (doc !== null && doc.body?.innerHTML === '') setIframeError(true);
                      } catch {}
                    }}
                  />
                </div>
              ) : (/youtube\.com|youtu\.be/.test(selected.url) && getYouTubeId(selected.url)) ? (
                /* YouTube: IFrame Player API — a bare <iframe> embed is rejected
                   ("Error 153") inside the iOS WKWebView; the API plays fine. */
                <div style={{ width: '100%', aspectRatio: '16/9' }}>
                  <YouTubePlayer videoId={getYouTubeId(selected.url)!} autoplay={false} muted={false} loop={false} controls className="w-full h-full" />
                </div>
              ) : /youtube\.com|youtu\.be|vimeo\.com/.test(selected.url) ? (
                /* Vimeo (and any YouTube URL we couldn't parse an id from): 16:9 iframe */
                <div style={{ width: '100%', aspectRatio: '16/9' }}>
                  <iframe
                    key={iframeKey}
                    src={getEmbedUrl(selected.url)}
                    style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
                    title={selected.title}
                    allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture; web-share"
                    onError={() => setIframeError(true)}
                    onLoad={e => {
                      try {
                        const frame = e.currentTarget as HTMLIFrameElement;
                        const doc = frame.contentDocument;
                        if (doc !== null && doc.body?.innerHTML === '') setIframeError(true);
                      } catch {}
                    }}
                  />
                </div>
              ) : needsProxy(selected.url) ? (
                /* Proxied sites (Medium etc): served through /api/proxy */
                <iframe
                  key={iframeKey}
                  src={proxyUrl(selected.url)}
                  style={{ flex: 1, width: '100%', border: 'none', display: 'block', minHeight: 0 }}
                  title={selected.title}
                  onError={() => setIframeError(true)}
                  onLoad={e => {
                    try {
                      const frame = e.currentTarget as HTMLIFrameElement;
                      const doc = frame.contentDocument;
                      if (doc !== null && doc.body?.innerHTML === '') setIframeError(true);
                    } catch {}
                  }}
                />
              ) : (
                /* Regular websites: fill full panel height */
                <iframe
                  key={iframeKey}
                  src={getEmbedUrl(selected.url)}
                  style={{ flex: 1, width: '100%', border: 'none', display: 'block', minHeight: 0 }}
                  title={selected.title}
                  allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                  onError={() => setIframeError(true)}
                  onLoad={e => {
                    try {
                      const frame = e.currentTarget as HTMLIFrameElement;
                      const doc = frame.contentDocument;
                      if (doc !== null && doc.body?.innerHTML === '') setIframeError(true);
                    } catch {}
                  }}
                />
              )}
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-3">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
              style={{ background: t.emptyIconContainerBg, border: `1px solid ${t.emptyIconContainerBorder}` }}>
              <Link2 className="w-6 h-6" style={{ color: t.emptyIconColor }} />
            </div>
            <p className="text-[14px] font-medium" style={{ color: t.textMuted }}>{tr('openLinkHere')}</p>
          </div>
        )}
      </div>
    </div>
  );
}
