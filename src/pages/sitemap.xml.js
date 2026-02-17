import { supabase } from '../utils/supabase';
import { slugify } from '../utils/slugify';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://dommedirectory.com';

const STATIC_PAGES = [
  { url: '/', priority: '1.0', changefreq: 'daily' },
  { url: '/cities', priority: '0.9', changefreq: 'daily' },
  { url: '/usa', priority: '0.8', changefreq: 'weekly' },
  { url: '/blog', priority: '0.8', changefreq: 'daily' },
  { url: '/reviews', priority: '0.7', changefreq: 'weekly' },
  { url: '/videos', priority: '0.7', changefreq: 'weekly' },
  { url: '/about', priority: '0.5', changefreq: 'monthly' },
  { url: '/contact', priority: '0.5', changefreq: 'monthly' },
  { url: '/safety', priority: '0.6', changefreq: 'monthly' },
];

const toIso = (value) => {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString();
};

const buildSitemap = (entries) => `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries
  .map(
    ({ url, priority, changefreq, lastmod }) => `  <url>
    <loc>${siteUrl}${url}</loc>
    ${lastmod ? `<lastmod>${lastmod}</lastmod>` : ''}
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`
  )
  .join('\n')}
</urlset>`;

export async function getServerSideProps({ res }) {
  try {
    const [postsResult, listingsResult, locationsResult] = await Promise.all([
      supabase
        .from('posts')
        .select('slug, updated_at, published_at, created_at')
        .eq('status', 'published'),
      supabase
        .from('listings')
        .select('id, updated_at, created_at')
        .eq('is_active', true),
      supabase
        .from('locations')
        .select('city, is_active, updated_at, created_at')
        .eq('is_active', true),
    ]);

    const staticEntries = STATIC_PAGES.map((page) => ({
      ...page,
      lastmod: toIso(new Date()),
    }));

    const blogEntries = (postsResult.data || []).map((post) => ({
      url: `/blog/${post.slug}`,
      priority: '0.6',
      changefreq: 'weekly',
      lastmod: toIso(post.updated_at || post.published_at || post.created_at),
    }));

    const seenLocationSlugs = new Set();
    const locationEntries = (locationsResult.data || [])
      .map((location) => ({
        slug: slugify(location.city || ''),
        lastmod: toIso(location.updated_at || location.created_at),
      }))
      .filter((location) => location.slug)
      .filter((location) => {
        if (seenLocationSlugs.has(location.slug)) return false;
        seenLocationSlugs.add(location.slug);
        return true;
      })
      .map((location) => ({
        url: `/location/${location.slug}`,
        priority: '0.7',
        changefreq: 'daily',
        lastmod: location.lastmod,
      }));

    const listingEntries = (listingsResult.data || []).map((listing) => ({
      url: `/listings/${listing.id}`,
      priority: '0.7',
      changefreq: 'weekly',
      lastmod: toIso(listing.updated_at || listing.created_at),
    }));

    const sitemapEntries = [...staticEntries, ...blogEntries, ...locationEntries, ...listingEntries];
    const xml = buildSitemap(sitemapEntries);

    res.setHeader('Content-Type', 'text/xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate');
    res.write(xml);
    res.end();

    return { props: {} };
  } catch (error) {
    console.error('Sitemap generation error:', error);
    res.statusCode = 500;
    res.end('Error generating sitemap');
    return { props: {} };
  }
}

export default function Sitemap() {
  return null;
}
