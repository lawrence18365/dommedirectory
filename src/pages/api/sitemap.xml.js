import { supabase } from '../../utils/supabase';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://dommedirectory.com';

function generateSiteMap(posts, locations, listings) {
  const staticPages = [
    { url: '/', priority: '1.0', changefreq: 'daily' },
    { url: '/cities', priority: '0.8', changefreq: 'weekly' },
    { url: '/blog', priority: '0.8', changefreq: 'daily' },
    { url: '/auth/login', priority: '0.5', changefreq: 'monthly' },
    { url: '/auth/register', priority: '0.5', changefreq: 'monthly' },
  ];

  const blogUrls = (posts || []).map((post) => ({
    url: `/blog/${post.slug}`,
    priority: '0.6',
    changefreq: 'weekly',
    lastmod: post.updated_at || post.published_at || post.created_at,
  }));

  const locationUrls = (locations || []).map((location) => ({
    url: `/location/${location.id}`,
    priority: '0.7',
    changefreq: 'daily',
    lastmod: location.updated_at || location.created_at,
  }));

  const listingUrls = (listings || []).map((listing) => ({
    url: `/listings/${listing.id}`,
    priority: '0.6',
    changefreq: 'weekly',
    lastmod: listing.updated_at || listing.created_at,
  }));

  const allUrls = [...staticPages, ...blogUrls, ...locationUrls, ...listingUrls];

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${allUrls
    .map(
      ({ url, priority, changefreq, lastmod }) => `
    <url>
      <loc>${siteUrl}${url}</loc>
      ${lastmod ? `<lastmod>${new Date(lastmod).toISOString()}</lastmod>` : ''}
      <changefreq>${changefreq}</changefreq>
      <priority>${priority}</priority>
    </url>
  `
    )
    .join('')}
</urlset>`;
}

export default async function handler(req, res) {
  try {
    // Fetch dynamic content from database
    const [{ data: posts }, { data: locations }, { data: listings }] = await Promise.all([
      supabase.from('posts').select('slug, updated_at, published_at, created_at').eq('status', 'published'),
      supabase.from('locations').select('id, updated_at, created_at'),
      supabase.from('listings').select('id, updated_at, created_at').eq('is_active', true),
    ]);

    const sitemap = generateSiteMap(posts, locations, listings);

    res.setHeader('Content-Type', 'text/xml');
    res.setHeader('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate');
    res.send(sitemap);
  } catch (error) {
    console.error('Error generating sitemap:', error);
    res.status(500).json({ error: 'Failed to generate sitemap' });
  }
}
