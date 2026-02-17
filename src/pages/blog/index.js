import { useState, useEffect } from 'react';
import Link from 'next/link';
import { fetchPosts } from '../../services/blog';
import Layout from '../../components/layout/Layout';

export default function Blog() {
  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetchPosts({ page, pageSize: 10 })
      .then((data) => {
        setPosts(data || []); // Set posts or empty array if data is null/undefined
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching posts:", error);
        setPosts([]); // Set empty array on error
        setLoading(false);
      });
  }, [page]);

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 md:px-6 lg:px-8">
        <h1 className="text-4xl md:text-5xl font-extrabold mb-8 text-gray-800 border-b-4 border-red-600 pb-3">Our Blog</h1>
        {loading && (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-red-600"></div>
          </div>
        )}
        {!loading && posts.length === 0 && (
          <div className="text-center py-16">
            <h2 className="text-2xl font-semibold text-gray-700 mb-4">No Posts Yet</h2>
            <p className="text-gray-500">Check back soon for updates!</p>
          </div>
        )}
        {!loading && posts.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.map((post) => (
              <div
                key={post.id}
                className="bg-white rounded-xl shadow-md overflow-hidden transition-transform duration-300 ease-in-out hover:shadow-xl hover:-translate-y-1 flex flex-col"
              >
                {post.featured_image_url && (
                  <img className="h-48 w-full object-cover" src={post.featured_image_url} alt={post.title} />
                )}
                <div className="p-6 flex flex-col flex-grow">
                  <Link href={`/blog/${post.slug}`} legacyBehavior>
                    <a className="block mt-1 text-xl leading-tight font-bold text-gray-900 hover:text-red-700 transition duration-150 ease-in-out">
                      {post.title}
                    </a>
                  </Link>
                  <p className="mt-3 text-gray-600 text-base flex-grow">{post.excerpt}</p>
                  <Link href={`/blog/${post.slug}`} legacyBehavior>
                    <a className="inline-block mt-4 text-red-600 hover:text-red-800 font-semibold group">
                      Read more <span className="transition-transform duration-150 ease-in-out group-hover:translate-x-1">&rarr;</span>
                    </a>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
        {/* Basic Pagination - Consider replacing with a more robust solution if many pages are expected */}
        {!loading && posts.length > 0 && (
          <div className="flex justify-center space-x-4 mt-12">
            <button
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              disabled={page === 1}
              className="px-6 py-2 border border-red-600 text-red-600 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-red-600 hover:text-white transition duration-150 ease-in-out"
            >
              &larr; Previous
            </button>
            <span className="px-4 py-2 text-gray-700">Page {page}</span>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={posts.length < 10}
              className="px-6 py-2 border border-red-600 text-red-600 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-red-600 hover:text-white transition duration-150 ease-in-out"
            >
              Next &rarr;
            </button>
          </div>
        )}
      </div>
    </Layout>
  );
}