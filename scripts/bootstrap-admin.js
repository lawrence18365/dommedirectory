#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

const usage = () => {
  console.error(
    'Usage: node scripts/bootstrap-admin.js --email <email> | --user-id <uuid>'
  );
};

const parseArgs = () => {
  const args = process.argv.slice(2);
  const parsed = {};

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    const next = args[i + 1];

    if (arg === '--email' && next) {
      parsed.email = next.trim().toLowerCase();
      i += 1;
      continue;
    }

    if (arg === '--user-id' && next) {
      parsed.userId = next.trim();
      i += 1;
      continue;
    }
  }

  return parsed;
};

const findUserByEmail = async (supabase, email) => {
  const perPage = 200;
  let page = 1;

  while (true) {
    // eslint-disable-next-line no-await-in-loop
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
    if (error) {
      throw new Error(`Failed to list users: ${error.message}`);
    }

    const users = data?.users || [];
    const match = users.find((user) => (user.email || '').toLowerCase() === email);
    if (match) {
      return match;
    }

    if (users.length < perPage) {
      return null;
    }

    page += 1;
  }
};

const getSupabaseClient = () => {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      'Missing required env vars: SUPABASE_URL|NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY'
    );
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
};

const run = async () => {
  const { email, userId: rawUserId } = parseArgs();
  if ((!email && !rawUserId) || (email && rawUserId)) {
    usage();
    process.exit(1);
  }

  const supabase = getSupabaseClient();

  let userId = rawUserId;
  if (!userId) {
    const user = await findUserByEmail(supabase, email);
    if (!user) {
      throw new Error(`No auth user found for email: ${email}`);
    }
    userId = user.id;
  }

  const { data: userData, error: getUserError } = await supabase.auth.admin.getUserById(userId);
  if (getUserError) {
    throw new Error(`Failed to load user: ${getUserError.message}`);
  }

  const user = userData?.user;
  if (!user) {
    throw new Error('User not found');
  }

  const nextMetadata = {
    ...(user.user_metadata || {}),
    user_type: 'admin',
  };

  const { data: updated, error: updateError } = await supabase.auth.admin.updateUserById(user.id, {
    user_metadata: nextMetadata,
  });

  if (updateError) {
    throw new Error(`Failed to set admin metadata: ${updateError.message}`);
  }

  const updatedUser = updated?.user;
  if (!updatedUser) {
    throw new Error('Admin update returned no user payload');
  }

  console.log(
    JSON.stringify(
      {
        user_id: updatedUser.id,
        email: updatedUser.email,
        user_type: updatedUser.user_metadata?.user_type,
      },
      null,
      2
    )
  );
};

run().catch((error) => {
  console.error(`Failed: ${error.message}`);
  process.exit(1);
});
