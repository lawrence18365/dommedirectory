#!/usr/bin/env node
/**
 * Database Wipe Script
 * 
 * Usage:
 *   node scripts/wipe-database.js
 *   
 * Requires:
 *   - SUPABASE_URL environment variable
 *   - SUPABASE_SERVICE_ROLE_KEY environment variable
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Missing environment variables');
  console.error('   Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const tables = [
  'posts_tags',
  'media',
  'listings',
  'payments',
  'verifications',
  'posts',
  'profiles',
  'categories',
  'tags',
  'locations',
];

async function wipeDatabase() {
  console.log('⚠️  WARNING: This will DELETE all data from the database!');
  console.log('Tables to be wiped:', tables.join(', '));
  console.log('');
  
  // Check if we're in a production environment
  if (supabaseUrl.includes('supabase.co') && !process.env.FORCE_WIPE) {
    console.log('🔒 Production environment detected.');
    console.log('   Set FORCE_WIPE=true to proceed anyway.');
    console.log('');
  }
  
  console.log('To proceed, run: FORCE_WIPE=true node scripts/wipe-database.js');
  console.log('');
  
  if (process.env.FORCE_WIPE !== 'true') {
    console.log('❌ Aborting. Set FORCE_WIPE=true to confirm.');
    process.exit(0);
  }
  
  console.log('🗑️  Wiping database...\n');
  
  for (const table of tables) {
    try {
      const { error, count } = await supabase
        .from(table)
        .delete({ count: 'exact' })
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all rows
      
      if (error) {
        console.error(`❌ Error wiping ${table}:`, error.message);
      } else {
        console.log(`✅ ${table}: deleted ${count || 'all'} rows`);
      }
    } catch (err) {
      console.error(`❌ Failed to wipe ${table}:`, err.message);
    }
  }
  
  console.log('\n🎉 Database wipe complete!');
}

wipeDatabase().catch(console.error);
