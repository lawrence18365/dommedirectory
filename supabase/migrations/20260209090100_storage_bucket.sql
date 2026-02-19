-- Create storage bucket for media (images/videos)
-- NSFW content allowed (legal adult content only)

-- Create the bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('media', 'media', true)
ON CONFLICT (id) DO NOTHING;

-- Policy: Anyone can view media (public bucket)
CREATE POLICY "Media is publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'media');

-- Policy: Authenticated users can upload their own media
CREATE POLICY "Users can upload their own media"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'media' 
  AND auth.role() = 'authenticated'
);

-- Policy: Users can update their own media
CREATE POLICY "Users can update their own media"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'media' 
  AND auth.role() = 'authenticated'
);

-- Policy: Users can delete their own media
CREATE POLICY "Users can delete their own media"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'media' 
  AND auth.role() = 'authenticated'
);
