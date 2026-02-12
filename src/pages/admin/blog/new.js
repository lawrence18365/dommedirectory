import { useForm } from 'react-hook-form';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { fetchCategories } from '../../../services/blog';

export default function NewPost() {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [categories, setCategories] = useState([]);
  const router = useRouter();

  useEffect(() => {
    fetchCategories().then(setCategories);
  }, []);

  const onSubmit = async (data) => {
    try {
      const response = await fetch('/api/blog/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create post');
      router.push('/admin/blog');
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-3xl">
      <h1 className="text-3xl font-bold mb-4">Create New Post</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block font-semibold">Title</label>
          <input {...register('title', { required: true })} className="w-full border border-gray-300 rounded px-3 py-2" />
          {errors.title && <p className="text-red-600">Title is required</p>}
        </div>
        <div>
          <label className="block font-semibold">Slug</label>
          <input {...register('slug', { required: true })} className="w-full border border-gray-300 rounded px-3 py-2" />
          {errors.slug && <p className="text-red-600">Slug is required</p>}
        </div>
        <div>
          <label className="block font-semibold">Content (HTML)</label>
          <textarea {...register('content', { required: true })} rows={10} className="w-full border border-gray-300 rounded px-3 py-2" />
          {errors.content && <p className="text-red-600">Content is required</p>}
        </div>
        <div>
          <label className="block font-semibold">Excerpt</label>
          <textarea {...register('excerpt')} rows={3} className="w-full border border-gray-300 rounded px-3 py-2" />
        </div>
        <div>
          <label className="block font-semibold">Featured Image URL</label>
          <input {...register('featured_image_url')} className="w-full border border-gray-300 rounded px-3 py-2" />
        </div>
        <div>
          <label className="block font-semibold">Status</label>
          <select {...register('status')} className="w-full border border-gray-300 rounded px-3 py-2">
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
        </div>
        <div>
          <label className="block font-semibold">Published At</label>
          <input type="datetime-local" {...register('published_at')} className="w-full border border-gray-300 rounded px-3 py-2" />
        </div>
        <div>
          <label className="block font-semibold">Category</label>
          <select {...register('category_id')} className="w-full border border-gray-300 rounded px-3 py-2">
            <option value="">Select category</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block font-semibold">Meta Title</label>
          <input {...register('meta_title')} className="w-full border border-gray-300 rounded px-3 py-2" />
        </div>
        <div>
          <label className="block font-semibold">Meta Description</label>
          <textarea {...register('meta_description')} rows={3} className="w-full border border-gray-300 rounded px-3 py-2" />
        </div>
        <button type="submit" className="px-4 py-2 bg-red-600 text-white rounded">Create Post</button>
      </form>
    </div>
  );
}