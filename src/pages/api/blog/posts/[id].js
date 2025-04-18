import { supabase } from '../../../../utils/supabase';
import { getUserFromRequest } from '../../../../services/auth';

export default async function handler(req, res) {
  const user = await getUserFromRequest(req);

  if (!user) {
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
      })
      .eq('id', id);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json(data[0]);
  }

  if (req.method === 'DELETE') {
    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('id', id);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.status(204).end();
  }

  return res.status(405).json({ error: 'Method not allowed' });
}