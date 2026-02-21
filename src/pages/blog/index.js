import Head from 'next/head';
import Layout from '../../components/layout/Layout';
import SEO from '../../components/ui/SEO';
import ArticleCard from '../../components/blog/ArticleCard';
import { getPublishedPosts } from '../../services/blog';

export default function BlogIndex({ posts, total, page, limit }) {
  const totalPages = Math.ceil(total / limit);

  return (
    <Layout>
      <SEO
        title="BDSM & Pro Domme Blog | DommeDirectory"
        description="Read the latest articles, safety guides, and tips from verified professional Dominatrices and the DommeDirectory team."
        canonical="https://dommedirectory.com/blog"
      />

      <main className="min-h-screen bg-primary pb-24">
        {/* Hero Section */}
        <section className="relative px-4 py-20 lg:py-24 max-w-7xl mx-auto text-center border-b border-default mb-16">
          <h1 className="font-heading text-4xl lg:text-5xl font-bold tracking-wider text-primary mb-6">
            The DommeDirectory Blog
          </h1>
          <p className="text-lg text-secondary max-w-2xl mx-auto">
            Insights, safety guides, and industry news directly from verified professional Dominatrices.
          </p>
        </section>

        {/* Content Section */}
        <section className="px-4 max-w-7xl mx-auto">
          {posts.length === 0 ? (
            <div className="text-center py-24 bg-card rounded-2xl border border-default">
              <h2 className="text-2xl font-heading font-semibold text-primary mb-2">No Articles Yet</h2>
              <p className="text-secondary mb-6">We are currently curating our first batch of professional articles.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {posts.map((post) => (
                <ArticleCard key={post.id} post={post} />
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-4 mt-16 pt-8 border-t border-default">
              {page > 1 ? (
                <a
                  href={`/blog?page=${page - 1}`}
                  className="px-6 py-2.5 bg-card hover:bg-tertiary border border-default rounded-lg text-primary text-sm font-medium transition-colors"
                >
                  Previous
                </a>
              ) : (
                <span className="px-6 py-2.5 border border-transparent text-muted text-sm font-medium">Previous</span>
              )}

              <span className="text-secondary text-sm font-medium">
                Page {page} of {totalPages}
              </span>

              {page < totalPages ? (
                <a
                  href={`/blog?page=${page + 1}`}
                  className="px-6 py-2.5 bg-card hover:bg-tertiary border border-default rounded-lg text-primary text-sm font-medium transition-colors"
                >
                  Next
                </a>
              ) : (
                <span className="px-6 py-2.5 border border-transparent text-muted text-sm font-medium">Next</span>
              )}
            </div>
          )}
        </section>
      </main>
    </Layout>
  );
}

// Highly crucial for SEO: server side rendering the blog index so crawlers see the links immediately
export async function getServerSideProps({ query }) {
  const page = parseInt(query.page, 10) || 1;
  const limit = 12;

  const { posts, total } = await getPublishedPosts({ page, limit });

  return {
    props: {
      posts: posts || [],
      total: total || 0,
      page,
      limit,
    },
  };
}