import { useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { fetchPostBySlug, fetchPosts } from '../../services/blog';
import Layout from '../../components/layout/Layout';

export default function Post({ post }) {
  const router = useRouter();

  if (router.isFallback) {
    return <div>Loading...</div>;
  }

  if (!post) {
    return <div>Post not found.</div>;
  }

  return (
    <Layout>
      <>
        <Head>
          <title>{post.meta_title || post.title}</title>
          <meta name="description" content={post.meta_description || post.excerpt} />
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "BlogPosting",
                "headline": post.title,
                "image": post.featured_image_url,
                "author": {
                  "@type": "Person",
                  "name": "Author Name" // TODO: Replace with actual author name
                },
                "datePublished": post.published_at,
                "description": post.excerpt,
              }),
            }}
          />
        </Head>
        <article className="container mx-auto px-4 py-8 md:px-6 lg:px-8 max-w-3xl"> {/* Added max-width */}
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold mb-6 text-gray-900">{post.title}</h1>
          {/* Optional: Add author/date info here */}
          {post.featured_image_url && (
            <img
              src={post.featured_image_url}
              alt={post.title}
              className="w-full h-auto rounded-lg shadow-md my-8" // Improved image styling
            />
          )}
          {/* Apply prose classes for typography styling */}
          <div className="prose prose-lg lg:prose-xl max-w-none mt-8" dangerouslySetInnerHTML={{ __html: post.content }} />
        </article>
      </>
    </Layout>
  );
}

export async function getStaticPaths() {
  const posts = await fetchPosts({ page: 1, pageSize: 100 }); // Limit to 100 posts for static generation
  const paths = posts.map((post) => ({
    params: { slug: post.slug },
  }));

  return {
    paths,
    fallback: true,
  };
}

export async function getStaticProps({ params }) {
  const post = await fetchPostBySlug(params.slug);

  return {
    props: {
      post,
    },
    revalidate: 60, // Revalidate every 60 seconds
  };
}