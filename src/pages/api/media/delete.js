import { deleteFromB2 } from '../../../utils/b2';
import { getUserFromRequest } from '../../../services/auth';
import { applyRateLimit } from '../../../utils/rateLimit';

/**
 * Delete media from Backblaze B2
 * POST /api/media/delete
 * 
 * Body: JSON with:
 * - key: File key in bucket
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!applyRateLimit(req, res, { maxRequests: 50 })) return;

  try {
    // Authenticate user
    const user = await getUserFromRequest(req);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { key } = req.body;

    if (!key) {
      return res.status(400).json({ error: 'No key provided' });
    }

    // Reject path traversal and null bytes
    if (key.includes('..') || key.includes('\0')) {
      return res.status(400).json({ error: 'Invalid key' });
    }

    // Security check: ensure user can only delete their own files
    // Key format: {type}/{userId}/{filename}
    const keyParts = key.split('/');
    if (keyParts.length < 3) {
      return res.status(400).json({ error: 'Invalid key format' });
    }

    const expectedPrefix = `${keyParts[0]}/${user.id}/`;
    if (!key.startsWith(expectedPrefix)) {
      return res.status(403).json({ error: 'Can only delete your own files' });
    }

    // Delete from B2
    const { error } = await deleteFromB2(key);

    if (error) {
      console.error('Delete error:', error);
      return res.status(500).json({ error: 'Failed to delete file' });
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
