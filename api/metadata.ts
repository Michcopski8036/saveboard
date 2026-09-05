import type { VercelRequest, VercelResponse } from '@vercel/node';
import { lookup } from 'node:dns/promises';

const USER_AGENT =
  'Mozilla/5.0 (compatible; LinkBoard/1.0; +https://link-board-seven.vercel.app) AppleWebKit/537.36 Chrome/124.0 Safari/537.36';

// ── SSRF guard ───────────────────────────────────────────────────────────────
// This endpoint fetches an arbitrary user-supplied URL server-side, so without
// filtering it can be pointed at internal services: the cloud metadata endpoint
// (169.254.169.254), localhost, or private-network hosts. We block private /
// reserved IPs, resolve the hostname and re-check every address it maps to, and
// follow redirects manually so a public URL can't 302 into a private one.
function isIpLiteral(host: string): boolean {
  return host.includes(':') || /^\d{1,3}(\.\d{1,3}){3}$/.test(host);
}

function isBlockedIp(ip: string): boolean {
  const mapped = ip.match(/^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/i); // IPv4-mapped IPv6
  if (mapped) ip = mapped[1];

  if (ip.includes(':')) {
    const l = ip.toLowerCase();
    return (
      l === '::1' || l === '::' ||
      l.startsWith('fc') || l.startsWith('fd') ||                                 // ULA fc00::/7
      l.startsWith('fe8') || l.startsWith('fe9') || l.startsWith('fea') || l.startsWith('feb') // link-local fe80::/10
    );
  }

  const p = ip.split('.').map(Number);
  if (p.length !== 4 || p.some(n => Number.isNaN(n) || n < 0 || n > 255)) return true; // malformed → block
  const [a, b] = p;
  return (
    a === 0 || a === 127 || a === 10 ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 169 && b === 254) ||           // link-local, incl. 169.254.169.254 metadata
    (a === 100 && b >= 64 && b <= 127) || // CGNAT 100.64.0.0/10
    a >= 224                               // multicast + reserved
  );
}

async function assertPublicUrl(u: string): Promise<void> {
  const parsed = new URL(u);
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') throw new Error('blocked protocol');

  const host = parsed.hostname.replace(/^\[|\]$/g, ''); // strip IPv6 brackets
  if (isIpLiteral(host)) {
    if (isBlockedIp(host)) throw new Error('blocked address');
    return;
  }

  const lower = host.toLowerCase();
  if (lower === 'localhost' || lower.endsWith('.localhost') || lower.endsWith('.local') || lower.endsWith('.internal')) {
    throw new Error('blocked host');
  }

  const addrs = await lookup(host, { all: true });
  if (!addrs.length) throw new Error('unresolvable host');
  for (const a of addrs) if (isBlockedIp(a.address)) throw new Error('blocked address');
}

// Fetch that validates the SSRF guard on every hop (redirect: 'manual').
async function safeFetch(startUrl: string, headers: Record<string, string>): Promise<Response> {
  let current = startUrl;
  for (let i = 0; i < 5; i++) {
    await assertPublicUrl(current);
    const resp = await fetch(current, { headers, redirect: 'manual', signal: AbortSignal.timeout(8000) });
    if (resp.status >= 300 && resp.status < 400) {
      const loc = resp.headers.get('location');
      if (!loc) return resp;
      current = new URL(loc, current).toString();
      continue;
    }
    return resp;
  }
  throw new Error('too many redirects');
}

// og:title / og:description are plain text — strip any tags so scraped content
// can never reach the client's HTML renderer as markup.
function stripTags(s: string): string {
  return s.replace(/<[^>]*>/g, '').trim();
}

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

    // ── TikTok: oembed ────────────────────────────────────────────────
    // 틱톡은 공유 시 vt.tiktok.com/<코드> 단축 링크를 주고, 그 페이지는 OG 태그를
    // 봇에게 내주지 않는다. 그래서 예전에는 제목이 URL 마지막 조각("ZSqND4WPj")이 되고
    // 이미지가 아예 없었다. oEmbed 는 인증 없이 제목·작성자·썸네일을 주고, 단축 링크를
    // 그대로 넣어도 풀어서 답한다 — YouTube·Vimeo 와 같은 처리를 붙인다.
    if (hostname.includes('tiktok.com')) {
      try {
        const oe = await fetch(
          `https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`,
          { signal: AbortSignal.timeout(5000) }
        );
        if (oe.ok) {
          const d = await oe.json();
          if (d.title || d.thumbnail_url) {
            return res.json({
              title: d.title || 'TikTok',
              description: d.author_name ? `Video by ${d.author_name}` : '',
              image: d.thumbnail_url || '',
            });
          }
        }
      } catch { /* 아래 일반 경로로 떨어진다 */ }
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

    // ── General: fetch HTML server-side (SSRF-guarded, per-hop validated) ──
    const response = await safeFetch(url, {
      'User-Agent': USER_AGENT,
      'Accept': 'text/html,application/xhtml+xml,*/*;q=0.9',
      'Accept-Language': 'en-US,en;q=0.9',
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
      stripTags(meta(html, 'og:title', 'twitter:title') || titleTag(html) || hostname);
    const description =
      stripTags(meta(html, 'og:description', 'twitter:description', 'description') || '');
    const rawImage =
      meta(html, 'og:image', 'twitter:image:src', 'twitter:image') || '';
    const image = makeAbsolute(rawImage, url);

    return res.json({ title, description, image });
  } catch (err: any) {
    return res.status(502).json({ error: err?.message ?? 'fetch failed' });
  }
}
