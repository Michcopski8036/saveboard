import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const supabase = createClient(
  'https://mchikdltrcbovhdzdhhf.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const PRODUCTS = {
  pro_monthly: 'prod_UWPfKiYsEWBtRy',
  pro_yearly:  'prod_UWmdNuHEo9ySbj',
  team:        'prod_UWlLz9NIlQCnsL',
};

const SITE = 'https://www.saveboard.app';

async function getPriceId(productId: string): Promise<string> {
  const prices = await stripe.prices.list({ product: productId, active: true, limit: 1 });
  if (!prices.data.length) throw new Error(`No active price found for product ${productId}`);
  return prices.data[0].id;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { plan, userId, userEmail, interval } = req.body as {
    plan: 'pro' | 'team';
    userId: string;
    userEmail: string;
    interval?: 'monthly' | 'yearly';
  };

  if (!plan || !userId || !userEmail) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    // Look up or create Stripe customer
    const { data: existing } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', userId)
      .maybeSingle();

    let customerId = existing?.stripe_customer_id as string | undefined;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: userEmail,
        metadata: { supabase_user_id: userId },
      });
      customerId = customer.id;
    }

    const productKey =
      plan === 'team' ? 'team' :
      interval === 'yearly' ? 'pro_yearly' : 'pro_monthly';
    const priceId = await getPriceId(PRODUCTS[productKey]);

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      success_url: `${SITE}/?checkout=success`,
      cancel_url:  `${SITE}/?checkout=cancelled`,
      metadata: { supabase_user_id: userId },
      subscription_data: {
        metadata: { supabase_user_id: userId },
      },
    });

    return res.json({ url: session.url });
  } catch (err: any) {
    console.error('Stripe checkout error:', err);
    return res.status(500).json({ error: err.message });
  }
}
