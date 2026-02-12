import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* Favicon */}
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="alternate icon" type="image/png" href="/favicon-16x16.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/site.webmanifest" />
        <meta name="theme-color" content="#dc2626" />
        
        {/* Preconnect to external domains for performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://images.unsplash.com" />
        
        {/* DNS Prefetch */}
        <link rel="dns-prefetch" href="https://mwfybwgkorbyncruzvtm.supabase.co" />
        <link rel="dns-prefetch" href="https://imagedelivery.net" />
        
        {/* Alternate language versions (when you add them) */}
        <link rel="alternate" hrefLang="en" href="https://dommedirectory.com" />
        <link rel="alternate" hrefLang="x-default" href="https://dommedirectory.com" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}
