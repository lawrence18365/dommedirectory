import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2023-10-16',
});

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

        // Check authorization
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({ error: 'Missing an authorization header' });
        }

        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

        if (authError || !user) {
            return res.status(401).json({ error: 'Unauthorized user' });
        }

        // Get the user's stripe customer ID
        const { data: profile, error: profileError } = await supabaseAdmin
            .from('profiles')
            .select('stripe_customer_id')
            .eq('id', user.id)
            .single();

        if (profileError || !profile.stripe_customer_id) {
            return res.status(400).json({ error: 'No active billing account found.' });
        }

        // Create a customer portal session
        const session = await stripe.billingPortal.sessions.create({
            customer: profile.stripe_customer_id,
            return_url: returnUrl || `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard`,
        });

        return res.status(200).json({ url: session.url });
    } catch (error) {
        console.error('Stripe Portal Error:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}
