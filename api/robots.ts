import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://mchikdltrcbovhdzdhhf.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const BOTS: Array<{ name: string; patterns: string[] }> = [
  { name: 'ChatGPT',   patterns: ['GPTBot', 'ChatGPT-User', 'OAI-SearchBot'] },
  { name: 'Claude',    patterns: ['ClaudeBot', 'Claude-Web', 'anthropic-ai'] },
  { name: 'Gemini',    patterns: ['Google-Extended', 'Googlebot-Image'] },
  { name: 'Perplexity',patterns: ['PerplexityBot'] },
  { name: 'Meta AI',   patterns: ['Meta-ExternalAgent', 'FacebookBot'] },
  { name: 'Copilot',   patterns: ['Bingbot', 'BingPreview'] },
  { name: 'Yandex',    patterns: ['YandexBot'] },
  { name: 'Amazonbot', patterns: ['Amazonbot'] },
];

const ROBOTS_CONTENT = `User-agent: *
Allow: /

Sitemap: https://www.saveboard.app/sitemap.xml`;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const ua = (req.headers['user-agent'] ?? '') as string;

  // Detect and log AI/search bot
  const matched = BOTS.find(b => b.patterns.some(p => ua.includes(p)));
  if (matched) {
    // Fire and forget — don't block response
    supabase.from('bot_visits').insert({
      bot_name: matched.name,
      user_agent: ua.slice(0, 500),
      path: '/robots.txt',
    }).then(() => {}, () => {});
  }

  // No caching: the bot-detection insert above needs to run on every request,
  // not just once per cache window. robots.txt is a fixed ~60-byte string —
  // there's no real cost to skipping the CDN cache here.
  res.setHeader('Content-Type', 'text/plain');
  res.setHeader('Cache-Control', 'no-store');
  return res.status(200).send(ROBOTS_CONTENT);
}
