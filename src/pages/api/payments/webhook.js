import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export const config = {
  api: {
    bodyParser: false,
  },
};

async function buffer(readable) {
  const chunks = [];
  for await (const chunk of readable) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  let buf;
  try {
    buf = await buffer(req);
  } catch (err) {
    return res.status(400).send(`Error reading request buffer: ${err.message}`);
  }

  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(buf, sig, webhookSecret);
  } catch (err) {
    console.error(`Webhook Error: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;

        if (session.mode === 'subscription' && session.subscription) {
          const subscription = await stripe.subscriptions.retrieve(session.subscription);
          const userId = session.metadata?.supabase_user_id;

          if (userId) {
            await supabaseAdmin.from('profiles').update({
              stripe_subscription_id: subscription.id,
              subscription_status: subscription.status,
              premium_tier: session.metadata?.target_tier || 'pro'
            }).eq('id', userId);
          } else {
            console.error('Missing userId in session metadata');
          }
        }
        break;
      }
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        const customerId = subscription.customer;

        let newTier = 'pro';
        if (subscription.status !== 'active' && subscription.status !== 'trialing') {
          newTier = 'basic';
        }

        await supabaseAdmin.from('profiles').update({
          stripe_subscription_id: subscription.id,
          subscription_status: subscription.status,
          premium_tier: newTier
        }).eq('stripe_customer_id', customerId);
        break;
      }
      default:
        console.log(`Unhandled event type ${event.type}`);
    }
  } catch (err) {
    console.error('Webhook handler error:', err);
    return res.status(500).send('Webhook handler error');
  }

  res.json({ received: true });
}
