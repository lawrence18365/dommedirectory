import { supabase } from '../utils/supabase';
import { loadStripe } from '@stripe/stripe-js';

// Prices for different services (should match Stripe products)
export const PRICES = {
  BASIC_LISTING: 'price_basic', // Replace with actual price ID from Stripe
  FEATURED_LISTING: 'price_featured', // Replace with actual price ID from Stripe
  VERIFICATION: 'price_verification', // Replace with actual price ID from Stripe
};

/**
 * Create a checkout session for listing payment
 * @param {string} profileId 
 * @param {string} listingId 
 * @param {string} priceId 
 * @param {boolean} isFeatured 
 */
export const createCheckoutSession = async (profileId, listingId, priceId, isFeatured = false) => {
  try {
    const response = await fetch('/api/payments/create-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        profileId,
        listingId,
        priceId,
        isFeatured,
      }),
    });

    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    const data = await response.json();
    return { sessionId: data.sessionId, error: null };
  } catch (error) {
    console.error('Error creating checkout session:', error.message);
    return { sessionId: null, error };
  }
};

/**
 * Get payment history for a profile
 * @param {string} profileId 
 */
export const getPaymentHistory = async (profileId) => {
  try {
    const { data, error } = await supabase
      .from('payments')
      .select(`
        *,
        listings(id, title)
      `)
      .eq('profile_id', profileId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { payments: data, error: null };
  } catch (error) {
    console.error('Error fetching payment history:', error.message);
    return { payments: null, error };
  }
};

/**
 * Create a verification payment
 * @param {string} profileId 
 */
export const createVerificationCheckout = async (profileId) => {
  try {
    const response = await fetch('/api/payments/create-verification', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        profileId,
      }),
    });

    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    const data = await response.json();
    return { sessionId: data.sessionId, error: null };
  } catch (error) {
    console.error('Error creating verification checkout:', error.message);
    return { sessionId: null, error };
  }
};
