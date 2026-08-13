import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const supabase = createClient(
  'https://mchikdltrcbovhdzdhhf.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const SITE = 'https://www.saveboard.app';

// Shown verbatim to old cached bundles (they alert() the server's error string),
// so it must be a plain, actionable instruction. Localised by Accept-Language.
function reauthMsg(req: VercelRequest): string {
  return String(req.headers['accept-language'] || '').toLowerCase().startsWith('ko')
    ? '앱이 업데이트됐어요. 페이지를 새로고침한 뒤 다시 시도해 주세요.'
    : 'We just updated the app — please refresh the page and try again.';
}

const ALLOWED_ORIGINS = [
  'https://www.saveboard.app',
  'capacitor://localhost',  // iOS native app
  'http://localhost',       // Android native app
  'http://localhost:5173',
  'http://localhost:3000',
];

function setCors(req: VercelRequest, res: VercelResponse) {
  const origin = req.headers.origin ?? '';
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  res.setHeader('Access-Control-Allow-Origin', allowed);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCors(req, res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { userId } = req.body as { userId: string };
  if (!userId) return res.status(400).json({ error: 'Missing userId' });

  // Authenticate the caller and confirm the portal is for their OWN account —
  // without this, anyone with a user_id could open someone else's billing portal
  // (view payment method, cancel subscription).
  // Missing/expired token → 401 so the client refreshes the session and retries;
  // a valid token for a *different* user → 403 (a real mismatch, not re-auth).
  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (!token) return res.status(401).json({ error: reauthMsg(req) });
  const { data: authData, error: authErr } = await supabase.auth.getUser(token);
  if (authErr || !authData.user) return res.status(401).json({ error: reauthMsg(req) });
  if (authData.user.id !== userId) return res.status(403).json({ error: 'Forbidden' });

  try {
    const { data } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', userId)
      .maybeSingle();

    if (!data?.stripe_customer_id) {
      return res.status(404).json({ error: 'No subscription found' });
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: data.stripe_customer_id,
      return_url: `${SITE}/`,
    });

    return res.json({ url: session.url });
  } catch (err: any) {
    console.error('Portal error:', err);
    return res.status(500).json({ error: err.message });
  }
}
