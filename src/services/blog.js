import { supabase } from '../utils/supabase';

// Fetch all posts with optional pagination
export async function fetchPosts({ page = 1, pageSize = 10 } = {}) {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .order('published_at', { ascending: false })
    .range(from, to);

  if (error) throw error;
  return data;
}

// Fetch post by slug
export async function fetchPostBySlug(slug) {
  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error) throw error;
  return data;
}

// Fetch categories
export async function fetchCategories() {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('name');

  if (error) throw error;
  return data;
}

// Fetch tags
export async function fetchTags() {
  const { data, error } = await supabase
    .from('tags')
    .select('*')
    .order('name');

  if (error) throw error;
  return data;
}

// Fetch posts by category id
export async function fetchPostsByCategory(categoryId) {
  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .eq('category_id', categoryId)
    .order('published_at', { ascending: false });

  if (error) throw error;
  return data;
}

// Fetch posts by tag id
export async function fetchPostsByTag(tagId) {
  const { data, error } = await supabase
    .from('posts_tags')
    .select('posts(*)')
    .eq('tag_id', tagId)
    .order('posts.published_at', { ascending: false });

  if (error) throw error;
  return data.map((item) => item.posts);
}

// Fetch post by id
export async function fetchPostById(id) {
  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

// Create category
export async function createCategory(category) {
  const { data, error } = await supabase
    .from('categories')
    .insert([category]);

  if (error) throw error;
  return data[0];
}

// Update category
export async function updateCategory(id, category) {
  const { data, error } = await supabase
    .from('categories')
    .update(category)
    .eq('id', id);

  if (error) throw error;
  return data[0];
}

// Delete category
export async function deleteCategory(id) {
  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', id);

  if (error) throw error;
  return true;
}

// Create tag
export async function createTag(tag) {
  const { data, error } = await supabase
    .from('tags')
    .insert([tag]);

  if (error) throw error;
  return data[0];
}

// Update tag
export async function updateTag(id, tag) {
  const { data, error } = await supabase
    .from('tags')
    .update(tag)
    .eq('id', id);

  if (error) throw error;
  return data[0];
}

// Delete tag
export async function deleteTag(id) {
  const { error } = await supabase
    .from('tags')
    .delete()
    .eq('id', id);

  if (error) throw error;
  return true;
}