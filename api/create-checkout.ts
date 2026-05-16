import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const supabase = createClient(
  'https://mchikdltrcbovhdzdhhf.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const PRICES = {
  pro_monthly: process.env.STRIPE_PRICE_PRO_MONTHLY!,
  pro_yearly:  process.env.STRIPE_PRICE_PRO_YEARLY!,
  team:        process.env.STRIPE_PRICE_TEAM!,
};

const SITE = 'https://www.saveboard.app';

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

    const priceId =
      plan === 'team' ? PRICES.team :
      interval === 'yearly' ? PRICES.pro_yearly : PRICES.pro_monthly;

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
