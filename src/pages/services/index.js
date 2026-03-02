import Link from 'next/link';
import Layout from '../../components/layout/Layout';
import SEO, { generateBreadcrumbSchema } from '../../components/ui/SEO';
import { ALL_SERVICES, slugifyService } from '../../utils/services';
import SERVICE_DESCRIPTIONS from '../../data/serviceDescriptions';

export async function getServerSideProps() {
  // Build a slim map of slug → shortDescription so the full 46KB file stays server-side.
  const descriptionMap = {};
  for (const service of ALL_SERVICES) {
    const slug = slugifyService(service);
    const desc = SERVICE_DESCRIPTIONS[slug];
    if (desc?.shortDescription) {
      descriptionMap[slug] = desc.shortDescription;
    }
  }

  return { props: { descriptionMap } };
}

export default function ServicesIndex({ descriptionMap }) {
  const pageUrl = 'https://dommedirectory.com/services';

  const jsonLd = [
    generateBreadcrumbSchema([
      { name: 'Home', url: 'https://dommedirectory.com' },
      { name: 'Services', url: pageUrl },
    ]),
  ];

  return (
    <Layout>
      <SEO
        title="Professional Domination Services — Browse All Categories"
        description="Browse all professional domination service categories on DommeDirectory. Find verified providers offering bondage, discipline, domination, fetish services, and more."
        canonical={pageUrl}
        jsonLd={jsonLd}
      />

      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <nav className="text-sm text-gray-500 mb-3">
          <Link href="/" className="hover:text-white transition-colors">Home</Link>
          <span className="mx-2">/</span>
          <span className="text-gray-300">Services</span>
        </nav>

        <div className="mb-10">
          <h1 className="text-3xl font-bold text-white">
            Professional Domination Services
          </h1>
          <p className="text-gray-400 mt-2 max-w-2xl">
            Browse all {ALL_SERVICES.length} service categories. Each category lists verified providers you can contact directly.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {ALL_SERVICES.map((service) => {
            const slug = slugifyService(service);
            const shortDesc = descriptionMap[slug];
            return (
              <Link
                key={slug}
                href={`/services/${slug}`}
                className="group block bg-[#1a1a1a] rounded-lg p-6 border border-gray-800 hover:border-red-600/40 transition-colors"
              >
                <h2 className="text-lg font-semibold text-white group-hover:text-red-400 transition-colors mb-2">
                  {service}
                </h2>
                {shortDesc && (
                  <p className="text-gray-400 text-sm leading-relaxed">
                    {shortDesc}
                  </p>
                )}
                <span className="inline-block mt-4 text-red-500 text-sm font-medium group-hover:text-red-400 transition-colors">
                  Browse providers &rarr;
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </Layout>
  );
}
