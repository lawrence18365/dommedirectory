-- ============================================================
-- COMPLETE WIPE - Remove ALL data + Auth Users + Storage
-- Run this in Supabase SQL Editor
-- ⚠️  WARNING: DESTRUCTIVE - Cannot be undone!
-- ============================================================

-- Start transaction
BEGIN;

-- Disable triggers temporarily
ALTER TABLE profiles DISABLE TRIGGER on_auth_user_created;

-- Delete data in order (respecting foreign keys)
DELETE FROM posts_tags;
DELETE FROM media;
DELETE FROM listings;
DELETE FROM payments;
DELETE FROM verifications;
DELETE FROM posts;
DELETE FROM profiles;
DELETE FROM categories;
DELETE FROM tags;
DELETE FROM locations;

-- Delete ALL auth users (including yourself!)
DELETE FROM auth.users;

-- Re-enable triggers
ALTER TABLE profiles ENABLE TRIGGER on_auth_user_created;

-- Commit transaction
COMMIT;

-- ============================================
-- STORAGE CLEANUP (run separately if needed)
-- ============================================
-- Go to Supabase Dashboard > Storage > Buckets
-- Delete all objects in these buckets:
-- - listings
-- - verifications
-- - profiles
-- - blog

-- Or use Storage API to delete programmatically
