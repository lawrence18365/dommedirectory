import os
from supabase import create_client

sb = create_client(os.environ['SUPABASE_URL'], os.environ['SUPABASE_SERVICE_ROLE_KEY'])
res = sb.table('locations').select('city, state, country, is_active').execute()
for r in res.data:
  print(f"{r['city']}, {r['state']} ({r['country']}) - Active: {r['is_active']}")
