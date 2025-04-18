import Link from 'next/link';
import { useRouter } from 'next/router';
import { fetchTags, fetchPostsByTag } from '../../../services/blog';

export default function TagPage({ tag, posts }) {
  const router = useRouter();

  if (router.isFallback) {
    return <div>Loading...</div>;
  }

  if (!tag) {
    return <div>Tag not found.</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">Tag: {tag.name}</h1>
      {posts.length === 0 && <p>No posts found with this tag.</p>}
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
  const tags = await fetchTags();
  const paths = tags.map((tag) => ({
    params: { slug: tag.slug },
  }));

  return {
    paths,
    fallback: true,
  };
}

export async function getStaticProps({ params }) {
  const tags = await fetchTags();
  const tag = tags.find((t) => t.slug === params.slug);

  if (!tag) {
    return {
      notFound: true,
    };
  }

  // Fetch posts by tag id
  const { data: posts, error } = await fetchPostsByTagId(tag.id);

  return {
    props: {
      tag,
      posts: posts || [],
    },
    revalidate: 60,
  };
}

// Helper function to fetch posts by tag id
async function fetchPostsByTagId(tagId) {
  const { data, error } = await fetchPostsByTag(tagId);
  if (error) {
    return { data: [], error };
  }
  return { data, error };
}