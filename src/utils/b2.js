import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Backblaze B2 S3-compatible configuration
const b2Client = new S3Client({
  endpoint: `https://${process.env.B2_ENDPOINT}`,
  region: 'us-west-004',
  credentials: {
    accessKeyId: process.env.B2_KEY_ID || '',
    secretAccessKey: process.env.B2_APPLICATION_KEY || '',
  },
});

const bucketName = process.env.B2_BUCKET_NAME || 'dommedirectory';
const publicUrlBase = process.env.NEXT_PUBLIC_B2_PUBLIC_URL || `https://${process.env.B2_ENDPOINT}/${bucketName}`;

/**
 * Upload file directly to B2 (server-side)
 * @param {Buffer} fileBuffer - File buffer
 * @param {string} key - File path/key in bucket
 * @param {string} contentType - MIME type
 * @returns {Promise<{url: string, error: Error|null}>}
 */
export const uploadToB2 = async (fileBuffer, key, contentType) => {
  try {
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: fileBuffer,
      ContentType: contentType,
    });

    await b2Client.send(command);

    // Construct the public URL
    const url = `${publicUrlBase}/${key}`;
    return { url, error: null };
  } catch (error) {
    console.error('B2 upload error:', error);
    return { url: null, error };
  }
};

/**
 * Delete file from B2
 * @param {string} key - File path/key in bucket
 * @returns {Promise<{error: Error|null}>}
 */
export const deleteFromB2 = async (key) => {
  try {
    const command = new DeleteObjectCommand({
      Bucket: bucketName,
      Key: key,
    });

    await b2Client.send(command);
    return { error: null };
  } catch (error) {
    console.error('B2 delete error:', error);
    return { error };
  }
};

/**
 * Generate a unique file key for uploads
 * @param {string} userId - User ID
 * @param {string} type - Type of upload (profiles, listings, etc.)
 * @param {string} originalName - Original filename
 * @returns {string}
 */
export const generateFileKey = (userId, type, originalName) => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 10);
  const ext = originalName.split('.').pop().toLowerCase();
  return `${type}/${userId}/${timestamp}-${random}.${ext}`;
};

export { bucketName, publicUrlBase };
