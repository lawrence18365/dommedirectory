import Stripe from 'stripe';
import { buffer } from 'micro';
import { supabase } from '../../../utils/supabase';
import { markProfileAsVerified } from '../../../services/profiles';
import { applyRateLimit } from '../../../utils/rateLimit'; // Import the new function

// Initialize Stripe with your secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

// Disable body parsing, need the raw body for signature verification
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Apply rate limiting: 100 webhook events per minute (generous for Stripe)
  const allowed = applyRateLimit(req, res, {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100,
  });
  
  if (!allowed) return;

  const buf = await buffer(req);
  const sig = req.headers['stripe-signature'];

  let event;

  try {
    // Verify the webhook signature
    event = stripe.webhooks.constructEvent(buf, sig, webhookSecret);
  } catch (error) {
    console.error(`Webhook signature verification failed: ${error.message}`);
    return res.status(400).send(`Webhook Error: ${error.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object;
      await handleCheckoutSessionCompleted(session);
      break;
    case 'invoice.paid':
      const invoice = event.data.object;
      await handleInvoicePaid(invoice);
      break;
    case 'customer.subscription.updated':
      const subscription = event.data.object;
      await handleSubscriptionUpdated(subscription);
      break;
    case 'customer.subscription.deleted':
      const deletedSubscription = event.data.object;
      await handleSubscriptionDeleted(deletedSubscription);
      break;
    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  res.status(200).json({ received: true });
}

// Handle checkout.session.completed event
async function handleCheckoutSessionCompleted(session) {
  try {
    // Update payment status
    const { error: paymentError } = await supabase
      .from('payments')
      .update({
        amount: session.amount_total,
        payment_status: 'completed',
        updated_at: new Date(),
      })
      .eq('stripe_payment_id', session.id);

    if (paymentError) {
      console.error('Error updating payment:', paymentError);
    }

    // If this is a featured listing payment, update the listing
    if (session.metadata?.isFeatured === 'true' && session.metadata?.listingId) {
      const { error: listingError } = await supabase
        .from('listings')
        .update({
          is_featured: true,
          updated_at: new Date(),
        })
        .eq('id', session.metadata.listingId);

      if (listingError) {
        console.error('Error updating listing:', listingError);
      }
    }

    // If this is a verification payment, update verification status
    // If this is a verification payment, update verification status
    if (session.metadata?.paymentType === 'verification') {
      const profileId = session.client_reference_id || session.metadata?.profileId; // Get profileId from session
      if (profileId) {
        console.log(`Processing verification payment for profile: ${profileId}`);
        await markProfileAsVerified(profileId);
      } else {
        console.error('Verification payment completed but profileId missing from session:', session.id);
      }
    }
  } catch (error) {
    console.error('Error handling checkout.session.completed:', error);
  }
}

// Handle invoice.paid event
async function handleInvoicePaid(invoice) {
  try {
    // Get the subscription
    const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
    
    // Get listingId from subscription metadata
    const listingId = subscription.metadata?.listingId;
    
    if (listingId) {
      // Update listing expiration date
      const { error } = await supabase
        .from('listings')
        .update({
          expires_at: new Date(subscription.current_period_end * 1000),
          is_active: true,
          updated_at: new Date(),
        })
        .eq('id', listingId);

      if (error) {
        console.error('Error updating listing expiration:', error);
      }
    }
  } catch (error) {
    console.error('Error handling invoice.paid:', error);
  }
}

// Handle customer.subscription.updated event
async function handleSubscriptionUpdated(subscription) {
  try {
    const listingId = subscription.metadata?.listingId;
    
    if (listingId) {
      const { error } = await supabase
        .from('listings')
        .update({
          expires_at: new Date(subscription.current_period_end * 1000),
          is_active: subscription.status === 'active',
          updated_at: new Date(),
        })
        .eq('id', listingId);

      if (error) {
        console.error('Error updating subscription status:', error);
      }
    }
  } catch (error) {
    console.error('Error handling subscription.updated:', error);
  }
}

// Handle customer.subscription.deleted event
async function handleSubscriptionDeleted(subscription) {
  try {
    const listingId = subscription.metadata?.listingId;
    
    if (listingId) {
      const { error } = await supabase
        .from('listings')
        .update({
          is_active: false,
          updated_at: new Date(),
        })
        .eq('id', listingId);

      if (error) {
        console.error('Error deactivating listing:', error);
      }
    }
  } catch (error) {
    console.error('Error handling subscription.deleted:', error);
  }
}
