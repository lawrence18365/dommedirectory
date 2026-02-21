const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Admin bypass RLS

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing SUPABASE config in .env.local");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seed() {
    console.log('Seeding SEO Cornerstone Content...');

    // 1. Create or ensure Categories exist
    const categories = [
        { name: 'Safety Guides', slug: 'safety', description: 'Vetting and industry safety standards.' },
        { name: 'Industry Insights', slug: 'industry', description: 'Trends and updates in the Findom and Pro Domme space.' }
    ];

    for (const cat of categories) {
        await supabase.from('categories').upsert(cat, { onConflict: 'slug' }).select();
    }

    // Fetch created categories
    const { data: catData } = await supabase.from('categories').select('*');
    const safetyId = catData.find(c => c.slug === 'safety').id;
    const industryId = catData.find(c => c.slug === 'industry').id;

    // 2. Draft 3 high-volume SEO articles
    const posts = [
        {
            title: 'How to Safely Vet Subs Online: A Guide for Pro Dommes',
            slug: 'how-to-vet-subs-online-guide',
            content: `
<h2>The Importance of Vetting</h2>
<p>As the digital landscape evolves, so do the risks associated with online dominance. Vetting is no longer just a best practice—it is the foundational pillar of a sustainable and safe career. This guide outlines the exact steps top-tier Dominatrices use to verify clients before engaging.</p>
<h3>1. Social Media Footprint Analysis</h3>
<p>Never rely solely on a single anonymous account. Requesting verified social profiles (like LinkedIn or established Twitter accounts) provides a baseline of reality. If a sub is hesitant to provide real-world anchors, that is an immediate red flag.</p>
<h3>2. Age Verification and ID Checks</h3>
<p>Utilizing third-party age verification services protects you legally. Services like Yoti or requiring a holding-ID photo (with sensitive info blurred) ensure you are never crossing legal boundaries.</p>
<h3>3. The Tribute Test</h3>
<p>Time wasters are the bane of the industry. The initial tribute is not just about financial gain; it is a psychological test of submission and intent. A legitimate client will respect your time by offering tribute without hesitation.</p>
<hr/>
<p><em>Stay safe. Never compromise your boundaries for an unverified interaction. Join DommeDirectory today to connect with serious, pre-vetted clients.</em></p>`,
            excerpt: 'Learn the foundational modern techniques top-tier professional Dominatrices use to vet, verify, and filter online subs before engaging.',
            featured_image_url: 'https://images.unsplash.com/photo-1555421689-d68471e189f2?auto=format&fit=crop&q=80&w=1200',
            status: 'published',
            published_at: new Date().toISOString(),
            category_id: safetyId,
            meta_title: 'How to Vet Subs Online: Safety Guide for Pro Dommes',
            meta_description: 'Protect your time and safety. Learn how professional Dominatrices vet anonymous subs, manage identity checks, and enforce initial tributes.'
        },
        {
            title: 'Findom vs. Sugar Baby: Understanding the Industry Dynamics',
            slug: 'findom-vs-sugar-baby-differences',
            content: `
<h2>Clearing the Confusion</h2>
<p>There is a massive influx of new creators confusing the dynamics of Financial Domination (Findom) with the Sugar lifestyle. While both involve financial exchange, the psychological architecture is entirely opposed.</p>
<h3>The Core Difference</h3>
<p>In a Sugar dynamic, the financial exchange is compensatory—it is given in exchange for time, attention, or companionship. The power rests with the provider (the Sugar Daddy), who dictates the terms of compensation.</p>
<p>In Financial Domination, the financial exchange <strong>is</strong> the fetish. The power rests entirely with the Dominant. The submissive derives pleasure from the act of sacrificing wealth, and the Dominant is under no obligation to provide companionship in return.</p>
<h3>Why the Distinction Matters</h3>
<p>Mislabeling yourself attracts the wrong clientele. If you are operating as a Findom but marketing yourself using Sugar terminology, you will attract clients expecting "girlfriend experiences" or entitlement to your time.</p>
<p>Clear boundaries and accurate marketing are essential. Be explicit about your dynamic and demand respect from the outset.</p>`,
            excerpt: 'What is the true psychological and operational difference between Financial Domination and the Sugar lifestyle? Learn how to market yourself correctly.',
            featured_image_url: 'https://images.unsplash.com/photo-1579621970588-a3f5ce5a4220?auto=format&fit=crop&q=80&w=1200',
            status: 'published',
            published_at: new Date().toISOString(),
            category_id: industryId,
            meta_title: 'Findom vs Sugar Baby: What is the Difference?',
            meta_description: 'Discover the distinct psychological differences between Financial Domination and the Sugar lifestyle. Ensure you attract the right clients by using the correct terminology.'
        },
        {
            title: 'How to Optimize Your DommeDirectory Profile for Maximum Traffic',
            slug: 'optimize-dommedirectory-profile-seo',
            content: `
<h2>Dominating Local Search</h2>
<p>DommeDirectory is engineered from the ground up for elite Search Engine Optimization (SEO). When clients search for "Findom in [Your City]" or "Pro Domme [Your City]", our goal is to place your profile at the absolute top of Google. Here is how you can help us help you.</p>
<h3>1. Use a High-Quality Profile Picture</h3>
<p>Our analytics show that profiles with clear, high-resolution hero images receive 4x more click-throughs from the city directory pages. A muddy or overly filtered picture diminishes trust.</p>
<h3>2. Detail Your Specialties</h3>
<p>Don't be generic. If you specialize in CBT, Sensory Deprivation, or specific Findom drained tasks, list them specifically in your bio. Clients use long-tail keyword searches, and our platform indexes your bio against those keywords.</p>
<h3>3. Embed Your "Verified" Badge</h3>
<p>If you have an external website or a Linktree, embedding the DommeDirectory HTML "Verified Provider" badge does two things: it proves to your clients you are vetted on a premium platform, and the backlink significantly boosts your profile's algorithmic ranking within our internal search engine.</p>`,
            excerpt: 'Actionable steps to ensure your DommeDirectory profile ranks at the top of Google for local searches in your city.',
            featured_image_url: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=1200',
            status: 'published',
            published_at: new Date().toISOString(),
            category_id: industryId,
            meta_title: 'Optimize Your Domme Profile for More Local Clients',
            meta_description: 'Gain more traffic and higher bookings by optimizing your DommeDirectory listing. Best practices for bios, images, and external backlinks.'
        }
    ];

    for (const post of posts) {
        const { data, error } = await supabase.from('posts').upsert(post, { onConflict: 'slug' });
        if (error) {
            console.error('Failed to insert post:', post.title, error.message);
        } else {
            console.log('Inserted:', post.title);
        }
    }

    console.log('Seeding complete. The SEO Engine is loaded.');
}

seed();
