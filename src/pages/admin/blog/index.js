import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { fetchPosts } from '../../../services/blog';
import { getCurrentUser } from '../../../services/auth';

export default function AdminBlog() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const { user, error } = await getCurrentUser();
      if (error || !user) {
        router.push('/auth/login');
        return;
      }
      setLoading(true);
      fetchPosts({ page: 1, pageSize: 100 })
        .then((data) => {
          setPosts(data);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    };
    checkAuth();
  }, [router]);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">Admin Blog Posts</h1>
      <Link href="/admin/blog/new">
        <a className="mb-4 inline-block px-4 py-2 bg-red-600 text-white rounded">Create New Post</a>
      </Link>
      {loading && <p>Loading...</p>}
      {!loading && posts.length === 0 && <p>No posts found.</p>}
      <table className="min-w-full border border-gray-300">
        <thead>
          <tr className="bg-gray-100">
            <th className="border border-gray-300 px-4 py-2">Title</th>
            <th className="border border-gray-300 px-4 py-2">Status</th>
            <th className="border border-gray-300 px-4 py-2">Published At</th>
            <th className="border border-gray-300 px-4 py-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {posts.map((post) => (
            <tr key={post.id}>
              <td className="border border-gray-300 px-4 py-2">{post.title}</td>
              <td className="border border-gray-300 px-4 py-2">{post.status}</td>
              <td className="border border-gray-300 px-4 py-2">{post.published_at ? new Date(post.published_at).toLocaleDateString() : '-'}</td>
              <td className="border border-gray-300 px-4 py-2">
                <Link href={`/admin/blog/edit/${post.id}`}>
                  <a className="text-red-600 hover:underline mr-2">Edit</a>
                </Link>
                <button
                  className="text-red-600 hover:underline"
                  onClick={() => alert('Delete functionality not implemented yet')}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}