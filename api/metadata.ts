import type { VercelRequest, VercelResponse } from '@vercel/node';

const USER_AGENT =
  'Mozilla/5.0 (compatible; LinkBoard/1.0; +https://link-board-seven.vercel.app) AppleWebKit/537.36 Chrome/124.0 Safari/537.36';

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

function meta(html: string, ...attrs: string[]): string {
  for (const attr of attrs) {
    const m = html.match(
      new RegExp(`<meta[^>]+(?:property|name)=["']${attr}["'][^>]*content=["']([^"']+)["']`, 'i')
    ) || html.match(
      new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]*(?:property|name)=["']${attr}["']`, 'i')
    );
    if (m?.[1]) return m[1].trim();
  }
  return '';
}

function titleTag(html: string): string {
  const m = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  return m?.[1]?.trim() ?? '';
}

function makeAbsolute(src: string, base: string): string {
  if (!src) return '';
  if (src.startsWith('http')) return src;
  try { return new URL(src, base).href; } catch { return ''; }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers so the browser can call this from any origin
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const url = typeof req.query.url === 'string' ? req.query.url.trim() : '';
  if (!url) return res.status(400).json({ error: 'url param required' });

  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.replace('www.', '');

    // ── YouTube: thumbnail is always available via video ID ──────────
    if (hostname.includes('youtube.com') || hostname.includes('youtu.be')) {
      const videoId = extractYouTubeVideoId(url);
      const image = videoId
        ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
        : '';

      // Try to get the real title from YouTube's oembed (no auth needed)
      try {
        const oe = await fetch(
          `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`,
          { signal: AbortSignal.timeout(5000) }
        );
        if (oe.ok) {
          const d = await oe.json();
          return res.json({
            title: d.title || 'YouTube Video',
            description: `Video by ${d.author_name || 'YouTube'}`,
            image,
          });
        }
      } catch { /* fall through */ }

      return res.json({ title: 'YouTube Video', description: 'View on YouTube', image });
    }

    // ── Vimeo: oembed ─────────────────────────────────────────────────
    if (hostname.includes('vimeo.com')) {
      const oe = await fetch(
        `https://vimeo.com/api/oembed.json?url=${encodeURIComponent(url)}`,
        { signal: AbortSignal.timeout(5000) }
      );
      if (oe.ok) {
        const d = await oe.json();
        return res.json({
          title: d.title || 'Vimeo Video',
          description: d.description || `Video by ${d.author_name || 'Vimeo'}`,
          image: d.thumbnail_url || '',
        });
      }
      return res.json({ title: 'Vimeo Video', description: '', image: '' });
    }

    // ── General: fetch HTML server-side ──────────────────────────────
    const response = await fetch(url, {
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'text/html,application/xhtml+xml,*/*;q=0.9',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      redirect: 'follow',
      signal: AbortSignal.timeout(8000),
    });

    if (!response.ok) {
      return res.status(502).json({ error: `Upstream ${response.status}` });
    }

    // Only read first 100 KB — enough for <head> tags
    const reader = response.body?.getReader();
    let html = '';
    if (reader) {
      let bytes = 0;
      const decoder = new TextDecoder();
      while (bytes < 102_400) {
        const { done, value } = await reader.read();
        if (done) break;
        html += decoder.decode(value, { stream: true });
        bytes += value?.length ?? 0;
      }
      reader.cancel();
    } else {
      html = await response.text();
    }

    const title =
      meta(html, 'og:title', 'twitter:title') || titleTag(html) || hostname;
    const description =
      meta(html, 'og:description', 'twitter:description', 'description') || '';
    const rawImage =
      meta(html, 'og:image', 'twitter:image:src', 'twitter:image') || '';
    const image = makeAbsolute(rawImage, url);

    return res.json({ title, description, image });
  } catch (err: any) {
    return res.status(502).json({ error: err?.message ?? 'fetch failed' });
  }
}
