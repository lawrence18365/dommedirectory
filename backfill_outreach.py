import os
from supabase import create_client

sb = create_client(os.environ['SUPABASE_URL'], os.environ['SUPABASE_SERVICE_ROLE_KEY'])
res = sb.table('listings').select('id, title, seed_source_url, seed_contact_email, seed_contact_website, seed_contact_handle, location_id').eq('is_seeded', True).execute()

inserts = []
for r in res.data:
    inserts.append({
        'listing_id': r['id'],
        'display_name': r['title'],
        'seed_source_url': r['seed_source_url'],
        'seed_contact_email': r['seed_contact_email'],
        'seed_contact_website': r['seed_contact_website'],
        'seed_contact_handle': r['seed_contact_handle'],
        'location_id': r['location_id'],
        'city': 'Toronto',
        'status': 'not_contacted'
    })

if inserts:
    sb.table('outreach_contacts').upsert(inserts, ignore_duplicates=True).execute()
    print(f"Backfilled {len(inserts)} candidates to outreach_contacts")
