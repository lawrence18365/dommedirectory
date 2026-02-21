#!/bin/bash
source .env.local
export SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
export SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_SERVICE_ROLE_KEY
OUTREACH_DAILY_LIMIT=20 OUTREACH_CITY='toronto' python3 scripts/outreach/daily_outreach_db.py
