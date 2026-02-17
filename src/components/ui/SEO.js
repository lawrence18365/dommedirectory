import Head from 'next/head';

export default function SEO({ 
  title, 
  description, 
  canonical,
  ogImage = 'https://dommedirectory.com/og-image.jpg',
  noindex = false,
  jsonLd = null
}) {
  const siteTitle = 'DommeDirectory - Find Professional Dommes Near You';
  const fullTitle = title ? `${title} | DommeDirectory` : siteTitle;
  
  return (
    <Head>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      
      {/* Canonical */}
      {canonical && <link rel="canonical" href={canonical} />}
      
      {/* Noindex */}
      {noindex && <meta name="robots" content="noindex,nofollow" />}
      
      {/* Open Graph */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content="website" />
      <meta property="og:image" content={ogImage} />
      <meta property="og:site_name" content="DommeDirectory" />
      
      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
      
      {/* Geo-targeting for USA */}
      <meta name="geo.region" content="US" />
      <meta name="geo.placename" content="United States" />
      <meta name="geo.position" content="39.8283;-98.5795" />
      <meta name="ICBM" content="39.8283, -98.5795" />
      
      <meta property="og:locale" content="en_US" />
      
      {/* JSON-LD Structured Data */}
      {jsonLd && (
        <script 
          type="application/ld+json" 
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} 
        />
      )}
    </Head>
  );
}

// Generate LocalBusiness schema for listings
export function generateListingSchema(listing) {
  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: listing.title || listing.profiles?.display_name,
    description: listing.description,
    image: listing.media?.[0]?.storage_path || listing.profiles?.profile_picture_url,
    url: `https://dommedirectory.com/listings/${listing.id}`,
    telephone: listing.profiles?.contact_phone,
    email: listing.profiles?.contact_email,
    address: {
      '@type': 'PostalAddress',
      addressLocality: listing.locations?.city,
      addressRegion: listing.locations?.state,
      addressCountry: listing.locations?.country || 'US'
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: listing.locations?.latitude,
      longitude: listing.locations?.longitude
    },
    priceRange: '$$$',
    areaServed: {
      '@type': 'City',
      name: listing.locations?.city
    }
  };
}

// Generate ProfilePage schema for listing pages
export function generateProfilePageSchema(listing) {
  const profile = listing?.profiles || {};
  const location = listing?.locations || {};
  const profileName = profile.display_name || listing?.title || 'Profile';
  const listingUrl = `https://dommedirectory.com/listings/${listing?.id}`;
  const imageUrl = listing?.media?.[0]?.storage_path || profile.profile_picture_url || undefined;
  const description = (listing?.description || profile?.bio || '').trim();

  return {
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    url: listingUrl,
    name: `${profileName} Profile`,
    description: description || undefined,
    mainEntity: {
      '@type': 'Person',
      name: profileName,
      description: description || undefined,
      image: imageUrl,
      url: listingUrl,
      homeLocation: {
        '@type': 'Place',
        name: [location.city, location.state, location.country].filter(Boolean).join(', '),
      },
      sameAs: Object.values(profile?.social_links || {}).filter(Boolean),
    },
  };
}

// Generate WebSite schema
export function generateWebsiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'DommeDirectory',
    url: 'https://dommedirectory.com',
    potentialAction: {
      '@type': 'SearchAction',
      target: 'https://dommedirectory.com/cities?q={search_term_string}',
      'query-input': 'required name=search_term_string'
    }
  };
}

// Generate Organization schema
export function generateOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'DommeDirectory',
    url: 'https://dommedirectory.com',
    logo: 'https://dommedirectory.com/logo.png',
    sameAs: [
      'https://twitter.com/dommedirectory',
      'https://instagram.com/dommedirectory'
    ]
  };
}
