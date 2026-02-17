import { uploadToB2, generateFileKey } from '../../../utils/b2';
import { getUserFromRequest } from '../../../services/auth';
import { applyRateLimit } from '../../../utils/rateLimit';
import formidable from 'formidable';
import fs from 'fs';

export const config = {
  api: {
    bodyParser: false,
  },
};

/**
 * Parse form data with formidable
 */
const parseForm = (req) => {
  return new Promise((resolve, reject) => {
    const form = formidable({
      maxFileSize: 10 * 1024 * 1024, // 10MB
      keepExtensions: true,
    });

    form.parse(req, (err, fields, files) => {
      if (err) reject(err);
      else resolve({ fields, files });
    });
  });
};

/**
 * Upload media to Backblaze B2
 * POST /api/media/upload
 * 
 * Body: multipart/form-data with:
 * - file: File blob
 * - type: 'profile' | 'listing' | 'verification'
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!applyRateLimit(req, res, { maxRequests: 30 })) return;

  try {
    // Authenticate user
    const user = await getUserFromRequest(req);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Parse the form
    const { fields, files } = await parseForm(req);
    
    const file = files.file;
    const type = fields.type?.[0] || 'profile';

    if (!file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    const uploadedFile = Array.isArray(file) ? file[0] : file;
    
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(uploadedFile.mimetype)) {
      return res.status(400).json({ 
        error: 'Invalid file type. Allowed: JPEG, PNG, WebP, GIF' 
      });
    }

    // Validate file magic bytes
    const fileBuffer = fs.readFileSync(uploadedFile.filepath);
    const header = fileBuffer.slice(0, 4).toString('hex');
    const validSignatures = [
      'ffd8ff',   // JPEG
      '89504e47', // PNG
      '52494646', // WebP (RIFF)
      '47494638', // GIF
    ];
    if (!validSignatures.some(sig => header.startsWith(sig))) {
      fs.unlinkSync(uploadedFile.filepath);
      return res.status(400).json({ error: 'File content does not match an allowed image type' });
    }

    // Generate unique key
    const folder = type === 'profile' ? 'profiles' : 
                   type === 'listing' ? 'listings' : 'verifications';
    const key = generateFileKey(
      user.id, 
      folder, 
      uploadedFile.originalFilename || 'image.jpg'
    );

    // Upload to B2
    const { url, error } = await uploadToB2(
      fileBuffer, 
      key, 
      uploadedFile.mimetype
    );

    // Clean up temp file
    fs.unlinkSync(uploadedFile.filepath);

    if (error) {
      console.error('Upload error:', error);
      return res.status(500).json({ error: 'Failed to upload file' });
    }

    return res.status(200).json({ url, key });
  } catch (error) {
    console.error('API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
