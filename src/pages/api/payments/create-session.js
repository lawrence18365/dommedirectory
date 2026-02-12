import Stripe from 'stripe';
import { supabase } from '../../../utils/supabase';
import { applyRateLimit } from '../../../utils/rateLimit';

// Initialize Stripe with your secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Apply rate limiting: 10 requests per minute for payment creation
  const allowed = applyRateLimit(req, res, {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10,
  });
  
  if (!allowed) return;

  try {
    const { profileId, listingId, priceId, isFeatured = false } = req.body;

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard?canceled=true`,
      client_reference_id: profileId,
      metadata: {
        profileId,
        listingId,
        isFeatured: isFeatured ? 'true' : 'false',
      },
    });

    // Create a payment record in the database
    const { error } = await supabase.from('payments').insert([
      {
        profile_id: profileId,
        listing_id: listingId,
        amount: 0, // Will be updated by webhook
        stripe_payment_id: session.id,
        payment_status: 'pending',
        payment_type: isFeatured ? 'featured' : 'listing',
      },
    ]);

    if (error) {
      console.error('Error creating payment record:', error);
    }

    // Return the session ID to the client
    res.status(200).json({ sessionId: session.id });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({ error: 'Error creating checkout session' });
  }
}
