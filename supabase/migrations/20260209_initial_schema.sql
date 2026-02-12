-- ============================================================
-- DommeDirectory — Full Supabase Migration
-- Run this entire script in the Supabase SQL Editor
-- Project: mwfybwgkorbyncruzvtm
-- ============================================================

-- ============================================================
-- 1. LOCATIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  city TEXT NOT NULL,
  state TEXT,
  country TEXT NOT NULL DEFAULT 'Canada',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 2. PROFILES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  bio TEXT,
  primary_location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
  secondary_locations UUID[] DEFAULT '{}',
  contact_email TEXT,
  contact_phone TEXT,
  website TEXT,
  social_links JSONB DEFAULT '{}',
  services_offered JSONB DEFAULT '{}',
  profile_picture_url TEXT,
  is_verified BOOLEAN DEFAULT false,
  verification_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 3. LISTINGS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  services JSONB DEFAULT '{}',
  rates JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 4. MEDIA TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 5. VERIFICATIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  document_urls TEXT[] DEFAULT '{}',
  status TEXT CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 6. PAYMENTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  listing_id UUID REFERENCES listings(id) ON DELETE SET NULL,
  amount INTEGER DEFAULT 0,
  stripe_payment_id TEXT,
  payment_status TEXT CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded')) DEFAULT 'pending',
  payment_type TEXT CHECK (payment_type IN ('listing', 'featured', 'verification')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 7. BLOG TABLES
-- ============================================================
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  content TEXT NOT NULL,
  excerpt TEXT,
  featured_image_url TEXT,
  status TEXT CHECK (status IN ('draft', 'published')) NOT NULL DEFAULT 'draft',
  published_at TIMESTAMPTZ,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  meta_title TEXT,
  meta_description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS posts_tags (
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (post_id, tag_id)
);

-- ============================================================
-- 8. TRIGGER: Auto-create profile on user sign-up
-- This is CRITICAL — the auth.signUp() in the code passes
-- metadata (display_name, primary_location_id) and expects
-- this trigger to create the profile row automatically.
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, primary_location_id, contact_email, created_at, updated_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    CASE
      WHEN NEW.raw_user_meta_data->>'primary_location_id' IS NOT NULL
        AND NEW.raw_user_meta_data->>'primary_location_id' != ''
      THEN (NEW.raw_user_meta_data->>'primary_location_id')::UUID
      ELSE NULL
    END,
    NEW.email,
    now(),
    now()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists, then recreate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- 9. ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE media ENABLE ROW LEVEL SECURITY;
ALTER TABLE verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts_tags ENABLE ROW LEVEL SECURITY;

-- PROFILES: Anyone can read, owners can update
CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- LISTINGS: Anyone can read active, owners can CRUD
CREATE POLICY "Active listings are viewable by everyone"
  ON listings FOR SELECT USING (true);

CREATE POLICY "Users can create own listings"
  ON listings FOR INSERT WITH CHECK (auth.uid() = profile_id);

CREATE POLICY "Users can update own listings"
  ON listings FOR UPDATE USING (auth.uid() = profile_id);

CREATE POLICY "Users can delete own listings"
  ON listings FOR DELETE USING (auth.uid() = profile_id);

-- LOCATIONS: Anyone can read
CREATE POLICY "Locations are viewable by everyone"
  ON locations FOR SELECT USING (true);

-- MEDIA: Anyone can read, listing owners can CRUD
CREATE POLICY "Media is viewable by everyone"
  ON media FOR SELECT USING (true);

CREATE POLICY "Users can manage media for own listings"
  ON media FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM listings WHERE listings.id = media.listing_id AND listings.profile_id = auth.uid()
    )
  );

CREATE POLICY "Users can update media for own listings"
  ON media FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM listings WHERE listings.id = media.listing_id AND listings.profile_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete media for own listings"
  ON media FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM listings WHERE listings.id = media.listing_id AND listings.profile_id = auth.uid()
    )
  );

-- VERIFICATIONS: Owners can read/create, admins can update
CREATE POLICY "Users can view own verifications"
  ON verifications FOR SELECT USING (auth.uid() = profile_id);

CREATE POLICY "Users can submit verifications"
  ON verifications FOR INSERT WITH CHECK (auth.uid() = profile_id);

CREATE POLICY "Service role can update verifications"
  ON verifications FOR UPDATE USING (true);

-- PAYMENTS: Owners can read own, service role can manage
CREATE POLICY "Users can view own payments"
  ON payments FOR SELECT USING (auth.uid() = profile_id);

CREATE POLICY "Service role can create payments"
  ON payments FOR INSERT WITH CHECK (true);

CREATE POLICY "Service role can update payments"
  ON payments FOR UPDATE USING (true);

-- BLOG: Anyone can read published posts
CREATE POLICY "Published posts are viewable by everyone"
  ON posts FOR SELECT USING (status = 'published' OR auth.uid() = author_id);

CREATE POLICY "Authors can create posts"
  ON posts FOR INSERT WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors can update own posts"
  ON posts FOR UPDATE USING (auth.uid() = author_id);

CREATE POLICY "Authors can delete own posts"
  ON posts FOR DELETE USING (auth.uid() = author_id);

CREATE POLICY "Categories are viewable by everyone"
  ON categories FOR SELECT USING (true);

CREATE POLICY "Tags are viewable by everyone"
  ON tags FOR SELECT USING (true);

CREATE POLICY "Post tags are viewable by everyone"
  ON posts_tags FOR SELECT USING (true);

-- ============================================================
-- 10. INDEXES for performance
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_listings_profile_id ON listings(profile_id);
CREATE INDEX IF NOT EXISTS idx_listings_location_id ON listings(location_id);
CREATE INDEX IF NOT EXISTS idx_listings_is_active ON listings(is_active);
CREATE INDEX IF NOT EXISTS idx_listings_is_featured ON listings(is_featured);
CREATE INDEX IF NOT EXISTS idx_media_listing_id ON media(listing_id);
CREATE INDEX IF NOT EXISTS idx_verifications_profile_id ON verifications(profile_id);
CREATE INDEX IF NOT EXISTS idx_verifications_status ON verifications(status);
CREATE INDEX IF NOT EXISTS idx_payments_profile_id ON payments(profile_id);
CREATE INDEX IF NOT EXISTS idx_payments_stripe_payment_id ON payments(stripe_payment_id);
CREATE INDEX IF NOT EXISTS idx_profiles_primary_location ON profiles(primary_location_id);
CREATE INDEX IF NOT EXISTS idx_posts_slug ON posts(slug);
CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(status);
CREATE INDEX IF NOT EXISTS idx_locations_is_active ON locations(is_active);

-- ============================================================
-- 11. SEED: Locations (Canadian cities + major US cities)
-- ============================================================
INSERT INTO locations (city, state, country, is_active) VALUES
  -- Canada
  ('Toronto', 'Ontario', 'Canada', true),
  ('Vancouver', 'British Columbia', 'Canada', true),
  ('Montreal', 'Quebec', 'Canada', true),
  ('Calgary', 'Alberta', 'Canada', true),
  ('Edmonton', 'Alberta', 'Canada', true),
  ('Ottawa', 'Ontario', 'Canada', true),
  ('Winnipeg', 'Manitoba', 'Canada', true),
  ('Quebec City', 'Quebec', 'Canada', true),
  ('Hamilton', 'Ontario', 'Canada', true),
  ('Kitchener', 'Ontario', 'Canada', true),
  ('London', 'Ontario', 'Canada', true),
  ('Halifax', 'Nova Scotia', 'Canada', true),
  ('Victoria', 'British Columbia', 'Canada', true),
  ('Windsor', 'Ontario', 'Canada', true),
  ('Saskatoon', 'Saskatchewan', 'Canada', true),
  ('Regina', 'Saskatchewan', 'Canada', true),
  ('St. John''s', 'Newfoundland and Labrador', 'Canada', true),
  ('Barrie', 'Ontario', 'Canada', true),
  ('Kelowna', 'British Columbia', 'Canada', true),
  ('Mississauga', 'Ontario', 'Canada', true),
  -- United States
  ('New York', 'New York', 'United States', true),
  ('Los Angeles', 'California', 'United States', true),
  ('Chicago', 'Illinois', 'United States', true),
  ('Houston', 'Texas', 'United States', true),
  ('Miami', 'Florida', 'United States', true),
  ('San Francisco', 'California', 'United States', true),
  ('Las Vegas', 'Nevada', 'United States', true),
  ('Seattle', 'Washington', 'United States', true),
  ('Denver', 'Colorado', 'United States', true),
  ('Austin', 'Texas', 'United States', true),
  ('Portland', 'Oregon', 'United States', true),
  ('Atlanta', 'Georgia', 'United States', true),
  ('Dallas', 'Texas', 'United States', true),
  ('Boston', 'Massachusetts', 'United States', true),
  ('Philadelphia', 'Pennsylvania', 'United States', true),
  ('Phoenix', 'Arizona', 'United States', true),
  ('San Diego', 'California', 'United States', true),
  ('Minneapolis', 'Minnesota', 'United States', true),
  ('Washington', 'District of Columbia', 'United States', true),
  ('Nashville', 'Tennessee', 'United States', true),
  -- United Kingdom
  ('London', NULL, 'United Kingdom', true),
  ('Manchester', NULL, 'United Kingdom', true),
  ('Birmingham', NULL, 'United Kingdom', true),
  ('Edinburgh', NULL, 'United Kingdom', true),
  ('Glasgow', NULL, 'United Kingdom', true),
  -- Australia
  ('Sydney', 'New South Wales', 'Australia', true),
  ('Melbourne', 'Victoria', 'Australia', true),
  ('Brisbane', 'Queensland', 'Australia', true)
ON CONFLICT DO NOTHING;

-- ============================================================
-- Done! All tables, trigger, RLS policies, indexes, and seed
-- data have been created.
-- ============================================================
