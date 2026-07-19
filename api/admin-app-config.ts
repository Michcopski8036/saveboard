import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { adminEmailFromToken } from './_admins';

const SUPABASE_URL = 'https://mchikdltrcbovhdzdhhf.supabase.co';

const supabase = createClient(SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY!);

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type',
};

const PLATFORMS = new Set(['ios', 'android']);
// Dotted numeric versions only — the gate compares these segment by segment.
const VERSION_RE = /^\d+(\.\d+){0,3}$/;

const cmp = (a: string, b: string) => {
  const pa = a.split('.').map(Number), pb = b.split('.').map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const d = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (d) return d;
  }
  return 0;
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  Object.entries(CORS).forEach(([k, v]) => res.setHeader(k, v));
  if (req.method === 'OPTIONS') return res.status(200).end();

  const actor = adminEmailFromToken(req.headers.authorization);
  if (!actor) return res.status(403).json({ error: 'Forbidden' });

  if (req.method === 'GET') {
    const { data, error } = await supabase.from('app_config').select('*').order('platform');
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ config: data ?? [] });
  }

  if (req.method === 'POST') {
    const { platform, latest_version, min_version, store_url } =
      req.body as { platform: string; latest_version: string; min_version: string; store_url: string };

    if (!PLATFORMS.has(platform)) return res.status(400).json({ error: 'platform must be ios or android' });
    if (!VERSION_RE.test(latest_version ?? '')) return res.status(400).json({ error: 'latest_version must look like 1.0.10' });
    if (!VERSION_RE.test(min_version ?? ''))    return res.status(400).json({ error: 'min_version must look like 1.0.10' });
    // min_version above latest would hard-block every user, including those on the newest build.
    if (cmp(min_version, latest_version) > 0)   return res.status(400).json({ error: 'min_version cannot be higher than latest_version' });
    if (!/^https:\/\//.test(store_url ?? ''))   return res.status(400).json({ error: 'store_url must be https' });

    const { error } = await supabase.from('app_config').upsert({
      platform, latest_version, min_version, store_url, updated_at: new Date().toISOString(),
    }, { onConflict: 'platform' });
    if (error) return res.status(500).json({ error: error.message });

    console.log(`[admin-app-config] ${actor} set ${platform} latest=${latest_version} min=${min_version}`);
    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
