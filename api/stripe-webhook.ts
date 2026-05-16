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
  if (!userId) return;

  const item = sub.items.data[0];
  const plan = item?.price?.metadata?.plan ?? 'pro';
  const status = sub.status; // active, canceled, past_due, etc.

  await supabase.from('subscriptions').upsert({
    user_id: userId,
    stripe_customer_id: sub.customer as string,
    stripe_subscription_id: sub.id,
    plan,
    status,
    current_period_end: new Date((sub as any).current_period_end * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id' });
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
          await supabase
            .from('subscriptions')
            .update({ status: 'canceled', updated_at: new Date().toISOString() })
            .eq('user_id', userId);
        }
        break;
      }

      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.CheckoutSession;
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
