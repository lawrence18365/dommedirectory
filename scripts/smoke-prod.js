#!/usr/bin/env node

const crypto = require('crypto');

const baseUrl = (
  process.env.PROD_BASE_URL ||
  process.env.NEXT_PUBLIC_SITE_URL ||
  'https://dommedirectory.com'
).replace(/\/+$/, '');
const supabaseUrl = (
  process.env.SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  ''
).replace(/\/+$/, '');
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !anonKey || !serviceRoleKey) {
  console.error('Missing required env vars: SUPABASE_URL|NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const createdUserIds = [];
const createdLocationIds = [];

const sleep = (ms) => new Promise((resolve) => {
  setTimeout(resolve, ms);
});

const request = async (url, { method = 'GET', headers = {}, body } = {}) => {
  let response;
  try {
    response = await fetch(url, {
      method,
      headers: {
        Accept: 'application/json',
        ...headers,
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch (error) {
    throw new Error(
      `Request failed (${method} ${url}): ${error?.message || 'unknown fetch error'}`
    );
  }

  const text = await response.text();
  let json = null;
  if (text) {
    try {
      json = JSON.parse(text);
    } catch {
      json = null;
    }
  }

  return {
    status: response.status,
    text,
    json,
    headers: response.headers,
  };
};

const expectStatus = (label, actual, expected) => {
  if (actual !== expected) {
    throw new Error(`${label} expected ${expected}, got ${actual}`);
  }
  console.log(`PASS ${label}: ${actual}`);
};

const randomEmail = (prefix) => {
  const slug = crypto.randomBytes(6).toString('hex');
  return `${prefix}-${Date.now()}-${slug}@example.com`;
};

const createAuthUser = async ({ email, password, userMetadata }) => {
  const response = await request(`${supabaseUrl}/auth/v1/admin/users`, {
    method: 'POST',
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      'Content-Type': 'application/json',
    },
    body: {
      email,
      password,
      email_confirm: true,
      user_metadata: userMetadata,
    },
  });

  expectStatus(`create user ${email}`, response.status, 200);
  const userId = response.json?.id || response.json?.user?.id;
  if (!userId) {
    throw new Error(`Failed to parse user id for ${email}`);
  }

  createdUserIds.push(userId);
  return userId;
};

const signIn = async ({ email, password }) => {
  const response = await request(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: {
      apikey: anonKey,
      'Content-Type': 'application/json',
    },
    body: { email, password },
  });

  expectStatus(`sign in ${email}`, response.status, 200);
  const token = response.json?.access_token;
  if (!token) {
    throw new Error(`Failed to parse access token for ${email}`);
  }

  return token;
};

const deleteAuthUser = async (userId) => {
  const response = await request(`${supabaseUrl}/auth/v1/admin/users/${encodeURIComponent(userId)}`, {
    method: 'DELETE',
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
    },
  });

  if (response.status >= 200 && response.status < 300) {
    console.log(`CLEANUP deleted user ${userId}`);
    return;
  }

  console.error(`CLEANUP failed to delete user ${userId}: ${response.status}`);
};

const deleteLocation = async (locationId) => {
  const response = await request(
    `${supabaseUrl}/rest/v1/locations?id=eq.${encodeURIComponent(locationId)}`,
    {
      method: 'DELETE',
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
      },
    }
  );

  if (response.status >= 200 && response.status < 300) {
    console.log(`CLEANUP deleted location ${locationId}`);
    return;
  }

  console.error(`CLEANUP failed to delete location ${locationId}: ${response.status}`);
};

const getOrCreateLocation = async () => {
  const response = await request(
    `${supabaseUrl}/rest/v1/locations?select=id&is_active=eq.true&order=created_at.asc&limit=1`,
    {
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
      },
    }
  );

  expectStatus('load baseline location', response.status, 200);

  const location = Array.isArray(response.json) ? response.json[0] : null;
  if (location?.id) {
    return location.id;
  }

  const city = `Smoke City ${Date.now()}`;
  const createLocation = await request(`${supabaseUrl}/rest/v1/locations`, {
    method: 'POST',
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: {
      city,
      state: 'Smoke',
      country: 'US',
      is_active: true,
    },
  });

  expectStatus('create smoke location', createLocation.status, 201);
  const created = Array.isArray(createLocation.json) ? createLocation.json[0] : null;
  if (!created?.id) {
    throw new Error('Failed to parse smoke location id');
  }

  createdLocationIds.push(created.id);
  return created.id;
};

const withRetry = async (label, fn, { attempts = 5, delayMs = 600 } = {}) => {
  let lastError = null;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt < attempts) {
        console.log(`RETRY ${label}: attempt ${attempt}/${attempts}`);
        await sleep(delayMs);
      }
    }
  }

  throw lastError;
};

const createFixtureListing = async (locationId) => {
  const ownerEmail = randomEmail('smoke-listing-owner');
  const ownerPassword = `Smoke!${crypto.randomBytes(8).toString('hex')}`;

  const ownerId = await createAuthUser({
    email: ownerEmail,
    password: ownerPassword,
    userMetadata: {
      display_name: 'Smoke Listing Owner',
      user_type: 'domme',
      primary_location_id: locationId,
    },
  });

  const response = await withRetry(
    'create smoke listing',
    async () => {
      const result = await request(`${supabaseUrl}/rest/v1/listings`, {
        method: 'POST',
        headers: {
          apikey: serviceRoleKey,
          Authorization: `Bearer ${serviceRoleKey}`,
          'Content-Type': 'application/json',
          Prefer: 'return=representation',
        },
        body: {
          profile_id: ownerId,
          location_id: locationId,
          title: 'Smoke Fixture Listing',
          description: 'Smoke test listing for production health checks.',
          is_active: true,
          is_featured: false,
        },
      });

      if (result.status !== 201) {
        throw new Error(`create smoke listing status ${result.status}`);
      }

      const listing = Array.isArray(result.json) ? result.json[0] : null;
      if (!listing?.id) {
        throw new Error('create smoke listing response missing id');
      }

      return listing;
    },
    { attempts: 6, delayMs: 700 }
  );

  console.log('PASS create smoke listing: 201');
  return response;
};

const run = async () => {
  const locationId = await getOrCreateLocation();
  const listing = await createFixtureListing(locationId);

  const referrerEmail = randomEmail('smoke-referrer');
  const referredEmail = randomEmail('smoke-referred');
  const password = `Smoke!${crypto.randomBytes(8).toString('hex')}`;

  await createAuthUser({
    email: referrerEmail,
    password,
    userMetadata: {
      display_name: 'Smoke Referrer',
      user_type: 'domme',
      primary_location_id: locationId,
    },
  });

  const referrerToken = await signIn({ email: referrerEmail, password });

  const leadsTrack = await request(`${baseUrl}/api/leads/track`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: {
      listingId: listing.id,
      eventType: 'contact_email_click',
      cityPage: 'smoke-city',
      pagePath: '/smoke-test',
      referrer: 'https://example.com/smoke',
      utm_source: 'smoke',
      utm_medium: 'script',
      utm_campaign: 'prod_gate',
      metadata: {
        smokeRun: true,
      },
    },
  });
  expectStatus('/api/leads/track', leadsTrack.status, 201);

  const leadsExport = await request(`${baseUrl}/api/leads/export?days=30`, {
    headers: {
      Authorization: `Bearer ${referrerToken}`,
    },
  });
  expectStatus('/api/leads/export', leadsExport.status, 200);
  if (!leadsExport.text.startsWith('created_at,')) {
    throw new Error('/api/leads/export returned unexpected CSV output');
  }
  console.log('PASS /api/leads/export CSV header present');

  const referralsLink = await withRetry(
    '/api/referrals/link',
    async () => {
      const response = await request(`${baseUrl}/api/referrals/link`, {
        headers: {
          Authorization: `Bearer ${referrerToken}`,
        },
      });

      if (response.status !== 200) {
        throw new Error(`/api/referrals/link status ${response.status}`);
      }

      if (!response.json?.shareCode) {
        throw new Error('/api/referrals/link missing shareCode');
      }

      return response;
    },
    { attempts: 6, delayMs: 750 }
  );
  expectStatus('/api/referrals/link', referralsLink.status, 200);

  const referralsCapture = await request(`${baseUrl}/api/referrals/capture`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: {
      shareCode: referralsLink.json.shareCode,
      sourceCity: 'smoke-city',
      utm_source: 'smoke',
      utm_medium: 'script',
      utm_campaign: 'prod_gate',
    },
  });
  expectStatus('/api/referrals/capture', referralsCapture.status, 201);

  const referralEventCode = referralsCapture.json?.referralEventCode;
  if (!referralEventCode) {
    throw new Error('/api/referrals/capture missing referralEventCode');
  }

  await createAuthUser({
    email: referredEmail,
    password,
    userMetadata: {
      display_name: 'Smoke Referred',
      user_type: 'domme',
      primary_location_id: locationId,
      referral_event_code: referralEventCode,
      referral_source_city: 'smoke-city',
      referral_utm_source: 'smoke',
      referral_utm_medium: 'script',
      referral_utm_campaign: 'prod_gate',
    },
  });

  const referredToken = await signIn({ email: referredEmail, password });

  const referralsAttribute = await request(`${baseUrl}/api/referrals/attribute`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${referredToken}`,
      'Content-Type': 'application/json',
    },
    body: {},
  });
  expectStatus('/api/referrals/attribute', referralsAttribute.status, 200);

  const locationListings = await request(
    `${baseUrl}/api/location/listings?locationId=${encodeURIComponent(locationId)}&limit=5`
  );
  expectStatus('/api/location/listings', locationListings.status, 200);

  const reportSubmit = await request(`${baseUrl}/api/reports/listing`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: {
      listingId: listing.id,
      reason: 'Safety concern',
      details: 'Smoke test report submission path',
      sourcePage: '/smoke-test',
      visitorId: 'smoke-visitor',
      sessionId: 'smoke-session',
      cityPage: 'smoke-city',
      pagePath: '/smoke-test',
      referrer: 'https://example.com/smoke',
      utm_source: 'smoke',
      utm_medium: 'script',
      utm_campaign: 'prod_gate',
    },
  });
  expectStatus('/api/reports/listing', reportSubmit.status, 201);

  const adminReportsForbidden = await request(`${baseUrl}/api/admin/reports`, {
    headers: {
      Authorization: `Bearer ${referredToken}`,
    },
  });
  expectStatus('/api/admin/reports non-admin', adminReportsForbidden.status, 403);

  console.log('PASS production smoke pack complete');

};

(async () => {
  try {
    await run();
  } finally {
    while (createdUserIds.length > 0) {
      const userId = createdUserIds.pop();
      // eslint-disable-next-line no-await-in-loop
      await deleteAuthUser(userId);
    }

    while (createdLocationIds.length > 0) {
      const locationId = createdLocationIds.pop();
      // eslint-disable-next-line no-await-in-loop
      await deleteLocation(locationId);
    }
  }
})().catch((error) => {
  console.error(`FAIL ${error.message}`);
  if (error?.stack) {
    console.error(error.stack);
  }
  process.exit(1);
});
