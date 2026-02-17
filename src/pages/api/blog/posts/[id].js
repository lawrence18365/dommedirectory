import {
  createAuthenticatedSupabaseClient,
  getAuthTokenFromRequest,
  getUserFromRequest,
} from '../../../../services/auth';

export default async function handler(req, res) {
  const token = getAuthTokenFromRequest(req);
  const user = await getUserFromRequest(req);
  const supabase = createAuthenticatedSupabaseClient(token);

  if (!user || !supabase) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { id } = req.query;

  if (req.method === 'PUT') {
    const { title, slug, content, excerpt, featured_image_url, status, published_at, category_id, meta_title, meta_description } = req.body;

    const { data, error } = await supabase
      .from('posts')
      .update({
        title,
        slug,
        content,
        excerpt,
        featured_image_url,
        status,
        published_at,
        category_id,
        meta_title,
        meta_description,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('author_id', user.id)
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: error.message || 'Failed to update post' });
    }

    return res.status(200).json({
      success: true,
      data,
    });
  }

  if (req.method === 'DELETE') {
    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('id', id)
      .eq('author_id', user.id);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
