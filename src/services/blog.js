import { supabase, isSupabaseConfigured } from '../utils/supabase';
import { sanitizeString } from '../utils/validation';

const DEFAULT_PAGE_SIZE = 10;

export const fetchPosts = async (options = {}) => {
  const {
    page = 1,
    pageSize = DEFAULT_PAGE_SIZE,
    includeDrafts = false,
    authorId = null,
  } = options;

  try {
    if (!isSupabaseConfigured) {
      return [];
    }

    const from = Math.max(0, (page - 1) * pageSize);
    const to = from + Math.max(1, pageSize) - 1;

    let query = supabase
      .from('posts')
      .select('*, categories(id, name, slug)')
      .order('published_at', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (!includeDrafts) {
      query = query.eq('status', 'published');
    }

    if (authorId) {
      query = query.eq('author_id', authorId);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching posts:', error.message);
    return [];
  }
};

export const fetchPostById = async (id) => {
  try {
    if (!isSupabaseConfigured) {
      return null;
    }

    const { data, error } = await supabase
      .from('posts')
      .select('*, categories(id, name, slug)')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data || null;
  } catch (error) {
    console.error('Error fetching post by id:', error.message);
    return null;
  }
};

export const fetchPostBySlug = async (slug) => {
  try {
    if (!isSupabaseConfigured) {
      return null;
    }

    const { data, error } = await supabase
      .from('posts')
      .select('*, categories(id, name, slug)')
      .eq('slug', slug)
      .eq('status', 'published')
      .maybeSingle();

    if (error) throw error;
    return data || null;
  } catch (error) {
    console.error('Error fetching post by slug:', error.message);
    return null;
  }
};

export const createPost = async (postData, authorId) => {
  try {
    if (!isSupabaseConfigured) {
      return { post: null, error: new Error('Supabase is not configured') };
    }

    const payload = {
      title: sanitizeString(postData.title, 200),
      slug: sanitizeString(postData.slug, 200),
      content: sanitizeString(postData.content, 50000),
      excerpt: postData.excerpt ? sanitizeString(postData.excerpt, 500) : null,
      featured_image_url: postData.featured_image_url
        ? sanitizeString(postData.featured_image_url, 500)
        : null,
      status: ['draft', 'published'].includes(postData.status) ? postData.status : 'draft',
      published_at: postData.published_at || null,
      category_id: postData.category_id || null,
      author_id: authorId,
      meta_title: postData.meta_title ? sanitizeString(postData.meta_title, 70) : null,
      meta_description: postData.meta_description
        ? sanitizeString(postData.meta_description, 160)
        : null,
    };

    const { data, error } = await supabase
      .from('posts')
      .insert([payload])
      .select()
      .single();

    if (error) throw error;
    return { post: data, error: null };
  } catch (error) {
    console.error('Error creating post:', error.message);
    return { post: null, error };
  }
};

export const updatePost = async (id, postData, authorId = null) => {
  try {
    if (!isSupabaseConfigured) {
      return { post: null, error: new Error('Supabase is not configured') };
    }

    const payload = {
      title: sanitizeString(postData.title, 200),
      slug: sanitizeString(postData.slug, 200),
      content: sanitizeString(postData.content, 50000),
      excerpt: postData.excerpt ? sanitizeString(postData.excerpt, 500) : null,
      featured_image_url: postData.featured_image_url
        ? sanitizeString(postData.featured_image_url, 500)
        : null,
      status: ['draft', 'published'].includes(postData.status) ? postData.status : 'draft',
      published_at: postData.published_at || null,
      category_id: postData.category_id || null,
      meta_title: postData.meta_title ? sanitizeString(postData.meta_title, 70) : null,
      meta_description: postData.meta_description
        ? sanitizeString(postData.meta_description, 160)
        : null,
      updated_at: new Date().toISOString(),
    };

    let query = supabase
      .from('posts')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (authorId) {
      query = query.eq('author_id', authorId);
    }

    const { data, error } = await query;

    if (error) throw error;
    return { post: data, error: null };
  } catch (error) {
    console.error('Error updating post:', error.message);
    return { post: null, error };
  }
};

export const deletePost = async (id, authorId = null) => {
  try {
    if (!isSupabaseConfigured) {
      return { error: new Error('Supabase is not configured') };
    }

    let query = supabase.from('posts').delete().eq('id', id);

    if (authorId) {
      query = query.eq('author_id', authorId);
    }

    const { error } = await query;

    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('Error deleting post:', error.message);
    return { error };
  }
};

export const fetchCategories = async () => {
  try {
    if (!isSupabaseConfigured) {
      return [];
    }

    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching categories:', error.message);
    return [];
  }
};

export const createCategory = async (categoryData) => {
  try {
    if (!isSupabaseConfigured) {
      return { category: null, error: new Error('Supabase is not configured') };
    }

    const payload = {
      name: sanitizeString(categoryData.name, 100),
      slug: sanitizeString(categoryData.slug, 120),
      description: categoryData.description
        ? sanitizeString(categoryData.description, 500)
        : null,
    };

    const { data, error } = await supabase
      .from('categories')
      .insert([payload])
      .select()
      .single();

    if (error) throw error;
    return { category: data, error: null };
  } catch (error) {
    console.error('Error creating category:', error.message);
    return { category: null, error };
  }
};

export const updateCategory = async (id, categoryData) => {
  try {
    if (!isSupabaseConfigured) {
      return { category: null, error: new Error('Supabase is not configured') };
    }

    const payload = {
      name: sanitizeString(categoryData.name, 100),
      slug: sanitizeString(categoryData.slug, 120),
      description: categoryData.description
        ? sanitizeString(categoryData.description, 500)
        : null,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('categories')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return { category: data, error: null };
  } catch (error) {
    console.error('Error updating category:', error.message);
    return { category: null, error };
  }
};

export const deleteCategory = async (id) => {
  try {
    if (!isSupabaseConfigured) {
      return { error: new Error('Supabase is not configured') };
    }

    const { error } = await supabase.from('categories').delete().eq('id', id);

    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('Error deleting category:', error.message);
    return { error };
  }
};

export const fetchTags = async () => {
  try {
    if (!isSupabaseConfigured) {
      return [];
    }

    const { data, error } = await supabase
      .from('tags')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching tags:', error.message);
    return [];
  }
};

export const createTag = async (tagData) => {
  try {
    if (!isSupabaseConfigured) {
      return { tag: null, error: new Error('Supabase is not configured') };
    }

    const payload = {
      name: sanitizeString(tagData.name, 100),
      slug: sanitizeString(tagData.slug, 120),
    };

    const { data, error } = await supabase
      .from('tags')
      .insert([payload])
      .select()
      .single();

    if (error) throw error;
    return { tag: data, error: null };
  } catch (error) {
    console.error('Error creating tag:', error.message);
    return { tag: null, error };
  }
};

export const updateTag = async (id, tagData) => {
  try {
    if (!isSupabaseConfigured) {
      return { tag: null, error: new Error('Supabase is not configured') };
    }

    const payload = {
      name: sanitizeString(tagData.name, 100),
      slug: sanitizeString(tagData.slug, 120),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('tags')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return { tag: data, error: null };
  } catch (error) {
    console.error('Error updating tag:', error.message);
    return { tag: null, error };
  }
};

export const deleteTag = async (id) => {
  try {
    if (!isSupabaseConfigured) {
      return { error: new Error('Supabase is not configured') };
    }

    const { error } = await supabase.from('tags').delete().eq('id', id);

    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('Error deleting tag:', error.message);
    return { error };
  }
};

export const fetchPostsByTag = async (tagId) => {
  try {
    if (!isSupabaseConfigured) {
      return [];
    }

    const { data, error } = await supabase
      .from('posts_tags')
      .select('posts(*)')
      .eq('tag_id', tagId);

    if (error) throw error;
    return (data || []).map((row) => row.posts).filter(Boolean);
  } catch (error) {
    console.error('Error fetching posts by tag:', error.message);
    return [];
  }
};
