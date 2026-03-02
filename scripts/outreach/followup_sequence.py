#!/usr/bin/env python3
"""Follow-up email sequence for outreach contacts.

Consent-safe reminders for contacts that received the initial permission request.

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


def day4_body(sender_name: str, reply_to: str) -> str:
    return (
        f'Hi,\n\n'
        f"Quick follow-up on my note from earlier this week.\n\n"
        f"If you'd like a private draft profile to review, reply YES and we'll send it for approval.\n"
        f"Nothing is published without your explicit permission.\n\n"
        f"If you don't want contact, reply NO and we'll close your record.\n\n"
        f"— {sender_name}\nDommeDirectory\n{reply_to}\n"
    )


def day10_body(sender_name: str, reply_to: str) -> str:
    return (
        f'Hi,\n\n'
        f"Final follow-up from us.\n\n"
        f"If you'd like a private draft profile to review, reply YES.\n"
        f"If not, reply NO and we won't contact you again.\n\n"
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

    # Day-4 candidates: initial message sent 4+ days ago, no response yet.
    day4_res = sb.table('outreach_contacts') \
        .select('id, listing_id, display_name, seed_contact_email, follow_up_count, last_contacted_at') \
        .in_('status', ['delivered_email', 'delivered_form']) \
        .eq('claimed', False) \
        .eq('follow_up_count', 1) \
        .lte('last_contacted_at', four_days_ago) \
        .limit(daily_limit) \
        .execute()

    # Day-10 candidates: day-4 reminder already sent, still no response.
    day10_res = sb.table('outreach_contacts') \
        .select('id, listing_id, display_name, seed_contact_email, follow_up_count, last_contacted_at') \
        .in_('status', ['delivered_email', 'delivered_form']) \
        .eq('claimed', False) \
        .eq('follow_up_count', 2) \
        .lte('last_contacted_at', ten_days_ago) \
        .limit(daily_limit) \
        .execute()

    sent = 0
    seen_emails = set()

    for row in (day4_res.data or []):
        if sent >= daily_limit:
            break
        email = get_contact_email(row)
        if not email:
            continue
        email_key = email.lower()
        if email_key in seen_emails:
            continue
        seen_emails.add(email_key)

        listing_id = row.get('listing_id')
        body = day4_body(sender_name, reply_to)
        subject = 'Follow-up: permission request from DommeDirectory'

        ok = send_smtp(email, subject, body, sender_name, smtp_user, smtp_pass, smtp_host, smtp_port, reply_to)

        if ok:
            sb.table('outreach_contacts').update({
                'follow_up_count': 2,
                'last_contacted_at': now_iso(),
                'updated_at': now_iso(),
            }).eq('id', row['id']).execute()

            sb.table('outreach_attempts').insert({
                'contact_id': row['id'],
                'listing_id': listing_id,
                'channel': 'email',
                'delivery_url': f'mailto:{email}',
                'delivery_evidence': 'day4_permission_followup',
                'status': 'sent',
                'template_version': 'v2_followup_day4',
                'sent_at': now_iso(),
            }).execute()

            sent += 1
            print(f'[day4] {row.get("display_name","?")} -> {email}')

    for row in (day10_res.data or []):
        if sent >= daily_limit:
            break
        email = get_contact_email(row)
        if not email:
            continue
        email_key = email.lower()
        if email_key in seen_emails:
            continue
        seen_emails.add(email_key)

        listing_id = row.get('listing_id')
        body = day10_body(sender_name, reply_to)
        subject = 'Final follow-up: DommeDirectory permission request'

        ok = send_smtp(email, subject, body, sender_name, smtp_user, smtp_pass, smtp_host, smtp_port, reply_to)

        if ok:
            sb.table('outreach_contacts').update({
                'follow_up_count': 3,
                'last_contacted_at': now_iso(),
                'updated_at': now_iso(),
            }).eq('id', row['id']).execute()

            sb.table('outreach_attempts').insert({
                'contact_id': row['id'],
                'listing_id': listing_id,
                'channel': 'email',
                'delivery_url': f'mailto:{email}',
                'delivery_evidence': 'day10_permission_followup',
                'status': 'sent',
                'template_version': 'v3_followup_day10',
                'sent_at': now_iso(),
            }).execute()

            sent += 1
            print(f'[day10] {row.get("display_name","?")} -> {email}')

    print(f'followup_sequence: sent={sent}')


if __name__ == '__main__':
    main()
