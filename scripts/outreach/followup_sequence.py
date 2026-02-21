#!/usr/bin/env python3
"""Follow-up email sequence for outreach contacts.

Sends the day-4 "your listing got X views" email — the most important
conversion email in the sequence. Pulls real view counts from lead_events.

Day-4 trigger: contacted 4+ days ago, not yet claimed, follow_up_count == 1.
Day-10 trigger: contacted 10+ days ago, not yet claimed, follow_up_count == 2.

Required env vars:
  SUPABASE_URL
  SUPABASE_SERVICE_ROLE_KEY
  OUTREACH_REPLY_TO_EMAIL
  OUTREACH_SMTP_PASSWORD

Optional:
  OUTREACH_SENDER_NAME
  OUTREACH_SMTP_USERNAME
  OUTREACH_SMTP_HOST
  OUTREACH_SMTP_PORT
  FOLLOWUP_DAILY_LIMIT  (default: 10)
"""

import os
import smtplib
import ssl
from datetime import datetime, timezone, timedelta
from email.message import EmailMessage

from supabase import create_client, Client


def required_env(name: str) -> str:
    value = os.getenv(name, '').strip()
    if not value:
        raise RuntimeError(f'Missing required env var: {name}')
    return value


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def days_ago_iso(n: int) -> str:
    return (datetime.now(timezone.utc) - timedelta(days=n)).isoformat()


def supabase_client() -> Client:
    return create_client(required_env('SUPABASE_URL'), required_env('SUPABASE_SERVICE_ROLE_KEY'))


def get_view_count(sb: Client, listing_id: str, since_iso: str) -> int:
    """Count listing_view events since a given timestamp."""
    if not listing_id:
        return 0
    res = sb.table('lead_events') \
        .select('id', count='exact') \
        .eq('listing_id', listing_id) \
        .eq('event_type', 'listing_view') \
        .gte('created_at', since_iso) \
        .execute()
    return res.count or 0


def send_smtp(to_addr: str, subject: str, body: str,
              sender_name: str, smtp_user: str, smtp_pass: str,
              smtp_host: str, smtp_port: int, reply_to: str) -> bool:
    msg = EmailMessage()
    msg['From'] = f'{sender_name} <{smtp_user}>'
    msg['To'] = to_addr
    msg['Reply-To'] = reply_to
    msg['Subject'] = subject
    msg.set_content(body)
    ctx = ssl.create_default_context()
    try:
        with smtplib.SMTP_SSL(smtp_host, smtp_port, context=ctx, timeout=25) as server:
            server.login(smtp_user, smtp_pass)
            server.send_message(msg)
        return True
    except Exception as e:
        print(f'  SMTP error: {e}')
        return False


def day4_body(listing_url: str, view_count: int, sender_name: str, reply_to: str) -> str:
    view_phrase = (
        f'Your listing was viewed {view_count} times this week.'
        if view_count > 0
        else 'Your listing is live and being indexed by search engines.'
    )
    return (
        f'Hi,\n\n'
        f'{view_phrase}\n\n'
        f"Your profile is at:\n{listing_url}\n\n"
        f"Providers who claim their listing see who's clicking through and can update their "
        f"rates, photos, and contact info. Takes a few minutes.\n\n"
        f"Claim it this week and you'll also get 7 days of free featured placement at the "
        f"top of your city page — no card required.\n\n"
        f"— {sender_name}\nDommeDirectory\n{reply_to}\n"
    )


def day10_body(listing_url: str, sender_name: str, reply_to: str) -> str:
    return (
        f'Hi,\n\n'
        f"Quick heads up — your free featured placement offer expires Friday.\n\n"
        f"Your listing is still live at:\n{listing_url}\n\n"
        f"If you claim it before the end of the week you'll get 7 days at the top of "
        f"the city page automatically. After that the offer expires.\n\n"
        f"Reply if you have questions or want it removed.\n\n"
        f"— {sender_name}\nDommeDirectory\n{reply_to}\n"
    )


def get_contact_email(row: dict) -> str:
    """Return the email address to follow up at, if any."""
    return (row.get('seed_contact_email') or '').strip()


def main():
    reply_to = required_env('OUTREACH_REPLY_TO_EMAIL')
    sender_name = os.getenv('OUTREACH_SENDER_NAME', 'DommeDirectory Partnerships')
    smtp_user = os.getenv('OUTREACH_SMTP_USERNAME', reply_to)
    smtp_pass = required_env('OUTREACH_SMTP_PASSWORD')
    smtp_host = os.getenv('OUTREACH_SMTP_HOST', 'mail.spacemail.com')
    smtp_port = int(os.getenv('OUTREACH_SMTP_PORT', '465'))
    daily_limit = int(os.getenv('FOLLOWUP_DAILY_LIMIT', '10'))

    sb = supabase_client()

    four_days_ago = days_ago_iso(4)
    ten_days_ago = days_ago_iso(10)

    # Day-4 candidates: delivered 4+ days ago, still not claimed, follow_up_count == 1
    day4_res = sb.table('outreach_contacts') \
        .select('id, listing_id, display_name, seed_contact_email, follow_up_count, last_contacted_at') \
        .in_('status', ['delivered_email', 'delivered_form']) \
        .eq('claimed', False) \
        .eq('follow_up_count', 1) \
        .lte('last_contacted_at', four_days_ago) \
        .limit(daily_limit) \
        .execute()

    # Day-10 candidates: delivered 10+ days ago, still not claimed, follow_up_count == 2
    day10_res = sb.table('outreach_contacts') \
        .select('id, listing_id, display_name, seed_contact_email, follow_up_count, last_contacted_at') \
        .in_('status', ['delivered_email', 'delivered_form']) \
        .eq('claimed', False) \
        .eq('follow_up_count', 2) \
        .lte('last_contacted_at', ten_days_ago) \
        .limit(daily_limit) \
        .execute()

    sent = 0

    for row in (day4_res.data or []):
        if sent >= daily_limit:
            break
        email = get_contact_email(row)
        if not email:
            continue

        listing_id = row.get('listing_id') or ''
        view_count = get_view_count(sb, listing_id, days_ago_iso(7))

        # Build listing URL from DB
        listing_url = ''
        if listing_id:
            r = sb.table('listings').select('slug').eq('id', listing_id).limit(1).execute()
            if r.data:
                slug = r.data[0].get('slug', '')
                listing_url = f'https://dommedirectory.com/profiles/{slug}' if slug else ''

        body = day4_body(listing_url, view_count, sender_name, reply_to)
        subject = f'Your listing got {view_count} views this week' if view_count > 0 else 'Update on your DommeDirectory listing'

        ok = send_smtp(email, subject, body, sender_name, smtp_user, smtp_pass, smtp_host, smtp_port, reply_to)

        if ok:
            sb.table('outreach_contacts').update({
                'follow_up_count': 2,
                'last_contacted_at': now_iso(),
                'updated_at': now_iso(),
            }).eq('id', row['id']).execute()

            sb.table('outreach_attempts').insert({
                'contact_id': row['id'],
                'listing_id': listing_id or None,
                'channel': 'email',
                'delivery_url': f'mailto:{email}',
                'delivery_evidence': f'day4_views_{view_count}',
                'status': 'sent',
                'template_version': 'v2_followup_day4',
                'sent_at': now_iso(),
            }).execute()

            sent += 1
            print(f'[day4] {row.get("display_name","?")} -> {email} ({view_count} views)')

    for row in (day10_res.data or []):
        if sent >= daily_limit:
            break
        email = get_contact_email(row)
        if not email:
            continue

        listing_id = row.get('listing_id') or ''
        listing_url = ''
        if listing_id:
            r = sb.table('listings').select('slug').eq('id', listing_id).limit(1).execute()
            if r.data:
                slug = r.data[0].get('slug', '')
                listing_url = f'https://dommedirectory.com/profiles/{slug}' if slug else ''

        body = day10_body(listing_url, sender_name, reply_to)
        subject = 'Your featured placement offer expires Friday'

        ok = send_smtp(email, subject, body, sender_name, smtp_user, smtp_pass, smtp_host, smtp_port, reply_to)

        if ok:
            sb.table('outreach_contacts').update({
                'follow_up_count': 3,
                'last_contacted_at': now_iso(),
                'updated_at': now_iso(),
            }).eq('id', row['id']).execute()

            sb.table('outreach_attempts').insert({
                'contact_id': row['id'],
                'listing_id': listing_id or None,
                'channel': 'email',
                'delivery_url': f'mailto:{email}',
                'delivery_evidence': 'day10_expiry_reminder',
                'status': 'sent',
                'template_version': 'v3_followup_day10',
                'sent_at': now_iso(),
            }).execute()

            sent += 1
            print(f'[day10] {row.get("display_name","?")} -> {email}')

    print(f'followup_sequence: sent={sent}')


if __name__ == '__main__':
    main()
