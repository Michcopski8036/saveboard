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

// 만료되는 CDN에 걸린 썸네일을 우리 스토리지로 옮기기 위한 이미지 통로.
//
// 왜 필요한가: 인스타그램·틱톡 등은 OG 이미지를 **서명된 임시 URL**로 준다. 저장 직후에는
// 카드에 잘 보이지만 며칠 뒤 그 주소가 죽고, 카드가 빈 상자가 된다. 링크는 남아 있는데
// 그림만 사라지는 것이라, 오래 쓴 사람일수록 더 많이 겪는다 — 비주얼 북마크에서 가장
// 나쁜 실패다. 그래서 저장 시점에 이미지를 받아 우리 버킷에 복사한다.
//
// 브라우저에서 그 CDN을 직접 부르면 CORS에 막히므로 서버가 대신 받아 넘긴다.
// ⚠️ 새 파일을 만들지 않고 이 함수에 얹은 이유: Vercel 서버리스 함수가 정확히 12개로
//    상한에 걸려 있다. 13번째 파일은 **배포 전체를 실패시키고 prod는 이전 빌드를 계속
//    서빙한다**(메모리 vercel_api_gotchas). 새 엔드포인트가 필요하면 이렇게 얹을 것.
const IMAGE_HOSTS = [
  'cdninstagram.com', 'fbcdn.net',      // Instagram / Facebook
  'tiktokcdn.com', 'tiktokcdn-us.com',  // TikTok
  'twimg.com',                          // X (Twitter)
];
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

function isAllowedImage(url: string): boolean {
  try {
    const u = new URL(url);
    if (u.protocol !== 'https:') return false;
    const host = u.hostname.replace('www.', '');
    return IMAGE_HOSTS.some(h => host === h || host.endsWith('.' + h));
  } catch { return false; }
}

async function proxyImage(url: string, res: VercelResponse) {
  const upstream = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36' },
    signal: AbortSignal.timeout(10000),
  });
  if (!upstream.ok) return res.status(upstream.status).send('Upstream error');

  const type = upstream.headers.get('content-type') || '';
  // 이미지가 아니면 넘기지 않는다 — 이 통로가 임의 콘텐츠 릴레이가 되면 안 된다.
  if (!type.startsWith('image/')) return res.status(415).send('Not an image');

  const buf = Buffer.from(await upstream.arrayBuffer());
  if (buf.byteLength > MAX_IMAGE_BYTES) return res.status(413).send('Image too large');

  res.setHeader('Content-Type', type);
  res.setHeader('Cache-Control', 'public, max-age=86400');
  return res.status(200).send(buf);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { url, mode } = req.query;

  // ?mode=image — 만료되는 소셜 CDN 썸네일만 통과시킨다.
  if (mode === 'image') {
    if (typeof url !== 'string' || !isAllowedImage(url)) {
      return res.status(400).send('Not allowed');
    }
    try { return await proxyImage(url, res); }
    catch { return res.status(502).send('Fetch failed'); }
  }

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
