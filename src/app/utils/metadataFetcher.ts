function extractYouTubeVideoId(url: string): string | null {
  const patterns = [
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]+)/,
    /youtube\.com\/watch\?v=([a-zA-Z0-9_-]+)/,
    /youtu\.be\/([a-zA-Z0-9_-]+)/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m?.[1]) return m[1];
  }
  return null;
}

function extractVimeoVideoId(url: string): string | null {
  const m = url.match(/vimeo\.com\/(?:.*\/)?(\d+)/);
  return m ? m[1] : null;
}

function getSmartTitle(url: string): string {
  try {
    const u = new URL(url);
    const hostname = u.hostname.replace('www.', '');
    const parts = u.pathname.split('/').filter(Boolean);
    if (parts.length > 0) {
      const last = parts[parts.length - 1].replace(/\.[^.]+$/, '').replace(/[_-]/g, ' ');
      if (last.length > 3 && !/^\d+$/.test(last)) {
        return last.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      }
    }
    return hostname;
  } catch {
    return 'Saved Link';
  }
}

function getDomainImage(hostname: string, url: string): string {
  if (hostname.includes('youtube.com') || hostname.includes('youtu.be')) {
    const videoId = extractYouTubeVideoId(url);
    return videoId ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` : 'placeholder:youtube';
  }
  if (hostname.includes('vimeo.com')) {
    const videoId = extractVimeoVideoId(url);
    return videoId ? `https://vumbnail.com/${videoId}.jpg` : 'placeholder:default';
  }
  if (hostname.includes('twitter.com') || hostname.includes('x.com')) return 'placeholder:twitter';
  if (hostname.includes('instagram.com')) return 'placeholder:instagram';
  if (hostname.includes('facebook.com') || hostname.includes('fb.com')) return 'placeholder:facebook';
  if (hostname.includes('tiktok.com')) return 'placeholder:tiktok';
  if (hostname.includes('linkedin.com')) return 'placeholder:linkedin';
  return 'placeholder:default';
}

export async function fetchMetadata(url: string): Promise<{ title: string; description: string; image: string }> {
  const urlObj = new URL(url);
  const hostname = urlObj.hostname.replace('www.', '');

  // ── 1. Our own serverless API (server-side fetch — no CORS, no rate limits) ──
  try {
    const apiUrl = `/api/metadata?url=${encodeURIComponent(url)}`;
    const res = await fetch(apiUrl, { signal: AbortSignal.timeout(10000) });
    if (res.ok) {
      const data = await res.json();
      if (data.title || data.description || data.image) {
        return {
          title: data.title || getSmartTitle(url),
          description: data.description || '',
          image: data.image || getDomainImage(hostname, url),
        };
      }
    }
  } catch { /* fall through */ }

  // ── 2. YouTube thumbnail fallback (always available via video ID) ──────────
  if (hostname.includes('youtube.com') || hostname.includes('youtu.be')) {
    const videoId = extractYouTubeVideoId(url);
    return {
      title: 'YouTube Video',
      description: 'View this video on YouTube',
      image: videoId ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` : 'placeholder:youtube',
    };
  }

  // ── 3. Vimeo oEmbed (public, no auth) ────────────────────────────────────
  if (hostname.includes('vimeo.com')) {
    try {
      const res = await fetch(`https://vimeo.com/api/oembed.json?url=${encodeURIComponent(url)}`, { signal: AbortSignal.timeout(5000) });
      if (res.ok) {
        const d = await res.json();
        return { title: d.title || 'Vimeo Video', description: d.description || '', image: d.thumbnail_url || 'placeholder:default' };
      }
    } catch { /* fall through */ }
    const videoId = extractVimeoVideoId(url);
    return { title: 'Vimeo Video', description: '', image: videoId ? `https://vumbnail.com/${videoId}.jpg` : 'placeholder:default' };
  }

  // ── 4. Microlink as last resort ───────────────────────────────────────────
  try {
    const res = await fetch(`https://api.microlink.io/?url=${encodeURIComponent(url)}`, { signal: AbortSignal.timeout(8000) });
    if (res.ok) {
      const data = await res.json();
      if (data.status === 'success' && data.data) {
        const d = data.data;
        return {
          title: d.title || getSmartTitle(url),
          description: d.description || '',
          image: d.image?.url || getDomainImage(hostname, url),
        };
      }
    }
  } catch { /* fall through */ }

  // ── 5. Smart fallback ─────────────────────────────────────────────────────
  return {
    title: getSmartTitle(url),
    description: '',
    image: getDomainImage(hostname, url),
  };
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}
