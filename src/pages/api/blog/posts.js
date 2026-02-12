import { supabase } from '../../../utils/supabase';
import { getUserFromRequest } from '../../../services/auth';
import { withErrorHandler, Errors, createValidationErrors } from '../../../utils/apiErrors';
import { sanitizeString } from '../../../utils/validation';

async function handler(req, res) {
  const user = await getUserFromRequest(req);

  if (!user) {
    throw Errors.unauthorized('Authentication required');
  }

  if (req.method === 'GET') {
    // Fetch all posts
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .order('published_at', { ascending: false });

    if (error) {
      throw Errors.internal('Failed to fetch posts', error.message);
    }

    return res.status(200).json({
      success: true,
      data,
    });
  }

  if (req.method === 'POST') {
    // Validate required fields
    const { title, slug, content, excerpt, featured_image_url, status, published_at, category_id, meta_title, meta_description } = req.body;
    
    const validationErrors = {};
    
    if (!title || title.trim().length < 3) {
      validationErrors.title = 'Title is required and must be at least 3 characters';
    }
    
    if (!slug || slug.trim().length < 3) {
      validationErrors.slug = 'Slug is required and must be at least 3 characters';
    } else if (!/^[a-z0-9-]+$/.test(slug)) {
      validationErrors.slug = 'Slug must contain only lowercase letters, numbers, and hyphens';
    }
    
    if (!content || content.trim().length < 10) {
      validationErrors.content = 'Content is required and must be at least 10 characters';
    }
    
    if (Object.keys(validationErrors).length > 0) {
      throw createValidationErrors(validationErrors);
    }

    // Sanitize inputs
    const sanitizedData = {
      title: sanitizeString(title, 200),
      slug: sanitizeString(slug, 200),
      content: sanitizeString(content, 50000),
      excerpt: excerpt ? sanitizeString(excerpt, 500) : null,
      featured_image_url: featured_image_url ? sanitizeString(featured_image_url, 500) : null,
      status: ['draft', 'published'].includes(status) ? status : 'draft',
      published_at: published_at || null,
      category_id: category_id || null,
      author_id: user.id,
      meta_title: meta_title ? sanitizeString(meta_title, 70) : null,
      meta_description: meta_description ? sanitizeString(meta_description, 160) : null,
    };

    const { data, error } = await supabase
      .from('posts')
      .insert([sanitizedData])
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        throw Errors.conflict('A post with this slug already exists');
      }
      throw Errors.internal('Failed to create post', error.message);
    }

    return res.status(201).json({
      success: true,
      data,
    });
  }

  throw Errors.badRequest(`Method ${req.method} not allowed`);
}

export default withErrorHandler(handler);
