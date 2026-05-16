import type { CSSProperties } from 'react';
import { useTheme } from '../context/ThemeContext';

type Platform = 'instagram' | 'youtube' | 'twitter' | 'facebook' | 'tiktok' | 'linkedin' | 'pdf' | 'memo' | 'file' | 'default';

interface PlatformPlaceholderProps {
  platform: Platform;
  domain?: string;
  text?: string;
  className?: string;
}

const PLATFORM_CONFIG: Record<Platform, { gradient: string; gloss: string }> = {
  pdf: {
    gradient: 'linear-gradient(135deg, #E53E3E 0%, #C53030 100%)',
    gloss: 'rgba(255,255,255,0.14)',
  },
  file: {
    gradient: 'linear-gradient(135deg, #4A5568 0%, #2D3748 100%)',
    gloss: 'rgba(255,255,255,0.12)',
  },
  memo: {
    gradient: '#F5F3FF',
    gloss: 'rgba(124,58,237,0.04)',
  },
  instagram: {
    gradient: 'linear-gradient(135deg, #833AB4 0%, #FD1D1D 50%, #F77737 100%)',
    gloss: 'rgba(255,255,255,0.18)',
  },
  youtube: {
    gradient: 'linear-gradient(135deg, #FF0000 0%, #CC0000 100%)',
    gloss: 'rgba(255,255,255,0.15)',
  },
  twitter: {
    gradient: 'linear-gradient(135deg, #14171A 0%, #2C3E50 100%)',
    gloss: 'rgba(255,255,255,0.12)',
  },
  facebook: {
    gradient: 'linear-gradient(135deg, #1877F2 0%, #0C5FD4 100%)',
    gloss: 'rgba(255,255,255,0.18)',
  },
  tiktok: {
    gradient: 'linear-gradient(135deg, #010101 0%, #1a1a2e 100%)',
    gloss: 'rgba(255,255,255,0.10)',
  },
  linkedin: {
    gradient: 'linear-gradient(135deg, #0A66C2 0%, #004182 100%)',
    gloss: 'rgba(255,255,255,0.16)',
  },
  default: {
    gradient: 'linear-gradient(135deg, #A259FF 0%, #667eea 60%, #764ba2 100%)',
    gloss: 'rgba(255,255,255,0.15)',
  },
};

const shadow: CSSProperties = { filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.35))' };

const BrandLogo = ({ platform, text }: { platform: Platform; text?: string }) => {
  switch (platform) {
    case 'pdf':
      return (
        <svg style={shadow} width="56" height="56" viewBox="0 0 24 24" fill="white">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8" stroke="white" strokeWidth="1.5" fill="none"/>
          <line x1="9" y1="13" x2="15" y2="13" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5"/>
          <line x1="9" y1="17" x2="15" y2="17" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5"/>
        </svg>
      );
    case 'file':
      return (
        <svg style={shadow} width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
        </svg>
      );
    case 'memo':
      return (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none"
          stroke="rgba(124,58,237,0.55)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
          <line x1="8" y1="13" x2="16" y2="13"/>
          <line x1="8" y1="17" x2="12" y2="17"/>
        </svg>
      );
    case 'facebook':
      return (
        <svg style={shadow} width="64" height="64" viewBox="0 0 24 24" fill="white">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      );
    case 'instagram':
      return (
        <svg style={shadow} width="64" height="64" viewBox="0 0 24 24" fill="white">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" />
        </svg>
      );
    case 'youtube':
      return (
        <svg style={shadow} width="64" height="64" viewBox="0 0 24 24" fill="white">
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
        </svg>
      );
    case 'twitter':
      return (
        <svg style={shadow} width="60" height="60" viewBox="0 0 24 24" fill="white">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      );
    case 'tiktok':
      return (
        <svg style={shadow} width="58" height="58" viewBox="0 0 24 24" fill="white">
          <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
        </svg>
      );
    case 'linkedin':
      return (
        <svg style={shadow} width="60" height="60" viewBox="0 0 24 24" fill="white">
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
        </svg>
      );
    default:
      return (
        <svg style={shadow} width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
        </svg>
      );
  }
};

export function PlatformPlaceholder({ platform, domain, text, className = '' }: PlatformPlaceholderProps) {
  const { t } = useTheme();
  const isMemo = platform === 'memo';
  const config = isMemo
    ? { gradient: t.memoBg, gloss: t.memoGloss }
    : (PLATFORM_CONFIG[platform] ?? PLATFORM_CONFIG.default);

  return (
    <div
      className={`relative overflow-hidden ${isMemo ? '' : 'flex items-center justify-center'} ${className}`}
      style={{ background: config.gradient, ...(isMemo ? { minHeight: '100px' } : {}) }}
    >
      <div
        className="absolute inset-x-0 top-0 h-1/2 pointer-events-none"
        style={{ background: `linear-gradient(to bottom, ${config.gloss}, transparent)` }}
      />
      {isMemo
        ? text ? (
          <div style={{ padding: '20px', width: '100%' }}>
            <p style={{ fontSize: '15px', fontWeight: 600, lineHeight: '1.6', color: t.memoText, whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", sans-serif' }}>
              {text}
            </p>
          </div>
        ) : (
          <div className="flex items-center justify-center w-full h-full">
            <BrandLogo platform="memo" />
          </div>
        )
        : <BrandLogo platform={platform} text={text} />
      }
      {platform === 'default' && domain && (
        <span className="absolute bottom-3 text-white/60 text-xs tracking-wide">{domain}</span>
      )}
    </div>
  );
}

export function generatePlaceholderDataUrl(platform: Platform): string {
  return `placeholder:${platform}`;
}

export function isPlaceholder(imageUrl: string): boolean {
  return imageUrl.startsWith('placeholder:');
}

export type { Platform };
export function getPlatformFromPlaceholder(imageUrl: string): Platform {
  if (!isPlaceholder(imageUrl)) return 'default';
  return (imageUrl.replace('placeholder:', '') as Platform) ?? 'default';
}

export function detectPlatformFromUrl(url: string): Platform {
  try {
    const hostname = new URL(url).hostname.replace('www.', '');
    if (hostname.includes('instagram.com')) return 'instagram';
    if (hostname.includes('youtube.com') || hostname.includes('youtu.be')) return 'youtube';
    if (hostname.includes('twitter.com') || hostname.includes('x.com')) return 'twitter';
    if (hostname.includes('facebook.com') || hostname.includes('fb.com')) return 'facebook';
    if (hostname.includes('tiktok.com')) return 'tiktok';
    if (hostname.includes('linkedin.com')) return 'linkedin';
  } catch {
    // ignore invalid URLs
  }
  return 'default';
}
