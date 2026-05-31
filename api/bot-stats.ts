import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://mchikdltrcbovhdzdhhf.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const ADMIN_EMAILS = new Set(['michcopski@gmail.com', 'admin@saveboard.app']);
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type',
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  Object.entries(CORS).forEach(([k, v]) => res.setHeader(k, v));
  if (req.method === 'OPTIONS') return res.status(200).end();

  const token = (req.headers.authorization ?? '').replace('Bearer ', '');
  try {
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString());
    if (!ADMIN_EMAILS.has(payload.email ?? '')) return res.status(403).json({ error: 'Forbidden' });
  } catch { return res.status(401).json({ error: 'Unauthorized' }); }

  // Latest visit per bot + total count
  const { data } = await supabase
    .from('bot_visits')
    .select('bot_name, visited_at')
    .order('visited_at', { ascending: false });

  const botMap: Record<string, { lastSeen: string; count: number }> = {};
  for (const row of (data ?? [])) {
    if (!botMap[row.bot_name]) {
      botMap[row.bot_name] = { lastSeen: row.visited_at, count: 0 };
    }
    botMap[row.bot_name].count++;
  }

  const bots = ['ChatGPT', 'Claude', 'Gemini', 'Perplexity', 'Meta AI', 'Copilot'].map(name => ({
    name,
    lastSeen: botMap[name]?.lastSeen ?? null,
    count:    botMap[name]?.count    ?? 0,
  }));

  return res.status(200).json({ bots });
}
