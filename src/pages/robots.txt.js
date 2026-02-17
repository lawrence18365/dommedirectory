const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://dommedirectory.com';

const PRIVATE_PATHS = [
  '/admin/',
  '/api/',
  '/auth/',
  '/dashboard',
  '/settings',
  '/profile',
  '/verification',
  '/onboarding',
  '/messages',
  '/bookings',
  '/analytics',
  '/listings/create',
  '/listings/edit/',
];

const buildRobotsTxt = () => `User-agent: *
Allow: /
${PRIVATE_PATHS.map((path) => `Disallow: ${path}`).join('\n')}

Sitemap: ${siteUrl}/sitemap.xml
`;

export async function getServerSideProps({ res }) {
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate');
  res.write(buildRobotsTxt());
  res.end();

  return { props: {} };
}

export default function Robots() {
  return null;
}
