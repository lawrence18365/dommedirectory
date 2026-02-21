import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2023-10-16',
});

// Using the service role key to securely read the profile and create the customer
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const { returnUrl } = req.body;

        // We expect the auth token to be passed from the client
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({ error: 'Missing an authorization header' });
        }

        const token = authHeader.replace('Bearer ', '');

        // Verify user using the Supabase auth instance
        const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
        if (authError || !user) {
            return res.status(401).json({ error: 'Unauthorized user' });
        }

        // Get the user's profile to see if they already have a Stripe Customer ID
        const { data: profile, error: profileError } = await supabaseAdmin
            .from('profiles')
            .select('stripe_customer_id, premium_tier')
            .eq('id', user.id)
            .single();

        if (profileError) {
            console.error('Profile fetch error:', profileError);
            return res.status(500).json({ error: 'Could not fetch user profile' });
        }

        if (profile.premium_tier === 'pro' || profile.premium_tier === 'elite') {
            return res.status(400).json({ error: 'You are already subscribed to a premium tier. Access the billing portal to manage your subscription.' });
        }

        let customerId = profile.stripe_customer_id;

        if (!customerId) {
            // Create a new Stripe customer
            const customer = await stripe.customers.create({
                email: user.email,
                metadata: {
                    supabase_user_id: user.id,
                },
            });
            customerId = customer.id;

            // Update the profile with the new customer ID
            await supabaseAdmin
                .from('profiles')
                .update({ stripe_customer_id: customerId })
                .eq('id', user.id);
        }

        // Identify the Pro Tier Price ID from the environment
        const priceId = process.env.STRIPE_PRO_PRICE_ID;
        if (!priceId) {
            return res.status(500).json({ error: 'Missing Stripe Price ID configuration.' });
        }

        // Create the checkout session
        const session = await stripe.checkout.sessions.create({
            customer: customerId,
            mode: 'subscription',
            payment_method_types: ['card'],
            line_items: [
                {
                    price: priceId,
                    quantity: 1,
                },
            ],
            success_url: `${returnUrl || process.env.NEXT_PUBLIC_SITE_URL}/dashboard?checkout_success=true&session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${returnUrl || process.env.NEXT_PUBLIC_SITE_URL}/pricing?checkout_canceled=true`,
            metadata: {
                supabase_user_id: user.id,
                target_tier: 'pro'
            },
        });

        return res.status(200).json({ sessionId: session.id, url: session.url });
    } catch (error) {
        console.error('Stripe Checkout Error:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}
