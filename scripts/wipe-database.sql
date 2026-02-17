-- ============================================================
-- WIPE DATABASE - Remove ALL data while keeping schema
-- Run this in Supabase SQL Editor
-- WARNING: This will DELETE all data! Cannot be undone!
-- ============================================================

-- Start transaction
BEGIN;

-- Disable triggers temporarily to avoid cascading issues
ALTER TABLE profiles DISABLE TRIGGER on_auth_user_created;

-- Delete data in order (respecting foreign keys)
-- 1. Junction tables first
DELETE FROM posts_tags;

-- 2. Tables with foreign keys
DELETE FROM media;
DELETE FROM listings;
DELETE FROM payments;
DELETE FROM verifications;
DELETE FROM posts;

-- 3. Core tables
DELETE FROM profiles;
DELETE FROM categories;
DELETE FROM tags;
DELETE FROM locations;

-- 4. Delete auth users (optional - uncomment if you want to delete users too)
-- DELETE FROM auth.users WHERE id NOT IN (
--   SELECT id FROM auth.users WHERE email LIKE '%@supabase.io'  -- Keep Supabase system users if any
-- );

-- Reset sequences (optional - starts IDs from 1 again)
-- Note: UUIDs don't have sequences, this is for any serial/bigserial columns

-- Re-enable triggers
ALTER TABLE profiles ENABLE TRIGGER on_auth_user_created;

-- Commit transaction
COMMIT;

-- Verify cleanup (should all return 0)
SELECT 'posts_tags' as table_name, COUNT(*) as row_count FROM posts_tags
UNION ALL SELECT 'media', COUNT(*) FROM media
UNION ALL SELECT 'listings', COUNT(*) FROM listings
UNION ALL SELECT 'payments', COUNT(*) FROM payments
UNION ALL SELECT 'verifications', COUNT(*) FROM verifications
UNION ALL SELECT 'posts', COUNT(*) FROM posts
UNION ALL SELECT 'profiles', COUNT(*) FROM profiles
UNION ALL SELECT 'categories', COUNT(*) FROM categories
UNION ALL SELECT 'tags', COUNT(*) FROM tags
UNION ALL SELECT 'locations', COUNT(*) FROM locations;
