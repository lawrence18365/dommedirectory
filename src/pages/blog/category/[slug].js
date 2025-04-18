import Link from 'next/link';
import { useRouter } from 'next/router';
import { fetchCategories, fetchPosts } from '../../../services/blog';

export default function CategoryPage({ category, posts }) {
  const router = useRouter();

  if (router.isFallback) {
    return <div>Loading...</div>;
  }

  if (!category) {
    return <div>Category not found.</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">Category: {category.name}</h1>
      {posts.length === 0 && <p>No posts found in this category.</p>}
      <ul>
        {posts.map((post) => (
          <li key={post.id} className="mb-4">
            <Link href={`/blog/${post.slug}`}>
              <a className="text-xl font-semibold text-blue-600 hover:underline">{post.title}</a>
            </Link>
            <p>{post.excerpt}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

export async function getStaticPaths() {
  const categories = await fetchCategories();
  const paths = categories.map((category) => ({
    params: { slug: category.slug },
  }));

  return {
    paths,
    fallback: true,
  };
}

export async function getStaticProps({ params }) {
  const categories = await fetchCategories();
  const category = categories.find((c) => c.slug === params.slug);

  if (!category) {
    return {
      notFound: true,
    };
  }

  // Fetch posts by category id
  const { data: posts, error } = await fetchPostsByCategoryId(category.id);

  return {
    props: {
      category,
      posts: posts || [],
    },
    revalidate: 60,
  };
}

// Helper function to fetch posts by category id
async function fetchPostsByCategoryId(categoryId) {
  const { data, error } = await fetchPostsByCategory(categoryId);
  if (error) {
    return { data: [], error };
  }
  return { data, error };
}