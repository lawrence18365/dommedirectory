-- SEO profile fields: tagline, faq, service_area_miles
-- tagline: short keyword-rich headline used in meta descriptions and JSON-LD schema
-- faq: [{question, answer}] array for FAQ schema rich results
-- service_area_miles: travel radius from primary location for geo schema

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS tagline TEXT,
  ADD COLUMN IF NOT EXISTS faq JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS service_area_miles INTEGER;
