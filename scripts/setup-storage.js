#!/usr/bin/env node

/**
 * Setup Supabase Storage Bucket
 * Run this once to create the 'media' bucket
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables:');
  console.error('   NEXT_PUBLIC_SUPABASE_URL');
  console.error('   SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupStorage() {
  console.log('🔧 Setting up Supabase Storage...\n');

  try {
    // Check if bucket exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('Error listing buckets:', listError);
      return;
    }

    const mediaBucket = buckets.find(b => b.name === 'media');

    if (mediaBucket) {
      console.log('✅ Storage bucket "media" already exists');
    } else {
      // Create the bucket
      const { data, error: createError } = await supabase.storage.createBucket('media', {
        public: true,  // Public bucket - files accessible via URL
        allowedMimeTypes: [
          'image/jpeg',
          'image/png',
          'image/gif',
          'image/webp',
          'video/mp4',
          'video/webm'
        ],
        fileSizeLimit: 10485760,  // 10MB limit
      });

      if (createError) {
        console.error('❌ Error creating bucket:', createError);
        return;
      }

      console.log('✅ Created storage bucket "media"');
    }

    console.log('\n📋 Storage Configuration:');
    console.log('   Bucket: media');
    console.log('   Public: true');
    console.log('   Max file size: 10MB');
    console.log('   Allowed types: images, videos');
    console.log('\n⚠️  Note: Set up RLS policies in Supabase Dashboard');
    console.log('   Storage → Policies → New Policy');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

setupStorage();
