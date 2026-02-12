import Layout from '../components/layout/Layout';
import SEO from '../components/ui/SEO';
import Badge from '../components/ui/Badge';

export default function Videos() {
  return (
    <Layout>
      <SEO title="Videos - DommeDirectory" description="Video content from professional dommes — coming soon." />

      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <Badge variant="primary" className="mb-4">Video Content</Badge>
          <h1 className="text-4xl sm:text-5xl font-black text-white mb-6">
            Video{' '}
            <span className="bg-gradient-to-r from-red-400 to-red-600 bg-clip-text text-transparent">
              Gallery
            </span>
          </h1>
          <p className="text-gray-400 text-lg">
            Explore videos from professional dommes. Tours, sessions, and educational content.
          </p>
        </div>

        <div className="bg-[#1a1a1a] border border-white/5 rounded-lg py-20 text-center max-w-2xl mx-auto">
          <div className="w-20 h-20 bg-red-600/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">Coming Soon</h2>
          <p className="text-gray-400 max-w-md mx-auto mb-6">
            We&apos;re building a video gallery for dommes to showcase their skills,
            give dungeon tours, and share educational content.
          </p>
          <p className="text-red-600 text-sm">Stay tuned for updates</p>
        </div>
      </div>
    </Layout>
  );
}
