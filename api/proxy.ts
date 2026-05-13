import type { VercelRequest, VercelResponse } from '@vercel/node';

const ALLOWED_HOSTS = ['medium.com'];

function isAllowed(url: string): boolean {
  try {
    const host = new URL(url).hostname.replace('www.', '');
    return ALLOWED_HOSTS.some(h => host === h || host.endsWith('.' + h));
  } catch { return false; }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { url } = req.query;
  if (typeof url !== 'string' || !isAllowed(url)) {
    return res.status(400).send('Not allowed');
  }

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });

    let html = await response.text();
    const base = new URL(url).origin;

    // Inject base tag so all relative paths resolve against Medium's origin
    html = html.replace(/<head([^>]*)>/i, `<head$1><base href="${base}/">`);

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 's-maxage=300');
    res.status(200).send(html);
  } catch {
    res.status(502).send('Proxy fetch failed');
  }
}
