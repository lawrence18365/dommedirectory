import Stripe from 'stripe';
import { supabase } from '../../../utils/supabase';

// Initialize Stripe with your secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { profileId } = req.body;

    // Get Stripe price ID for verification fee
    const priceId = process.env.STRIPE_VERIFICATION_PRICE_ID || 'price_verification'; // Replace with actual price ID

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/verification?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/verification?canceled=true`,
      client_reference_id: profileId,
      metadata: {
        profileId,
        paymentType: 'verification',
      },
    });

    // Create a payment record in the database
    const { error } = await supabase.from('payments').insert([
      {
        profile_id: profileId,
        amount: 0, // Will be updated by webhook
        stripe_payment_id: session.id,
        payment_status: 'pending',
        payment_type: 'verification',
      },
    ]);

    if (error) {
      console.error('Error creating payment record:', error);
    }

    // Return the session ID to the client
    res.status(200).json({ sessionId: session.id });
  } catch (error) {
    console.error('Error creating verification checkout session:', error);
    res.status(500).json({ error: 'Error creating checkout session' });
  }
}
