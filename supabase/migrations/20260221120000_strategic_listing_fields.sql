-- ============================================================
-- DommeDirectory — Strategic Structured Data Fields
-- Description: Adds structured fields to profiles and listings
-- that power programmatic SEO, search filters, and provider lock-in.
--
-- Every field here = a new filterable dimension = thousands of
-- auto-generated long-tail landing pages at scale.
-- ============================================================

-- =====================
-- PROFILES: Provider-level structured data
-- =====================

-- Experience level (trust signal, filterable, SEO dimension)
-- "experienced dominatrix toronto" is a real search query
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS experience_years INTEGER;

-- Languages spoken (critical for international cities)
-- "french speaking dominatrix toronto" has near-zero competition
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS languages TEXT[] DEFAULT '{}';

-- External booking link (makes the profile a real landing page)
-- Providers link TO us from Twitter when their profile is their homepage
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS booking_link TEXT;

-- Cached completeness score (0-100) for ranking and nudges
-- Higher completeness = better position in city listings
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS completeness_score INTEGER DEFAULT 0;


-- =====================
-- LISTINGS: Service-level structured data
-- =====================

-- Session format: incall, outcall, virtual
-- This TRIPLES SEO surface area — each is a distinct search intent
ALTER TABLE listings ADD COLUMN IF NOT EXISTS session_formats JSONB DEFAULT '{}';

-- Available session durations
-- "2 hour bdsm session toronto" is a different query than "full day"
ALTER TABLE listings ADD COLUMN IF NOT EXISTS session_durations JSONB DEFAULT '{}';

-- Accepts beginners (massive search volume)
-- "first time dominatrix session" / "dominatrix for beginners" = top of funnel gateway
ALTER TABLE listings ADD COLUMN IF NOT EXISTS accepts_beginners BOOLEAN;

-- Deposit requirements (practical client info, trust signal)
ALTER TABLE listings ADD COLUMN IF NOT EXISTS deposit_required BOOLEAN;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS deposit_amount TEXT;

-- Minimum advance notice (practical, filterable for "same day" searches)
-- Values: same_day, 24h, 48h, one_week
ALTER TABLE listings ADD COLUMN IF NOT EXISTS minimum_notice TEXT;

-- Space type: own_space, outcall_only, hotel, flexible
-- "dungeon sessions toronto" is a real search query
ALTER TABLE listings ADD COLUMN IF NOT EXISTS space_type TEXT;


-- =====================
-- INDEXES for filter queries
-- =====================

-- GIN index on session_formats for JSONB containment queries
CREATE INDEX IF NOT EXISTS idx_listings_session_formats
  ON listings USING GIN (session_formats);

-- Partial index for beginner-friendly filter
CREATE INDEX IF NOT EXISTS idx_listings_accepts_beginners
  ON listings (accepts_beginners) WHERE accepts_beginners = true;

-- GIN index on languages for array containment queries
CREATE INDEX IF NOT EXISTS idx_profiles_languages
  ON profiles USING GIN (languages);

-- Index on experience for range filtering
CREATE INDEX IF NOT EXISTS idx_profiles_experience_years
  ON profiles (experience_years) WHERE experience_years IS NOT NULL;

-- Index on completeness for ranking
CREATE INDEX IF NOT EXISTS idx_profiles_completeness_score
  ON profiles (completeness_score DESC);
