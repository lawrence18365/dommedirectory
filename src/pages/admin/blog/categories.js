import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { fetchCategories, createCategory, updateCategory, deleteCategory } from '../../../services/blog';
import { getCurrentUser } from '../../../services/auth';
import { useForm } from 'react-hook-form';

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [editingCategory, setEditingCategory] = useState(null);
  const router = useRouter();
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  useEffect(() => {
    const checkAuth = async () => {
      const { user, error } = await getCurrentUser();
      if (error || !user) {
        router.push('/auth/login');
        return;
      }
      loadCategories();
    };
    checkAuth();
  }, [router]);

  const loadCategories = async () => {
    const cats = await fetchCategories();
    setCategories(cats);
  };

  const onSubmit = async (data) => {
    try {
      if (editingCategory) {
        await updateCategory(editingCategory.id, data);
      } else {
        await createCategory(data);
      }
      reset();
      setEditingCategory(null);
      loadCategories();
    } catch (error) {
      alert(error.message);
    }
  };

  const onEdit = (category) => {
    setEditingCategory(category);
    reset(category);
  };

  const onDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this category?')) return;
    try {
      await deleteCategory(id);
      loadCategories();
    } catch (error) {
      alert(error.message);
    }
  };

  const onCancel = () => {
    setEditingCategory(null);
    reset();
  };

  return (
    <div className="container mx-auto p-4 max-w-3xl">
      <h1 className="text-3xl font-bold mb-4">Manage Categories</h1>
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
          <label className="block font-semibold">Description</label>
          <textarea {...register('description')} rows={3} className="w-full border border-gray-300 rounded px-3 py-2" />
        </div>
        <div>
          <button type="submit" className="px-4 py-2 bg-red-600 text-white rounded mr-2">
            {editingCategory ? 'Update Category' : 'Create Category'}
          </button>
          {editingCategory && (
            <button type="button" onClick={onCancel} className="px-4 py-2 bg-gray-400 text-white rounded">
              Cancel
            </button>
          )}
        </div>
      </form>
      <ul>
        {categories.map((cat) => (
          <li key={cat.id} className="mb-2 flex justify-between items-center border-b border-gray-200 pb-2">
            <div>
              <strong>{cat.name}</strong> - {cat.description}
            </div>
            <div>
              <button onClick={() => onEdit(cat)} className="text-red-600 hover:underline mr-4">Edit</button>
              <button onClick={() => onDelete(cat.id)} className="text-red-600 hover:underline">Delete</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}