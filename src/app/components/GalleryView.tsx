import { useState, useEffect } from 'react';
import { ExternalLink, Link2, RefreshCw, Sparkles, Play, Clock, FileText } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { isPlaceholder, getPlatformFromPlaceholder, PlatformPlaceholder } from './PlatformPlaceholder';
import { TAG_COLORS, deriveAiTags } from './LinkCard';
import type { LinkData } from './LinkCard';

interface GalleryViewProps {
  links: LinkData[];
  favorites: Set<string>;
}

function getDomain(link: LinkData): string {
  if (link.image === 'placeholder:memo') return 'Note';
  if (link.image === 'placeholder:pdf') return 'PDF';
  try { return new URL(link.url).hostname.replace('www.', ''); } catch { return ''; }
}
function getAiSummary(desc: string): string | null {
  if (!desc || desc.startsWith('Link saved from') || desc.length < 30) return null;
  return desc.length > 120 ? desc.slice(0, 117).trimEnd() + '…' : desc;
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
    if (m?.[1]) return `https://www.youtube.com/embed/${m[1]}?autoplay=0`;
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
  const dom       = getDomain(link);
  const isMemoCard = link.image === 'placeholder:memo';
  const isPdfCard  = link.image === 'placeholder:pdf';
  const vid        = isVideoLink(link);
  const aiTags     = deriveAiTags(link, dom);
  const summary    = getAiSummary(link.description);
  const readTime   = getReadTime(link.description);
  const isArticle  = !vid && !isMemoCard && !isPdfCard && !isPlaceholder(link.image);

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
      {/* ── Thumbnail ── */}
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

      {/* ── Info ── */}
      <div className="px-3 pt-2 pb-2.5">
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

export function GalleryView({ links, favorites }: GalleryViewProps) {
  const { t } = useTheme();
  const [selected, setSelected] = useState<LinkData | null>(links[0] ?? null);
  const [iframeError, setIframeError] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);

  useEffect(() => {
    setSelected(links[0] ?? null);
    setIframeError(false);
    setIframeKey(k => k + 1);
  }, [links]);

  const handleSelect = (link: LinkData) => {
    setSelected(link);
    setIframeError(false);
    setIframeKey(k => k + 1);
  };

  const isMemo    = selected?.image === 'placeholder:memo';
  const isPdf     = selected?.image === 'placeholder:pdf';
  const isBlocked = selected ? isIframeBlocked(selected.url) : false;
  const isEmbeddable = selected && !isMemo && !isBlocked && selected.url !== '#';

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
            <p className="text-[13px]" style={{ color: t.textMuted }}>No links here yet</p>
          </div>
        )}
      </div>

      {/* ── Right: preview panel ──────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden" style={{ background: t.pageBg }}>

        {selected ? (
          <>
            {/* Toolbar */}
            <div className="flex items-center gap-3 px-4 py-3 shrink-0"
              style={{ borderBottom: `1px solid ${t.cardBorder}`, background: t.cardBg }}>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold truncate" style={{ color: t.textPrimary }}>{selected.title}</p>
                {!isMemo && selected.url !== '#' && (
                  <p className="text-[11px] truncate" style={{ color: t.textMuted }}>{selected.url}</p>
                )}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {isEmbeddable && (
                  <button
                    onClick={() => { setIframeError(false); setIframeKey(k => k + 1); }}
                    title="Reload"
                    className="p-1.5 rounded-lg transition-colors"
                    style={{ color: t.textMuted }}
                    onMouseEnter={e => { e.currentTarget.style.background = t.hoverBg; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                )}
                {selected.url !== '#' && (
                  <a href={selected.url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold text-white transition-opacity hover:opacity-90"
                    style={{ background: 'linear-gradient(135deg,#7C3AED,#6366F1)' }}>
                    <ExternalLink className="w-3 h-3" />
                    Open
                  </a>
                )}
              </div>
            </div>

            {/* Preview */}
            <div className="flex-1 overflow-y-auto flex flex-col" style={{ minHeight: 0 }}>
              {isMemo ? (
                <div className="flex-1 flex items-center justify-center p-8">
                  <div className="max-w-lg w-full rounded-2xl p-6"
                    style={{ background: t.cardBg, border: `1px solid ${t.cardBorder}` }}>
                    <p className="text-[13px] font-semibold mb-3" style={{ color: t.textMuted }}>Note</p>
                    <p className="text-[15px] leading-relaxed whitespace-pre-wrap" style={{ color: t.textPrimary }}>{selected.description}</p>
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
                    <p className="text-[13px]" style={{ color: t.textMuted }}>This site can't be previewed here.</p>
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
              ) : /youtube\.com|youtu\.be|vimeo\.com/.test(selected.url) ? (
                /* YouTube / Vimeo: 16:9 aspect ratio */
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
            <p className="text-[14px] font-medium" style={{ color: t.textMuted }}>Open link here</p>
          </div>
        )}
      </div>
    </div>
  );
}
