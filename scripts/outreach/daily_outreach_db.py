#!/usr/bin/env python3
"""Daily outreach runner backed by Supabase outreach_contacts table.

Replaces the CSV-tracker version. Reads candidates from DB, writes results
back to DB with a consent-first template (no "listing is live" language).

Required env vars:
  SUPABASE_URL
  SUPABASE_SERVICE_ROLE_KEY
  OUTREACH_REPLY_TO_EMAIL
  OUTREACH_SMTP_PASSWORD

Optional env vars:
  OUTREACH_SENDER_NAME     (default: DommeDirectory Partnerships)
  OUTREACH_SMTP_USERNAME   (default: OUTREACH_REPLY_TO_EMAIL)
  OUTREACH_SMTP_HOST       (default: mail.spacemail.com)
  OUTREACH_SMTP_PORT       (default: 465)
  OUTREACH_DAILY_LIMIT     (default: 8)
  OUTREACH_CITY            (filter to specific city slug, e.g. 'toronto')
"""

import os
import re
import smtplib
import ssl
import time
from datetime import datetime, timezone
from email.message import EmailMessage
from urllib.parse import urljoin, urlparse

import requests
from bs4 import BeautifulSoup
from supabase import create_client, Client

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------

PLATFORM_DOMAINS = {
    'onlyfans.com', 'www.onlyfans.com',
    'linktr.ee', 'www.linktr.ee',
    'bsky.app', 'www.bsky.app',
    'fansly.com', 'www.fansly.com',
    't.me', 'telegram.me',
}

SUCCESS_HINTS = (
    'thank you', 'thanks for', 'message has been sent', 'successfully sent',
    'we will get back', 'submission received', 'your message was sent',
    'inquiry received',
)

KEYWORDS = ('contact', 'booking', 'book', 'inquir', 'reach', 'get-in-touch')

HEADERS = {
    'User-Agent': (
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) '
        'AppleWebKit/537.36 (KHTML, like Gecko) '
        'Chrome/122.0.0.0 Safari/537.36'
    ),
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
}


def required_env(name: str) -> str:
    value = os.getenv(name, '').strip()
    if not value:
        raise RuntimeError(f'Missing required env var: {name}')
    return value


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def supabase_client() -> Client:
    return create_client(required_env('SUPABASE_URL'), required_env('SUPABASE_SERVICE_ROLE_KEY'))


# ---------------------------------------------------------------------------
# Email / form helpers (same logic as CSV version)
# ---------------------------------------------------------------------------

def clean_url(url: str) -> str:
    url = (url or '').strip()
    if not url:
        return ''
    if not url.startswith(('http://', 'https://')):
        url = 'https://' + url
    return url


def looks_like_email(value: str) -> bool:
    v = (value or '').strip()
    return bool(re.match(r'^[^@\s]+@[^@\s]+\.[^@\s]+$', v))


def extract_mailto(soup: BeautifulSoup):
    out, seen = [], set()
    for a in soup.select('a[href]'):
        href = (a.get('href') or '').strip()
        if not href.lower().startswith('mailto:'):
            continue
        addr = href.split(':', 1)[1].split('?', 1)[0].strip()
        if not addr or '@' not in addr:
            continue
        key = addr.lower()
        if key in seen:
            continue
        seen.add(key)
        out.append(addr)
    return out


def contact_pages(base_url: str, soup: BeautifulSoup):
    pages, seen = [], set()
    for a in soup.select('a[href]'):
        href = (a.get('href') or '').strip()
        if not href or href.lower().startswith(('mailto:', 'tel:', 'javascript:')):
            continue
        full = urljoin(base_url, href)
        try:
            u = urlparse(full)
        except Exception:
            continue
        if u.scheme not in ('http', 'https'):
            continue
        label = (u.path + ('?' + u.query if u.query else '')).lower()
        if not any(k in label for k in KEYWORDS):
            continue
        norm = u._replace(fragment='').geturl()
        if norm in seen:
            continue
        seen.add(norm)
        pages.append(norm)
        if len(pages) >= 5:
            break
    return pages


def has_captcha(form_html: str) -> bool:
    lower = form_html.lower()
    return 'captcha' in lower or 'g-recaptcha' in lower or 'hcaptcha' in lower


def pick_field(form, patterns, include_textarea=False):
    tags = ['input'] + (['textarea'] if include_textarea else [])
    for t in form.find_all(tags):
        typ = (t.get('type') or 'text').lower()
        if typ in ('hidden', 'submit', 'button', 'checkbox', 'radio', 'file'):
            continue
        hay = ' '.join([
            (t.get('name') or '').lower(),
            (t.get('id') or '').lower(),
            (t.get('placeholder') or '').lower(),
            (t.get('aria-label') or '').lower(),
        ])
        if any(p in hay for p in patterns):
            return t
    return None


def build_initial_body(sender_name: str, reply_to_email: str) -> str:
    return (
        'Hi,\n\n'
        "I'm with DommeDirectory, a client discovery platform for independent providers.\n\n"
        "We can prepare a private draft profile for you to review, but nothing is published "
        "without your explicit approval.\n\n"
        'If you want us to send a draft for approval, reply: YES\n'
        'If you do not want contact, reply: NO\n\n'
        "We'll honor either response immediately.\n\n"
        f'— {sender_name}\nDommeDirectory\n{reply_to_email}\n'
    )


def submit_form(session, page_url, form, sender_name, reply_to_email):
    if has_captcha(str(form)):
        return 'needs_manual', 'captcha_present', page_url

    method = (form.get('method') or 'post').lower()
    action = form.get('action') or page_url
    action_url = urljoin(page_url, action)

    name_field = pick_field(form, ['name'])
    email_field = pick_field(form, ['email'])
    subject_field = pick_field(form, ['subject'])
    message_field = pick_field(form, ['message', 'inquir', 'enquir', 'comment'], include_textarea=True)

    if message_field is None or not message_field.get('name'):
        return 'needs_manual', 'form_no_message_field', page_url

    body = build_initial_body(sender_name, reply_to_email)

    data = {}
    for inp in form.find_all(['input', 'textarea', 'select']):
        n = inp.get('name')
        if not n:
            continue
        typ = (inp.get('type') or 'text').lower()
        if typ in ('submit', 'button', 'file'):
            continue
        if typ in ('checkbox', 'radio'):
            if inp.has_attr('checked'):
                data[n] = inp.get('value', 'on')
            continue
        data[n] = inp.text if inp.name == 'textarea' else inp.get('value', '')

    data[message_field.get('name')] = body
    if name_field and name_field.get('name'):
        data[name_field.get('name')] = sender_name
    if email_field and email_field.get('name'):
        data[email_field.get('name')] = reply_to_email
    if subject_field and subject_field.get('name'):
        data[subject_field.get('name')] = 'Quick permission request from DommeDirectory'

    try:
        if method == 'get':
            resp = session.get(action_url, params=data, headers=HEADERS, timeout=25, allow_redirects=True)
        else:
            resp = session.post(action_url, data=data, headers=HEADERS, timeout=25, allow_redirects=True)
    except Exception:
        return 'site_down', 'form_submit_request_failed', action_url

    body_text = (resp.text or '').lower()
    if any(s in body_text for s in SUCCESS_HINTS):
        return 'delivered_form', 'success_hint', resp.url

    if resp.status_code in (200, 201, 202, 204, 301, 302, 303):
        return 'needs_manual', f'http_{resp.status_code}_no_success_hint', resp.url

    return 'needs_manual', f'http_{resp.status_code}', resp.url


def send_email(to_addr, sender_name, reply_to_email, smtp_user, smtp_pass, smtp_host, smtp_port):
    msg = EmailMessage()
    msg['From'] = f'{sender_name} <{smtp_user}>'
    msg['To'] = to_addr
    msg['Reply-To'] = reply_to_email
    msg['Subject'] = 'Quick permission request from DommeDirectory'
    msg.set_content(build_initial_body(sender_name, reply_to_email))

    ctx = ssl.create_default_context()
    try:
        with smtplib.SMTP_SSL(smtp_host, smtp_port, context=ctx, timeout=25) as server:
            server.login(smtp_user, smtp_pass)
            server.send_message(msg)
        return 'delivered_email', 'smtp_sent', f'mailto:{to_addr}'
    except Exception:
        return 'needs_manual', 'smtp_send_failed', f'mailto:{to_addr}'


def process_candidate(row, sender_name, reply_to_email, smtp_user, smtp_pass, smtp_host, smtp_port):
    """Try to contact a provider. Returns (status, evidence, delivery_url)."""
    website = clean_url(row.get('seed_contact_website', ''))
    seed_email = (row.get('seed_contact_email') or '').strip()

    if looks_like_email(seed_email):
        return send_email(seed_email, sender_name, reply_to_email,
                          smtp_user, smtp_pass, smtp_host, smtp_port)

    if not website:
        return 'no_contact_method', 'missing_seed_contact_website', ''

    try:
        host = urlparse(website).netloc.lower()
    except Exception:
        return 'no_contact_method', 'invalid_website_url', ''

    if host in PLATFORM_DOMAINS:
        return 'platform_only', f'platform_domain:{host}', website

    session = requests.Session()
    session.headers.update(HEADERS)

    try:
        home = session.get(website, timeout=25, allow_redirects=True)
    except Exception:
        return 'site_down', 'site_unreachable', website

    if home.status_code >= 500:
        return 'site_down', f'http_{home.status_code}', home.url

    home_soup = BeautifulSoup(home.text or '', 'html.parser')
    emails = extract_mailto(home_soup)

    if emails:
        return send_email(emails[0], sender_name, reply_to_email,
                          smtp_user, smtp_pass, smtp_host, smtp_port)

    pages = [home.url] + contact_pages(home.url, home_soup)
    visited = set()

    for page_url in pages:
        if page_url in visited:
            continue
        visited.add(page_url)

        try:
            resp = home if page_url == home.url else session.get(page_url, timeout=25, allow_redirects=True)
        except Exception:
            continue

        if resp.status_code >= 400:
            continue

        soup = BeautifulSoup(resp.text or '', 'html.parser')
        for form in soup.find_all('form'):
            status, evidence, delivery_url = submit_form(
                session, resp.url, form, sender_name, reply_to_email)
            if status in {'delivered_form', 'needs_manual'}:
                return status, evidence, delivery_url

    return 'no_contact_method', 'form_or_email_not_found', home.url


# ---------------------------------------------------------------------------
# DB helpers
# ---------------------------------------------------------------------------


def record_attempt(sb: Client, contact_id: str, listing_id: str, channel: str,
                   delivery_url: str, evidence: str, status: str, template: str):
    sb.table('outreach_attempts').insert({
        'contact_id': contact_id,
        'listing_id': listing_id,
        'channel': channel,
        'delivery_url': delivery_url,
        'delivery_evidence': evidence,
        'status': status,
        'template_version': template,
        'sent_at': now_iso(),
    }).execute()


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    reply_to = required_env('OUTREACH_REPLY_TO_EMAIL')
    sender_name = os.getenv('OUTREACH_SENDER_NAME', 'DommeDirectory Partnerships')
    smtp_user = os.getenv('OUTREACH_SMTP_USERNAME', reply_to)
    smtp_pass = required_env('OUTREACH_SMTP_PASSWORD')
    smtp_host = os.getenv('OUTREACH_SMTP_HOST', 'mail.spacemail.com')
    smtp_port = int(os.getenv('OUTREACH_SMTP_PORT', '465'))
    daily_limit = int(os.getenv('OUTREACH_DAILY_LIMIT', '8'))
    city_filter = os.getenv('OUTREACH_CITY', '').strip().lower()

    sb = supabase_client()

    # Pull not_contacted rows (already classified, have a deliverable method)
    query = sb.table('outreach_contacts') \
        .select('id, listing_id, display_name, seed_contact_website, seed_contact_email, contact_method, city') \
        .eq('status', 'not_contacted') \
        .in_('contact_method', ['email', 'contact_form']) \
        .limit(daily_limit * 3)  # fetch extra — some may fail classification checks

    if city_filter:
        query = query.ilike('city', f'%{city_filter}%')

    result = query.execute()
    candidates = result.data or []

    sent_today = 0
    seen_targets = set()

    # Prevent re-contacting duplicate rows for emails already touched in prior runs.
    email_rows = sb.table('outreach_contacts').select('seed_contact_email, status').limit(5000).execute().data or []
    already_contacted_emails = {
        (r.get('seed_contact_email') or '').strip().lower()
        for r in email_rows
        if (r.get('seed_contact_email') or '').strip()
        and (r.get('status') or '').strip() != 'not_contacted'
    }

    for row in candidates:
        if sent_today >= daily_limit:
            break

        contact_id = row['id']
        listing_id = row.get('listing_id')
        seed_email = (row.get('seed_contact_email') or '').strip().lower()
        website = clean_url(row.get('seed_contact_website', ''))
        if seed_email and seed_email in already_contacted_emails:
            sb.table('outreach_contacts').update({
                'status': 'needs_manual',
                'notes': 'duplicate_target_already_contacted',
                'updated_at': now_iso(),
            }).eq('id', contact_id).execute()
            print(f"[{row.get('city','?')}] {row.get('display_name','?')} -> suppressed (already_contacted_email)")
            continue
        if not website and not seed_email:
            continue
        dedupe_key = f'email:{seed_email}' if seed_email else f'site:{website.lower()}'
        if dedupe_key in seen_targets:
            print(f"[{row.get('city','?')}] {row.get('display_name','?')} -> skipped (duplicate_target)")
            continue
        seen_targets.add(dedupe_key)

        status, evidence, delivery_url = process_candidate(
            {'seed_contact_website': website},
            sender_name, reply_to, smtp_user, smtp_pass, smtp_host, smtp_port,
        )

        # Map to outreach_contacts.status values
        db_status = status  # already matches the CHECK constraint values

        # Map channel
        channel_map = {
            'delivered_email': 'email',
            'delivered_form': 'contact_form',
            'platform_only': 'dm',
            'dm_sent': 'dm',
        }
        channel = channel_map.get(status, 'contact_form')

        attempt_status = 'sent' if status in ('delivered_email', 'delivered_form') else 'failed'

        sb.table('outreach_contacts').update({
            'status': db_status,
            'last_contacted_at': now_iso(),
            'follow_up_count': 1,
            'next_follow_up_at': None,
            'notes': evidence,
            'updated_at': now_iso(),
        }).eq('id', contact_id).execute()

        record_attempt(sb, contact_id, listing_id, channel,
                       delivery_url, evidence, attempt_status, 'v1_permission_request')

        if status in ('delivered_email', 'delivered_form', 'needs_manual'):
            sent_today += 1

        print(f"[{row.get('city','?')}] {row.get('display_name','?')} -> {status} ({evidence})")
        if seed_email:
            already_contacted_emails.add(seed_email)
        time.sleep(1.0)

    print(f'daily_outreach_db: sent={sent_today}')


if __name__ == '__main__':
    main()
