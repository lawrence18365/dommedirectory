BEGIN;

-- Reviews were referenced in app code but never created in schema.
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  content TEXT NOT NULL,
  is_approved BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Approved reviews are viewable by everyone" ON reviews;
CREATE POLICY "Approved reviews are viewable by everyone"
  ON reviews FOR SELECT USING (
    is_approved = true OR auth.uid() = reviewer_id OR auth.uid() = profile_id
  );

DROP POLICY IF EXISTS "Users can create own reviews" ON reviews;
CREATE POLICY "Users can create own reviews"
  ON reviews FOR INSERT WITH CHECK (auth.uid() = reviewer_id);

DROP POLICY IF EXISTS "Users can delete own reviews" ON reviews;
CREATE POLICY "Users can delete own reviews"
  ON reviews FOR DELETE USING (auth.uid() = reviewer_id);

CREATE INDEX IF NOT EXISTS idx_reviews_listing_id ON reviews(listing_id);
CREATE INDEX IF NOT EXISTS idx_reviews_profile_id ON reviews(profile_id);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewer_id ON reviews(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_reviews_is_approved ON reviews(is_approved);

-- Tighten policies that were previously open with USING (true).
DROP POLICY IF EXISTS "Service role can update verifications" ON verifications;
CREATE POLICY "Service role can update verifications"
  ON verifications FOR UPDATE
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role can create payments" ON payments;
CREATE POLICY "Direct payment inserts are disabled"
  ON payments FOR INSERT WITH CHECK (false);

DROP POLICY IF EXISTS "Service role can update payments" ON payments;
CREATE POLICY "Direct payment updates are disabled"
  ON payments FOR UPDATE USING (false);

-- Blog taxonomy management is admin-only.
DROP POLICY IF EXISTS "Admins can create categories" ON categories;
CREATE POLICY "Admins can create categories"
  ON categories FOR INSERT
  WITH CHECK ((auth.jwt() -> 'user_metadata' ->> 'user_type') = 'admin');

DROP POLICY IF EXISTS "Admins can update categories" ON categories;
CREATE POLICY "Admins can update categories"
  ON categories FOR UPDATE
  USING ((auth.jwt() -> 'user_metadata' ->> 'user_type') = 'admin')
  WITH CHECK ((auth.jwt() -> 'user_metadata' ->> 'user_type') = 'admin');

DROP POLICY IF EXISTS "Admins can delete categories" ON categories;
CREATE POLICY "Admins can delete categories"
  ON categories FOR DELETE
  USING ((auth.jwt() -> 'user_metadata' ->> 'user_type') = 'admin');

DROP POLICY IF EXISTS "Admins can create tags" ON tags;
CREATE POLICY "Admins can create tags"
  ON tags FOR INSERT
  WITH CHECK ((auth.jwt() -> 'user_metadata' ->> 'user_type') = 'admin');

DROP POLICY IF EXISTS "Admins can update tags" ON tags;
CREATE POLICY "Admins can update tags"
  ON tags FOR UPDATE
  USING ((auth.jwt() -> 'user_metadata' ->> 'user_type') = 'admin')
  WITH CHECK ((auth.jwt() -> 'user_metadata' ->> 'user_type') = 'admin');

DROP POLICY IF EXISTS "Admins can delete tags" ON tags;
CREATE POLICY "Admins can delete tags"
  ON tags FOR DELETE
  USING ((auth.jwt() -> 'user_metadata' ->> 'user_type') = 'admin');

DROP POLICY IF EXISTS "Admins can create post tags" ON posts_tags;
CREATE POLICY "Admins can create post tags"
  ON posts_tags FOR INSERT
  WITH CHECK ((auth.jwt() -> 'user_metadata' ->> 'user_type') = 'admin');

DROP POLICY IF EXISTS "Admins can delete post tags" ON posts_tags;
CREATE POLICY "Admins can delete post tags"
  ON posts_tags FOR DELETE
  USING ((auth.jwt() -> 'user_metadata' ->> 'user_type') = 'admin');

COMMIT;
