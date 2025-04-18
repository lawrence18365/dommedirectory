// services/locations.js
import { supabase } from '../utils/supabase';

/**
 * Get all locations
 */
export const getAllLocations = async () => {
  try {
    const { data, error } = await supabase
      .from('locations')
      .select('id, city, state, country, is_active') // Remove slug - it does not exist
      .eq('is_active', true)
      .order('country', { ascending: true })
      .order('state', { ascending: true })
      .order('city', { ascending: true });

    if (error) throw error;
    return { locations: data, error: null };
  } catch (error) {
    console.error('Error fetching locations:', error.message);
    return { locations: null, error };
  }
};

/**
 * Get locations grouped by country and state
 */
export const getLocationsGrouped = async () => {
  try {
    const { locations, error } = await getAllLocations();
    
    if (error) throw error;
    
    // Group locations by country and state
    const grouped = locations.reduce((acc, location) => {
      // Create country if it doesn't exist
      if (!acc[location.country]) {
        acc[location.country] = {};
      }
      
      // Create state if it doesn't exist
      if (!acc[location.country][location.state]) {
        acc[location.country][location.state] = [];
      }
      
      // Add city to state
      acc[location.country][location.state].push({
        id: location.id,
        city: location.city // Remove slug reference
      });
      
      return acc;
    }, {});
    
    return { grouped, error: null };
  } catch (error) {
    console.error('Error grouping locations:', error.message);
    return { grouped: null, error };
  }
};

/**
 * Get location by ID
 * @param {string} locationId 
 */
export const getLocationById = async (locationId) => {
  try {
    const { data, error } = await supabase
      .from('locations')
      .select('*')
      .eq('id', locationId)
      .single();

    if (error) throw error;
    return { location: data, error: null };
  } catch (error) {
    console.error('Error fetching location:', error.message);
    return { location: null, error };
  }
};

/**
 * Get location by slug
 * @param {string} slug
 */
export const getLocationBySlug = async (slug) => {
  // Basic slugification for lookup (lowercase) - adjust if your slugs are different
  const lookupSlug = slug.toLowerCase();
  try {
    const { data, error } = await supabase
      .from('locations')
      .select('*')
      // Query by city name using case-insensitive matching
      // Note: This might return the wrong city if names are duplicated across states/countries
      // A more robust solution would involve slugs or additional URL parameters (e.g., /location/ca/bc/vancouver)
      .ilike('city', lookupSlug)
      .maybeSingle(); // Use maybeSingle to handle 0 or 1 result gracefully

    if (error) throw error;
    // Handle case where no location is found for the slug
    if (!data) {
      return { location: null, error: { message: `Location not found for slug: ${slug}` } };
    }
    // Handle case where no location is found for the city name
    if (!data) {
      // Return a more specific error or null location
      return { location: null, error: { message: `Location not found for city: ${slug}` } };
    }
    return { location: data, error: null };
  } catch (error) {
    console.error(`Error fetching location by city (${slug}):`, error.message);
    return { location: null, error };
  }
};

/**
 * Get listings by location
 * @param {string} locationId
 * @param {Object} options - Options for filtering and pagination
 */
export const getListingsByLocation = async (locationId, options = {}) => {
  try {
    let query = supabase
      .from('listings')
      .select(`
        *,
        profiles!inner(id, display_name),
        media(id, storage_path, is_primary)
      `)
      .eq('location_id', locationId)
      .eq('is_active', true);
    
    // Add featured filter if specified
    if (options.featured) {
      query = query.eq('is_featured', true);
    }
    
    // Add pagination
    if (options.limit) {
      query = query.limit(options.limit);
    }
    
    if (options.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
    }
    
    // Add ordering
    query = query.order('created_at', { ascending: false });
    
    const { data, error } = await query;

    if (error) throw error;
    
    // Process listings to get primary image
    const processedListings = data.map(listing => {
      const primaryImage = listing.media.find(m => m.is_primary) || listing.media[0] || null;
      return {
        ...listing,
        primaryImage: primaryImage ? primaryImage.storage_path : null,
        media: undefined // Remove media array
      };
    });
    
    return { listings: processedListings, error: null };
  } catch (error) {
    console.error('Error fetching listings by location:', error.message);
    return { listings: null, error };
  }
};

/**
 * Get top/featured locations (those with most listings)
 * @param {number} limit - Number of locations to return
 */
export const getTopLocations = async (limit = 12) => {
  try {
    // Alternative implementation that doesn't use .group()
    // First get all active listings
    const { data: listingsData, error: listingsError } = await supabase
      .from('listings')
      .select('location_id')
      .eq('is_active', true);
      
    if (listingsError) throw listingsError;
    
    // Count listings by location using JS
    const locationCounts = {};
    listingsData.forEach(listing => {
      const locationId = listing.location_id;
      if (locationId) {
        locationCounts[locationId] = (locationCounts[locationId] || 0) + 1;
      }
    });
    
    // Convert to array and sort
    const sortedLocationIds = Object.entries(locationCounts)
      .map(([locationId, count]) => ({ locationId, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit)
      .map(item => item.locationId);
    
    if (sortedLocationIds.length === 0) {
      // If no locations with listings, just return some locations
      const { data: defaultLocations } = await supabase
        .from('locations')
        .select('*')
        .limit(limit);
        
      return { locations: defaultLocations.map(loc => ({...loc, listing_count: 0})), error: null };
    }
    
    // Get location details
    const { data: locations, error: locationsError } = await supabase
      .from('locations')
      .select('*')
      .in('id', sortedLocationIds);
      
    if (locationsError) throw locationsError;
    
    // Add count data
    const topLocations = locations.map(location => ({
      ...location,
      listing_count: locationCounts[location.id] || 0
    })).sort((a, b) => b.listing_count - a.listing_count);
    
    return { locations: topLocations, error: null };
  } catch (error) {
    console.error('Error fetching top locations:', error.message);
    return { locations: null, error };
  }
};
