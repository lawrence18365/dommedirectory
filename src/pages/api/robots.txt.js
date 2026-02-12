export default function handler(req, res) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://dommedirectory.com';
  
  const robotsTxt = `# robots.txt for DommeDirectory
User-agent: *
Allow: /

# Sitemap
Sitemap: ${siteUrl}/api/sitemap.xml

# Disallow admin routes
Disallow: /admin/
Disallow: /api/
Disallow: /dashboard
Disallow: /settings
Disallow: /profile
Disallow: /verification
Disallow: /listings/create
Disallow: /listings/edit/

# Crawl delay
Crawl-delay: 1
`;

  res.setHeader('Content-Type', 'text/plain');
  res.send(robotsTxt);
}
