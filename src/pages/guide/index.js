import Link from 'next/link';
import Layout from '../../components/layout/Layout';
import SEO from '../../components/ui/SEO';
import { GUIDES } from '../../data/guides';

export default function GuidesIndex() {
  return (
    <Layout>
      <SEO
        title="BDSM & Domination Guides | DommeDirectory"
        description="Practical guides for clients: how to find a dominatrix, what to expect in your first session, BDSM safety basics, and more."
        canonical="https://dommedirectory.com/guide"
      />

      <div className="min-h-screen bg-[#0a0a0a]">
        <div className="max-w-3xl mx-auto px-4 py-12 sm:px-6">

          <nav className="mb-8 text-sm text-gray-500">
            <Link href="/" className="hover:text-gray-300 transition-colors">Home</Link>
            <span className="mx-2">/</span>
            <span className="text-gray-300">Guides</span>
          </nav>

          <h1 className="text-3xl font-bold text-white mb-4">Guides</h1>
          <p className="text-gray-400 mb-10">
            Practical information for clients exploring BDSM and professional domination services.
          </p>

          <div className="space-y-4">
            {GUIDES.map((guide) => (
              <Link
                key={guide.slug}
                href={`/guide/${guide.slug}`}
                className="block bg-[#111] border border-gray-800 rounded-lg p-5 hover:border-red-600/50 hover:bg-[#151515] transition-colors group"
              >
                <h2 className="text-white font-semibold group-hover:text-red-400 transition-colors mb-1">
                  {guide.title}
                </h2>
                <p className="text-gray-500 text-sm">{guide.metaDescription}</p>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}
