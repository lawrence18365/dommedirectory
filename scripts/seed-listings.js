#!/usr/bin/env node

/**
 * Seed Listings Script
 * Creates sample listings in the database for demo purposes
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

// Sample listing data
const sampleListings = [
  {
    title: 'Professional Dominatrix - Toronto',
    description: 'Experienced dominatrix specializing in CBT, discipline, and psychological domination. Private dungeon with full equipment. Sessions tailored to your limits and desires.',
    services: ['CBT', 'Discipline', 'Bondage', 'Humiliation', 'Roleplay'],
    rates: { hourly: 400, twoHours: 700, overnight: 2500 },
    city: 'Toronto',
    display_name: 'MistressViper',
  },
  {
    title: 'Goddess of Financial Domination',
    description: 'Elite financial dominatrix based in NYC. I excel at wallet draining, humiliation, and luxury worship. Tribute required for attention.',
    services: ['Findom', 'Humiliation', 'Luxury Worship', 'Blackmail Fantasy'],
    rates: { hourly: 500, tribute: 200 },
    city: 'New York',
    display_name: 'GoddessLilith',
  },
  {
    title: 'Shibari & Rope Bondage Expert',
    description: 'Certified rope bondage practitioner. Safe, sane, consensual sessions focusing on Japanese shibari techniques. Beginners welcome.',
    services: ['Shibari', 'Rope Bondage', 'Suspension', 'Sensory Play'],
    rates: { hourly: 350, twoHours: 600 },
    city: 'Los Angeles',
    display_name: 'DominaAlexis',
  },
  {
    title: 'Sensual Domination & Body Worship',
    description: 'Mature, sophisticated domme offering sensual domination, tease and denial, and body worship sessions. Discretion guaranteed.',
    services: ['Sensual Domination', 'Tease & Denial', 'Body Worship', 'Foot Fetish'],
    rates: { hourly: 300, '90min': 400 },
    city: 'London',
    display_name: 'MistressVelvet',
  },
  {
    title: 'Impact Play Specialist',
    description: 'Caning, paddling, and flogging expert. From light sensation play to severe discipline. Safe words always respected.',
    services: ['Caning', 'Paddling', 'Flogging', 'Spanking', 'Impact Play'],
    rates: { hourly: 250, twoHours: 450 },
    city: 'Montreal',
    display_name: 'QueenSadie',
  },
  {
    title: 'Roleplay & Humiliation Mistress',
    description: 'Creative roleplay scenarios and intense humiliation sessions. Sissy training, forced feminization, and degradation specialties.',
    services: ['Roleplay', 'Humiliation', 'Sissy Training', 'Forced Feminization'],
    rates: { hourly: 300, extended: 800 },
    city: 'Chicago',
    display_name: 'LadyScorpio',
  },
  {
    title: 'Luxury Miami Domination Experience',
    description: 'High-end domination services in private South Beach location. VIP treatment with champagne, spa facilities, and premium equipment.',
    services: ['Luxury Sessions', 'CBT', 'Bondage', 'Worship'],
    rates: { hourly: 600, vipPackage: 2000 },
    city: 'Miami',
    display_name: 'MistressOnyx',
  },
  {
    title: 'Asian Dominatrix - Vancouver',
    description: 'Strict Asian goddess specializing in foot worship, trampling, and Asian-style discipline. Fluent in English and Mandarin.',
    services: ['Foot Worship', 'Trampling', 'Discipline', 'Ballbusting'],
    rates: { hourly: 350, twoHours: 600 },
    city: 'Vancouver',
    display_name: 'GoddessRaven',
  },
  {
    title: 'Tech Domme - Silicon Valley',
    description: 'Tech-savvy dominatrix offering device control, remote sessions, and cyber domination. Also available for in-person.',
    services: ['Remote Sessions', 'Device Control', 'Chastity', 'Blackmail Fantasy'],
    rates: { hourly: 400, remote: 200 },
    city: 'San Francisco',
    display_name: 'MistressIvy',
  },
  {
    title: 'Las Vegas Fantasy Sessions',
    description: 'Vegas-based domme offering fantasy roleplay, dungeon rentals, and overnight stays. Hotel visits available on Strip.',
    services: ['Fantasy Roleplay', 'Dungeon Rental', 'Overnight', 'Couples'],
    rates: { hourly: 450, overnight: 3000 },
    city: 'Las Vegas',
    display_name: 'DommeSerena',
  },
  {
    title: 'Australian Goddess - Sydney',
    description: 'Experienced Australian dominatrix. Strict but fair. Specializing in corporal punishment and slave training.',
    services: ['Corporal Punishment', 'Slave Training', 'Protocol', 'Discipline'],
    rates: { hourly: 500, training: 1500 },
    city: 'Sydney',
    display_name: 'LadyViper',
  },
  {
    title: 'German Discipline & Medical Play',
    description: 'Berlin-style precision domination. Medical play, catheterization, and extreme bondage. Very experienced with safety protocols.',
    services: ['Medical Play', 'Extreme Bondage', 'Catheterization', 'Needle Play'],
    rates: { hourly: 400, session: 700 },
    city: 'Berlin',
    display_name: 'MistressCrimson',
  },
];

async function getLocations() {
  const { data, error } = await supabase
    .from('locations')
    .select('id, city');
  
  if (error) {
    console.error('Error fetching locations:', error);
    return {};
  }
  
  const map = {};
  data.forEach(loc => {
    map[loc.city] = loc.id;
  });
  return map;
}

async function getProfiles() {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, display_name');
  
  if (error) {
    console.error('Error fetching profiles:', error);
    return [];
  }
  
  return data || [];
}

async function createProfile(displayName, locationId) {
  // Create a new user in auth.users first (using service role)
  const email = `${displayName.toLowerCase().replace(/[^a-z0-9]/g, '')}@demo.dommedirectory.com`;
  
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password: 'DemoPassword123!',
    email_confirm: true,
    user_metadata: {
      display_name: displayName,
      primary_location_id: locationId,
    },
  });
  
  if (authError) {
    console.error(`Error creating auth user for ${displayName}:`, authError);
    return null;
  }
  
  // Profile should be auto-created by trigger, but let's verify
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', authData.user.id)
    .single();
  
  if (profileError || !profile) {
    console.error(`Profile not found for ${displayName}, creating manually...`);
    const { data: newProfile, error: createError } = await supabase
      .from('profiles')
      .insert({
        id: authData.user.id,
        display_name: displayName,
        primary_location_id: locationId,
        contact_email: email,
        bio: `Professional dominatrix based in ${displayName.split(' ').pop()}.`,
      })
      .select()
      .single();
    
    if (createError) {
      console.error(`Error creating profile for ${displayName}:`, createError);
      return null;
    }
    return newProfile;
  }
  
  return profile;
}

async function seedListings() {
  console.log('🌱 Seeding listings...\n');
  
  const locations = await getLocations();
  console.log(`📍 Found ${Object.keys(locations).length} locations`);
  
  const existingProfiles = await getProfiles();
  console.log(`👤 Found ${existingProfiles.length} existing profiles`);
  
  let created = 0;
  let skipped = 0;
  
  for (const listing of sampleListings) {
    const locationId = locations[listing.city];
    
    if (!locationId) {
      console.log(`⚠️  Skipping ${listing.display_name} - location "${listing.city}" not found`);
      skipped++;
      continue;
    }
    
    // Check if profile exists, create if not
    let profile = existingProfiles.find(p => p.display_name === listing.display_name);
    
    if (!profile) {
      console.log(`👤 Creating profile for ${listing.display_name}...`);
      profile = await createProfile(listing.display_name, locationId);
      if (profile) {
        existingProfiles.push(profile);
      }
    }
    
    if (!profile) {
      console.log(`❌ Could not create/get profile for ${listing.display_name}`);
      skipped++;
      continue;
    }
    
    // Check if listing already exists
    const { data: existingListing } = await supabase
      .from('listings')
      .select('id')
      .eq('profile_id', profile.id)
      .maybeSingle();
    
    if (existingListing) {
      console.log(`⏭️  ${listing.display_name} already has a listing`);
      skipped++;
      continue;
    }
    
    // Create the listing
    const { error: listingError } = await supabase
      .from('listings')
      .insert({
        profile_id: profile.id,
        location_id: locationId,
        title: listing.title,
        description: listing.description,
        services: listing.services.reduce((acc, s) => ({ ...acc, [s]: true }), {}),
        rates: listing.rates,
        is_active: true,
        is_featured: Math.random() > 0.7, // 30% chance of being featured
      });
    
    if (listingError) {
      console.error(`❌ Error creating listing for ${listing.display_name}:`, listingError);
      skipped++;
    } else {
      console.log(`✅ Created listing for ${listing.display_name}`);
      created++;
    }
  }
  
  console.log(`\n📊 Summary:`);
  console.log(`   Created: ${created}`);
  console.log(`   Skipped: ${skipped}`);
  console.log(`\n✨ Done!`);
}

seedListings().catch(console.error);
