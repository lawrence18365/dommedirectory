import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { fetchTags, createTag, updateTag, deleteTag } from '../../../services/blog';
import { getCurrentUser } from '../../../services/auth';
import { useForm } from 'react-hook-form';

export default function AdminTags() {
  const [tags, setTags] = useState([]);
  const [editingTag, setEditingTag] = useState(null);
  const router = useRouter();
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  useEffect(() => {
    const checkAuth = async () => {
      const { user, error } = await getCurrentUser();
      const isAdmin = user?.user_metadata?.user_type === 'admin';

      if (error || !user || !isAdmin) {
        router.push('/auth/login');
        return;
      }
      loadTags();
    };
    checkAuth();
  }, [router]);

  const loadTags = async () => {
    const tgs = await fetchTags();
    setTags(tgs);
  };

  const onSubmit = async (data) => {
    try {
      if (editingTag) {
        const { error } = await updateTag(editingTag.id, data);
        if (error) throw error;
      } else {
        const { error } = await createTag(data);
        if (error) throw error;
      }
      reset();
      setEditingTag(null);
      loadTags();
    } catch (error) {
      alert(error.message);
    }
  };

  const onEdit = (tag) => {
    setEditingTag(tag);
    reset(tag);
  };

  const onDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this tag?')) return;
    try {
      const { error } = await deleteTag(id);
      if (error) throw error;
      loadTags();
    } catch (error) {
      alert(error.message);
    }
  };

  const onCancel = () => {
    setEditingTag(null);
    reset();
  };

  return (
    <div className="container mx-auto p-4 max-w-3xl">
      <h1 className="text-3xl font-bold mb-4">Manage Tags</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="mb-6 space-y-4">
        <div>
          <label className="block font-semibold">Name</label>
          <input {...register('name', { required: true })} className="w-full border border-gray-300 rounded px-3 py-2" />
          {errors.name && <p className="text-red-600">Name is required</p>}
        </div>
        <div>
          <label className="block font-semibold">Slug</label>
          <input {...register('slug', { required: true })} className="w-full border border-gray-300 rounded px-3 py-2" />
          {errors.slug && <p className="text-red-600">Slug is required</p>}
        </div>
        <div>
          <button type="submit" className="px-4 py-2 bg-red-600 text-white rounded mr-2">
            {editingTag ? 'Update Tag' : 'Create Tag'}
          </button>
          {editingTag && (
            <button type="button" onClick={onCancel} className="px-4 py-2 bg-gray-400 text-white rounded">
              Cancel
            </button>
          )}
        </div>
      </form>
      <ul>
        {tags.map((tag) => (
          <li key={tag.id} className="mb-2 flex justify-between items-center border-b border-gray-200 pb-2">
            <div>
              <strong>{tag.name}</strong>
            </div>
            <div>
              <button onClick={() => onEdit(tag)} className="text-red-600 hover:underline mr-4">Edit</button>
              <button onClick={() => onDelete(tag.id)} className="text-red-600 hover:underline">Delete</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
