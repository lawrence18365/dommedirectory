import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Layout from '../../components/layout/Layout';
import SEO from '../../components/ui/SEO';
import { getPostBySlug } from '../../services/blog';
import { formatDate } from '../../utils/date';
import DOMPurify from 'isomorphic-dompurify';

export default function BlogPost({ post }) {
  const router = useRouter();

  if (router.isFallback) {
    return (
      <Layout>
        <div className="flex justify-center items-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent-primary"></div>
        </div>
      </Layout>
    );
  }

  if (!post) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
          <h1 className="text-4xl font-heading font-bold text-primary mb-4">Post Not Found</h1>
          <p className="text-secondary mb-8">The article you are looking for has been moved or deleted.</p>
          <Link href="/blog" className="px-6 py-3 bg-accent-primary hover:bg-accent-hover text-white rounded-lg font-medium transition-colors">
            Return to Blog
          </Link>
        </div>
      </Layout>
    );
  }

  const category = post.categories ? post.categories.name : null;
  const imageUrl = post.featured_image_url || '/images/default-blog-hero.jpg';

  // Build JSON-LD Article Schema
  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.meta_title || post.title,
    description: post.meta_description || post.excerpt,
    image: imageUrl,
    datePublished: post.published_at || post.created_at,
    dateModified: post.updated_at,
    author: {
      '@type': 'Organization',
      name: 'DommeDirectory',
      url: 'https://dommedirectory.com',
    },
    publisher: {
      '@type': 'Organization',
      name: 'DommeDirectory',
      logo: {
        '@type': 'ImageObject',
        url: 'https://dommedirectory.com/logo.png',
      },
    },
  };

  return (
    <Layout>
      <SEO
        title={post.meta_title || post.title}
        description={post.meta_description || post.excerpt}
        canonical={`https://dommedirectory.com/blog/${post.slug}`}
        ogImage={imageUrl}
        jsonLd={articleSchema}
      />

      <main className="min-h-screen bg-primary pb-24 selection:bg-accent-primary/30">

        {/* Post Header */}
        <header className="pt-20 pb-12 px-4 max-w-4xl mx-auto text-center">
          {category && (
            <Link
              href={`/blog?category=${post.categories.slug}`}
              className="inline-block mb-6 tracking-wide text-xs font-semibold uppercase text-accent-light hover:text-white transition-colors"
            >
              {category}
            </Link>
          )}

          <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl font-bold text-primary mb-6 leading-[1.15]">
            {post.title}
          </h1>

          <div className="flex items-center justify-center gap-4 text-sm text-secondary font-medium">
            <time dateTime={post.published_at}>
              {formatDate(post.published_at || post.created_at)}
            </time>
            <span>•</span>
            <span>By DommeDirectory Team</span>
          </div>
        </header>

        {/* Featured Image */}
        {imageUrl && (
          <div className="px-4 max-w-5xl mx-auto mb-16">
            <div className="relative aspect-[21/9] w-full overflow-hidden rounded-2xl border border-default bg-tertiary">
              <img
                src={imageUrl}
                alt={post.title}
                className="absolute inset-0 w-full h-full object-cover"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = 'https://images.unsplash.com/photo-1519751138087-5bf79df62d5b?auto=format&fit=crop&q=80&w=1200'; // Fallback
                }}
              />
            </div>
          </div>
        )}

        {/* Post Content */}
        {/* Using typography plugin prose classes customized for our dark theme */}
        <article className="px-4 max-w-3xl mx-auto">
          <div
            className="prose prose-invert prose-lg md:prose-xl max-w-none
              prose-headings:font-heading prose-headings:font-semibold prose-headings:text-primary 
              prose-a:text-accent-light hover:prose-a:text-white prose-a:transition-colors prose-a:no-underline hover:prose-a:underline
              prose-img:rounded-xl prose-img:border prose-img:border-default
              prose-blockquote:border-l-accent-primary prose-blockquote:bg-tertiary prose-blockquote:py-2 prose-blockquote:pr-4 prose-blockquote:rounded-r-lg
              prose-strong:text-white prose-li:text-secondary text-secondary leading-relaxed"
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(post.content) }}
          />

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="mt-16 pt-8 border-t border-default flex flex-wrap gap-2">
              <span className="text-secondary text-sm font-medium mr-2 self-center">Tags:</span>
              {post.tags.map(tag => (
                <span key={tag.slug} className="px-3 py-1 bg-tertiary border border-default rounded-full text-xs text-secondary font-medium">
                  {tag.name}
                </span>
              ))}
            </div>
          )}
        </article>

      </main>
    </Layout>
  );
}

// Ensure pages are statically generated with SSR fallback for lightning fast SEO loads
export async function getServerSideProps({ params }) {
  const { slug } = params;
  const { post, error } = await getPostBySlug(slug);

  if (error || !post) {
    return {
      notFound: true,
    };
  }

  return {
    props: {
      post,
    },
  };
}
