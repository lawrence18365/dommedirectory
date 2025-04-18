import { supabase } from '../../../utils/supabase';
import { getUserFromRequest } from '../../../services/auth';

export default async function handler(req, res) {
  const user = await getUserFromRequest(req);

  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method === 'GET') {
    // Fetch all posts
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .order('published_at', { ascending: false });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json(data);
  }

  if (req.method === 'POST') {
    // Create new post
    const { title, slug, content, excerpt, featured_image_url, status, published_at, category_id, meta_title, meta_description } = req.body;

    const { data, error } = await supabase
      .from('posts')
      .insert([
        {
          title,
          slug,
          content,
          excerpt,
          featured_image_url,
          status,
          published_at,
          category_id,
          author_id: user.id,
          meta_title,
          meta_description,
        },
      ]);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.status(201).json(data[0]);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}