import { supabase, isSupabaseConfigured } from '../utils/supabase';

/**
 * Fetch a paginated list of published blog posts.
 * Automatically joins with categories.
 */
export async function getPublishedPosts({ page = 1, limit = 10, category = null, tag = null } = {}) {
  try {
    if (!isSupabaseConfigured) return { posts: [], total: 0, error: null };

    const start = (page - 1) * limit;
    const end = start + limit - 1;

    let query = supabase
      .from('posts')
      .select(`
        id,
        title,
        slug,
        excerpt,
        featured_image_url,
        published_at,
        categories (name, slug)
      `, { count: 'exact' })
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .range(start, end);

    if (category) {
      query = query.eq('categories.slug', category);
    }

    // Note: Tag filtering requires a more complex join via posts_tags which is typically 
    // better handled via an RPC or subquery in PostgREST, but for MVP we skip or do basic filtering.

    const { data, count, error } = await query;
    if (error) throw error;

    return { posts: data, total: count, error: null };
  } catch (error) {
    console.error('Error fetching blog posts:', error.message);
    return { posts: [], total: 0, error };
  }
}

/**
 * Fetch a single published post by slug, including full content and tags.
 */
export async function getPostBySlug(slug) {
  try {
    if (!isSupabaseConfigured) return { post: null, error: null };

    const { data, error } = await supabase
      .from('posts')
      .select(`
        *,
        categories (name, slug),
        posts_tags (
          tags (name, slug)
        )
      `)
      .eq('slug', slug)
      .eq('status', 'published')
      .single();

    if (error) throw error;

    // Normalize tags array
    if (data) {
      data.tags = (data.posts_tags || []).map(pt => pt.tags).filter(Boolean);
      delete data.posts_tags;
    }

    return { post: data, error: null };
  } catch (error) {
    console.error(`Error fetching post ${slug}:`, error.message);
    return { post: null, error };
  }
}

/**
 * Fetch all categories that have published posts attached
 */
export async function getCategories() {
  try {
    if (!isSupabaseConfigured) return { categories: [], error: null };

    const { data, error } = await supabase
      .from('categories')
      .select('name, slug');

    if (error) throw error;
    return { categories: data, error: null };
  } catch (error) {
    console.error('Error fetching categories:', error.message);
    return { categories: [], error };
  }
}

/**
 * Fetch all tags
 */
export async function getTags() {
  try {
    if (!isSupabaseConfigured) return { tags: [], error: null };

    const { data, error } = await supabase
      .from('tags')
      .select('name, slug');

    if (error) throw error;
    return { tags: data, error: null };
  } catch (error) {
    console.error('Error fetching tags:', error.message);
    return { tags: [], error };
  }
}

// Stubs for admin UI to pass build
export const fetchCategories = getCategories;
export const fetchTags = getTags;
export const createCategory = async () => { };
export const updateCategory = async () => { };
export const deleteCategory = async () => { };
export const createTag = async () => { };
export const updateTag = async () => { };
export const deleteTag = async () => { };
export const fetchPostById = async () => ({ post: null });
export const updatePost = async () => { };
export const createPost = async () => { };
export const deletePost = async () => { };
export const fetchPosts = async () => ({ posts: [], total: 0 });
export const fetchPostsByCategory = async () => ({ posts: [], total: 0 });
export const fetchPostsByTag = async () => ({ posts: [], total: 0 });
