import os
from supabase import create_client

sb = create_client(os.environ['SUPABASE_URL'], os.environ['SUPABASE_SERVICE_ROLE_KEY'])
res = sb.table('locations').select('id, city').eq('city', 'Toronto').execute()
if res.data:
    print(res.data[0]['id'])
