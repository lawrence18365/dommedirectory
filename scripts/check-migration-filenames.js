#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const migrationsDir = path.resolve(process.cwd(), 'supabase', 'migrations');
const migrationPattern = /^\d{14}_[a-z0-9_]+\.sql$/;

if (!fs.existsSync(migrationsDir)) {
  console.error(`Missing migrations directory: ${migrationsDir}`);
  process.exit(1);
}

const files = fs
  .readdirSync(migrationsDir)
  .filter((file) => file.endsWith('.sql'))
  .sort();

if (files.length === 0) {
  console.error('No migration files found.');
  process.exit(1);
}

const errors = [];
const seenVersions = new Map();

for (const file of files) {
  if (!migrationPattern.test(file)) {
    errors.push(
      `Invalid filename format: ${file} (expected YYYYMMDDHHMMSS_name.sql)`
    );
    continue;
  }

  const version = file.slice(0, 14);
  const existing = seenVersions.get(version);
  if (existing) {
    errors.push(
      `Duplicate migration version prefix: ${version} in ${existing} and ${file}`
    );
    continue;
  }

  seenVersions.set(version, file);
}

if (errors.length > 0) {
  for (const error of errors) {
    console.error(error);
  }
  process.exit(1);
}

console.log(`Migration filename check passed (${files.length} files).`);
