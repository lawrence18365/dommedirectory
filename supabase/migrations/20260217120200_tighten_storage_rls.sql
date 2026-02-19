-- Tighten storage RLS: enforce ownership via folder path
-- Key format: {bucket}/{type}/{userId}/{filename}

-- Drop existing permissive policies (if they exist)
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated updates" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated deletes" ON storage.objects;

-- Re-create with ownership check: second folder segment must match auth.uid()
CREATE POLICY "Allow authenticated uploads"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    (storage.foldername(name))[2] = auth.uid()::text
  );

CREATE POLICY "Allow authenticated updates"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    (storage.foldername(name))[2] = auth.uid()::text
  )
  WITH CHECK (
    (storage.foldername(name))[2] = auth.uid()::text
  );

CREATE POLICY "Allow authenticated deletes"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    (storage.foldername(name))[2] = auth.uid()::text
  );
