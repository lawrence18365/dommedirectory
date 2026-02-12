import { getAllLocations } from '../services/locations';

const BASE_URL = 'https://dommedirectory.com';

function generateSitemap(listings, cities) {
  const pages = [
    { url: '', priority: '1.0', changefreq: 'daily' },
    { url: '/usa', priority: '0.9', changefreq: 'daily' },
    { url: '/cities', priority: '0.9', changefreq: 'weekly' },
    { url: '/auth/login', priority: '0.5', changefreq: 'monthly' },
    { url: '/auth/register', priority: '0.5', changefreq: 'monthly' },
  ];

  // Add city pages
  cities.forEach(city => {
    pages.push({
      url: `/location/${city.slug}`,
      priority: '0.8',
      changefreq: 'daily'
    });
  });

  // Add listing pages
  listings.forEach(listing => {
    pages.push({
      url: `/listings/${listing.id}`,
      priority: '0.7',
      changefreq: 'weekly'
    });
  });

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages.map(page => `  <url>
    <loc>${BASE_URL}${page.url}</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

  return sitemap;
}

export async function getServerSideProps({ res }) {
  try {
    // Fetch listings and cities from your database
    const { data: listings } = await import('../utils/supabase').then(m => 
      m.supabase.from('listings').select('id').eq('is_active', true)
    );
    
    const { locations: cities } = await getAllLocations();
    const citySlugs = cities?.map(c => ({ slug: c.city.toLowerCase().replace(/\s+/g, '-') })) || [];

    const sitemap = generateSitemap(listings || [], citySlugs);

    res.setHeader('Content-Type', 'text/xml');
    res.write(sitemap);
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
