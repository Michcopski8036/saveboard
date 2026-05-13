import type { VercelRequest, VercelResponse } from '@vercel/node';

const ALLOWED_HOSTS = ['medium.com'];

function isAllowed(url: string): boolean {
  try {
    const host = new URL(url).hostname.replace('www.', '');
    return ALLOWED_HOSTS.some(h => host === h || host.endsWith('.' + h));
  } catch { return false; }
}

// Convert Medium URL to AMP version (static HTML, no SPA routing)
function toAmpUrl(url: string): string {
  try {
    const u = new URL(url);
    // Already AMP
    if (u.pathname.startsWith('/amp/')) return url;
    // Insert /amp/ after the hostname
    u.pathname = '/amp' + u.pathname;
    return u.toString();
  } catch { return url; }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { url } = req.query;
  if (typeof url !== 'string' || !isAllowed(url)) {
    return res.status(400).send('Not allowed');
  }

  const fetchUrl = toAmpUrl(url);

  try {
    const response = await fetch(fetchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });

    if (!response.ok) {
      return res.status(response.status).send(`Upstream error: ${response.status}`);
    }

    let html = await response.text();
    const base = new URL(fetchUrl).origin;

    // Inject base tag + minimal styles to make AMP page readable
    const inject = `
      <base href="${base}/">
      <style>
        body { max-width: 760px; margin: 0 auto; padding: 24px; font-family: -apple-system, Georgia, serif; }
        img { max-width: 100%; height: auto; }
        figure { margin: 0; }
      </style>
    `;
    html = html.replace(/<head([^>]*)>/i, `<head$1>${inject}`);

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 's-maxage=300');
    res.status(200).send(html);
  } catch {
    res.status(502).send('Proxy fetch failed');
  }
}
