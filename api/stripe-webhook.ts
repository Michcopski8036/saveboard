import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const supabase = createClient(
  'https://mchikdltrcbovhdzdhhf.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const config = { api: { bodyParser: false } };

async function getRawBody(req: VercelRequest): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

async function upsertSubscription(sub: Stripe.Subscription) {
  const userId = sub.metadata?.supabase_user_id;
  if (!userId) { console.warn(`Subscription ${sub.id} has no supabase_user_id metadata — skipping`); return; }

  const item = sub.items.data[0];

  // Fetch product to read metadata (plan_type, billing_cycle, saves_limit, etc.)
  let productMeta: Record<string, string> = {};
  try {
    const priceId = item?.price?.id;
    if (priceId) {
      const price = await stripe.prices.retrieve(priceId, { expand: ['product'] });
      const product = price.product as Stripe.Product;
      productMeta = product.metadata ?? {};
    }
  } catch { /* fall through to defaults */ }

  const plan         = productMeta.plan_type     ?? 'pro';
  const billingCycle = productMeta.billing_cycle ?? 'monthly';
  const savesLimit   = productMeta.saves_limit   ?? '100';
  const boardsLimit  = productMeta.boards_limit  ?? '15';
  const fileSizeLimit = productMeta.file_size_limit ?? '20MB';
  const storagLimit  = productMeta.storage_limit ?? '2GB';
  const teamMembers  = productMeta.team_members  ?? '3';
  const status       = sub.status;
  // Stripe moved current_period_end from the subscription to its items in API 2025-03-31.basil
  const periodEndTs  = (item as any)?.current_period_end ?? (sub as any).current_period_end;
  const periodEnd    = typeof periodEndTs === 'number' ? new Date(periodEndTs * 1000).toISOString() : null;

  const { error } = await supabase.from('subscriptions').upsert({
    user_id: userId,
    stripe_customer_id: sub.customer as string,
    stripe_subscription_id: sub.id,
    plan,
    billing_cycle: billingCycle,
    saves_limit: savesLimit,
    boards_limit: boardsLimit,
    file_size_limit: fileSizeLimit,
    storage_limit: storagLimit,
    team_members: teamMembers,
    status,
    current_period_end: periodEnd,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id' });

  // supabase-js returns errors instead of throwing — surface them so the handler 500s and Stripe retries
  if (error) throw new Error(`subscriptions upsert failed (${userId}): ${error.message}`);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const sig = req.headers['stripe-signature'];
  const rawBody = await getRawBody(req);

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig!, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err: any) {
    console.error('Webhook signature failed:', err.message);
    return res.status(400).json({ error: `Webhook error: ${err.message}` });
  }

  try {
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await upsertSubscription(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        const userId = sub.metadata?.supabase_user_id;
        if (userId) {
          const { error } = await supabase
            .from('subscriptions')
            .update({ status: 'canceled', updated_at: new Date().toISOString() })
            .eq('user_id', userId);
          if (error) throw new Error(`subscriptions cancel failed (${userId}): ${error.message}`);
        }
        break;
      }

      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.subscription) {
          const sub = await stripe.subscriptions.retrieve(session.subscription as string);
          if (!sub.metadata?.supabase_user_id && session.metadata?.supabase_user_id) {
            await stripe.subscriptions.update(session.subscription as string, {
              metadata: { supabase_user_id: session.metadata.supabase_user_id },
            });
            (sub as any).metadata = { supabase_user_id: session.metadata.supabase_user_id };
          }
          await upsertSubscription(sub);
        }
        break;
      }
    }
    return res.json({ received: true });
  } catch (err: any) {
    console.error('Webhook handler error:', err);
    return res.status(500).json({ error: err.message });
  }
}
