import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL  = 'https://mchikdltrcbovhdzdhhf.supabase.co';
const ADMIN_EMAILS  = new Set(['michcopski@gmail.com', 'admin@saveboard.app']);

const supabase = createClient(SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY!);

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type',
};

const PLAN_DEFAULTS: Record<string, Record<string, string>> = {
  pro_monthly: { plan: 'pro', billing_cycle: 'monthly', saves_limit: '300',       boards_limit: '30',        file_size_limit: '20MB', storage_limit: '2GB',  status: 'active' },
  pro_yearly:  { plan: 'pro', billing_cycle: 'yearly',  saves_limit: '300',       boards_limit: '30',        file_size_limit: '20MB', storage_limit: '2GB',  status: 'active' },
  team:        { plan: 'team', billing_cycle: 'monthly', saves_limit: 'unlimited', boards_limit: 'unlimited', file_size_limit: '50MB', storage_limit: '10GB', status: 'active' },
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  Object.entries(CORS).forEach(([k, v]) => res.setHeader(k, v));
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const token = (req.headers.authorization ?? '').replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
  if (authErr || !user || !ADMIN_EMAILS.has(user.email ?? '')) return res.status(403).json({ error: 'Forbidden' });

  const { userId, planKey } = req.body as { userId: string; planKey: string };
  if (!userId || !planKey) return res.status(400).json({ error: 'userId and planKey required' });

  if (planKey === 'free') {
    const { error } = await supabase.from('subscriptions').delete().eq('user_id', userId);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ success: true, plan: 'free' });
  }

  const defaults = PLAN_DEFAULTS[planKey];
  if (!defaults) return res.status(400).json({ error: `Unknown planKey: ${planKey}` });

  const { error } = await supabase.from('subscriptions').upsert({
    user_id: userId,
    ...defaults,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id' });

  if (error) return res.status(500).json({ error: error.message });
  return res.status(200).json({ success: true, plan: defaults.plan, billing_cycle: defaults.billing_cycle });
}
