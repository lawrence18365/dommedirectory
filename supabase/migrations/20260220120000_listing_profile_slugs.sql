BEGIN;

ALTER TABLE listings
  ADD COLUMN IF NOT EXISTS slug TEXT;

CREATE TABLE IF NOT EXISTS listing_slug_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  slug TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_listings_slug_unique
  ON listings(slug)
  WHERE slug IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_listing_slug_history_slug_unique
  ON listing_slug_history(slug);

CREATE INDEX IF NOT EXISTS idx_listing_slug_history_listing_created
  ON listing_slug_history(listing_id, created_at DESC);

ALTER TABLE listing_slug_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Listing slug history is viewable by everyone" ON listing_slug_history;
CREATE POLICY "Listing slug history is viewable by everyone"
  ON listing_slug_history
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Owners can create slug history for own listings" ON listing_slug_history;
CREATE POLICY "Owners can create slug history for own listings"
  ON listing_slug_history
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM listings
      WHERE listings.id = listing_slug_history.listing_id
        AND listings.profile_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Service role can manage listing slug history" ON listing_slug_history;
CREATE POLICY "Service role can manage listing slug history"
  ON listing_slug_history
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE OR REPLACE FUNCTION public.slugify_text(value TEXT)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT NULLIF(TRIM(BOTH '-' FROM REGEXP_REPLACE(LOWER(COALESCE(value, '')), '[^a-z0-9]+', '-', 'g')), '');
$$;

CREATE OR REPLACE FUNCTION public.compute_listing_slug_base(p_listing_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  name_slug TEXT;
  city_slug TEXT;
  state_slug TEXT;
BEGIN
  SELECT
    COALESCE(public.slugify_text(COALESCE(NULLIF(TRIM(p.display_name), ''), NULLIF(TRIM(l.title), ''), 'profile')), 'profile'),
    COALESCE(public.slugify_text(COALESCE(NULLIF(TRIM(loc.city), ''), NULLIF(TRIM(loc.country), ''), 'city')), 'city'),
    COALESCE(public.slugify_text(COALESCE(NULLIF(TRIM(loc.state), ''), NULLIF(TRIM(loc.country), ''), 'na')), 'na')
  INTO name_slug, city_slug, state_slug
  FROM listings l
  LEFT JOIN profiles p ON p.id = l.profile_id
  LEFT JOIN locations loc ON loc.id = l.location_id
  WHERE l.id = p_listing_id;

  IF name_slug IS NULL THEN
    RETURN NULL;
  END IF;

  RETURN name_slug || '-' || city_slug || '-' || state_slug;
END;
$$;

CREATE OR REPLACE FUNCTION public.next_available_listing_slug(
  p_base_slug TEXT,
  p_listing_id UUID DEFAULT NULL
)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  normalized_base TEXT := COALESCE(public.slugify_text(p_base_slug), 'profile');
  candidate TEXT;
  suffix INTEGER := 1;
BEGIN
  LOOP
    candidate := CASE
      WHEN suffix = 1 THEN normalized_base
      ELSE normalized_base || '-' || suffix::TEXT
    END;

    IF NOT EXISTS (
      SELECT 1
      FROM listings l
      WHERE l.slug = candidate
        AND (p_listing_id IS NULL OR l.id <> p_listing_id)
    )
    AND NOT EXISTS (
      SELECT 1
      FROM listing_slug_history h
      WHERE h.slug = candidate
    ) THEN
      RETURN candidate;
    END IF;

    suffix := suffix + 1;

    IF suffix > 10000 THEN
      RAISE EXCEPTION 'Unable to allocate unique profile slug for base: %', normalized_base;
    END IF;
  END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION public.rotate_listing_slug(p_listing_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  old_slug TEXT;
  base_slug TEXT;
  new_slug TEXT;
BEGIN
  SELECT slug
  INTO old_slug
  FROM listings
  WHERE id = p_listing_id;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  base_slug := public.compute_listing_slug_base(p_listing_id);

  IF base_slug IS NULL THEN
    RETURN old_slug;
  END IF;

  new_slug := public.next_available_listing_slug(base_slug, p_listing_id);

  IF old_slug IS DISTINCT FROM new_slug THEN
    IF old_slug IS NOT NULL AND NULLIF(TRIM(old_slug), '') IS NOT NULL THEN
      INSERT INTO listing_slug_history (listing_id, slug)
      VALUES (p_listing_id, old_slug)
      ON CONFLICT (slug) DO NOTHING;
    END IF;

    UPDATE listings
    SET slug = new_slug
    WHERE id = p_listing_id;
  END IF;

  RETURN new_slug;
END;
$$;

CREATE OR REPLACE FUNCTION public.trg_rotate_listing_slug()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM public.rotate_listing_slug(NEW.id);
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.trg_rotate_profile_listings_slug()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  row_record RECORD;
BEGIN
  FOR row_record IN
    SELECT id
    FROM listings
    WHERE profile_id = NEW.id
  LOOP
    PERFORM public.rotate_listing_slug(row_record.id);
  END LOOP;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.trg_rotate_location_listings_slug()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  row_record RECORD;
BEGIN
  FOR row_record IN
    SELECT id
    FROM listings
    WHERE location_id = NEW.id
  LOOP
    PERFORM public.rotate_listing_slug(row_record.id);
  END LOOP;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_listings_rotate_slug_on_insert ON listings;
CREATE TRIGGER trg_listings_rotate_slug_on_insert
  AFTER INSERT ON listings
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_rotate_listing_slug();

DROP TRIGGER IF EXISTS trg_listings_rotate_slug_on_update ON listings;
CREATE TRIGGER trg_listings_rotate_slug_on_update
  AFTER UPDATE OF title, location_id, profile_id ON listings
  FOR EACH ROW
  WHEN (
    OLD.title IS DISTINCT FROM NEW.title
    OR OLD.location_id IS DISTINCT FROM NEW.location_id
    OR OLD.profile_id IS DISTINCT FROM NEW.profile_id
  )
  EXECUTE FUNCTION public.trg_rotate_listing_slug();

DROP TRIGGER IF EXISTS trg_profiles_rotate_listing_slugs ON profiles;
CREATE TRIGGER trg_profiles_rotate_listing_slugs
  AFTER UPDATE OF display_name ON profiles
  FOR EACH ROW
  WHEN (OLD.display_name IS DISTINCT FROM NEW.display_name)
  EXECUTE FUNCTION public.trg_rotate_profile_listings_slug();

DROP TRIGGER IF EXISTS trg_locations_rotate_listing_slugs ON locations;
CREATE TRIGGER trg_locations_rotate_listing_slugs
  AFTER UPDATE OF city, state, country ON locations
  FOR EACH ROW
  WHEN (
    OLD.city IS DISTINCT FROM NEW.city
    OR OLD.state IS DISTINCT FROM NEW.state
    OR OLD.country IS DISTINCT FROM NEW.country
  )
  EXECUTE FUNCTION public.trg_rotate_location_listings_slug();

DO $$
DECLARE
  row_record RECORD;
BEGIN
  FOR row_record IN
    SELECT id
    FROM listings
    ORDER BY created_at ASC, id ASC
  LOOP
    PERFORM public.rotate_listing_slug(row_record.id);
  END LOOP;
END;
$$;

ALTER TABLE listings
  ALTER COLUMN slug SET NOT NULL;

COMMIT;
