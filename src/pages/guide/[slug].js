import Link from 'next/link';
import Layout from '../../components/layout/Layout';
import SEO from '../../components/ui/SEO';
import { GUIDES, getGuide } from '../../data/guides';

export async function getStaticPaths() {
  return {
    paths: GUIDES.map((g) => ({ params: { slug: g.slug } })),
    fallback: false,
  };
}

export async function getStaticProps({ params }) {
  const guide = getGuide(params.slug);
  if (!guide) return { notFound: true };
  return { props: { guide } };
}

export default function GuidePage({ guide }) {
  return (
    <Layout>
      <SEO
        title={guide.metaTitle}
        description={guide.metaDescription}
        canonical={`https://dommedirectory.com/guide/${guide.slug}`}
      />

      <div className="min-h-screen bg-[#0a0a0a]">
        <div className="max-w-3xl mx-auto px-4 py-12 sm:px-6">

          {/* Breadcrumb */}
          <nav className="mb-8 text-sm text-gray-500">
            <Link href="/" className="hover:text-gray-300 transition-colors">Home</Link>
            <span className="mx-2">/</span>
            <Link href="/guide" className="hover:text-gray-300 transition-colors">Guides</Link>
            <span className="mx-2">/</span>
            <span className="text-gray-300">{guide.title}</span>
          </nav>

          {/* H1 */}
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-6 leading-tight">
            {guide.h1}
          </h1>

          {/* Intro */}
          <p className="text-gray-300 text-lg leading-relaxed mb-10 border-l-4 border-red-600 pl-4">
            {guide.intro}
          </p>

          {/* Sections */}
          <div className="space-y-10">
            {guide.sections.map((section) => (
              <section key={section.heading}>
                <h2 className="text-xl font-semibold text-white mb-3">{section.heading}</h2>
                <div className="text-gray-400 leading-relaxed space-y-4">
                  {section.body.split('\n\n').map((para, i) => (
                    <p key={i}>{para}</p>
                  ))}
                </div>
              </section>
            ))}
          </div>

          {/* Related links */}
          {guide.relatedLinks?.length > 0 && (
            <div className="mt-14 border-t border-gray-800 pt-8">
              <h2 className="text-lg font-semibold text-white mb-4">Related</h2>
              <ul className="space-y-2">
                {guide.relatedLinks.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-red-500 hover:text-red-400 transition-colors"
                    >
                      {link.label} →
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* All guides index link */}
          <div className="mt-10">
            <Link
              href="/guide"
              className="text-sm text-gray-500 hover:text-gray-300 transition-colors"
            >
              ← All guides
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
}
