#!/usr/bin/env python3
"""Classify uncontacted outreach_contacts rows and write contact_method back to DB.

Replaces the CSV-based build_delivery_queues.py.
Reads outreach_contacts where status='not_contacted' and contact_method IS NULL,
probes each provider's website, then updates the row with the correct channel.

Required env vars:
  SUPABASE_URL
  SUPABASE_SERVICE_ROLE_KEY

Optional:
  CLASSIFY_CITY    filter to a specific city
  CLASSIFY_LIMIT   max rows to process (default: 100)
"""

import os
import time
from datetime import datetime, timezone
from urllib.parse import urljoin, urlparse

import requests
from bs4 import BeautifulSoup
from supabase import create_client, Client

PLATFORM = {
    'onlyfans.com', 'www.onlyfans.com',
    'linktr.ee', 'www.linktr.ee',
    'bsky.app', 'www.bsky.app',
    'fansly.com', 'www.fansly.com',
    't.me', 'telegram.me',
}

KEYWORDS = ('contact', 'booking', 'book', 'inquir', 'reach', 'get-in-touch')

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (compatible; DommeDirectoryBot/1.0)',
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


def extract_mailto(soup: BeautifulSoup):
    emails, seen = [], set()
    for a in soup.select('a[href]'):
        href = (a.get('href') or '').strip()
        if href.lower().startswith('mailto:'):
            addr = href.split(':', 1)[1].split('?', 1)[0].strip()
            if addr and '@' in addr and addr.lower() not in seen:
                seen.add(addr.lower())
                emails.append(addr)
    return emails


def has_confirmable_form(soup: BeautifulSoup) -> bool:
    for form in soup.find_all('form'):
        html = str(form).lower()
        if 'captcha' in html or 'g-recaptcha' in html or 'hcaptcha' in html:
            continue
        for t in form.find_all(['input', 'textarea']):
            typ = (t.get('type') or 'text').lower()
            if typ in ('hidden', 'submit', 'button', 'checkbox', 'radio', 'file'):
                continue
            hay = ' '.join([
                (t.get('name') or '').lower(),
                (t.get('id') or '').lower(),
                (t.get('placeholder') or '').lower(),
                (t.get('aria-label') or '').lower(),
            ])
            if any(k in hay for k in ('message', 'inquir', 'enquir', 'comment')):
                return True
    return False


def contact_pages(base_url: str, soup: BeautifulSoup):
    out, seen = [], set()
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
        out.append(norm)
        if len(out) >= 5:
            break
    return out


def classify(website: str):
    """Returns (contact_method, reason, evidence, delivery_url, email_found)."""
    if not website:
        return 'none', 'no_contact_method', 'missing_website', '', None

    if not website.startswith(('http://', 'https://')):
        website = f'https://{website}'

    try:
        host = urlparse(website).netloc.lower()
    except Exception:
        return 'none', 'no_contact_method', 'invalid_url', '', None

    if host in PLATFORM:
        return 'dm', 'platform_only', f'platform_domain:{host}', website, None

    session = requests.Session()
    session.headers.update(HEADERS)

    try:
        home = session.get(website, timeout=20, allow_redirects=True)
    except Exception:
        return 'none', 'no_contact_method', 'site_unreachable', website, None

    if home.status_code >= 500:
        return 'none', 'no_contact_method', f'http_{home.status_code}', home.url, None

    soup = BeautifulSoup(home.text or '', 'html.parser')
    mails = extract_mailto(soup)
    if mails:
        return 'email', 'email_exposed', 'mailto_found', f'mailto:{mails[0]}', mails[0]

    if has_confirmable_form(soup):
        return 'contact_form', 'confirmable_form', 'form_message_field_no_captcha', home.url, None

    for page in contact_pages(home.url, soup):
        try:
            resp = session.get(page, timeout=20, allow_redirects=True)
        except Exception:
            continue
        if resp.status_code >= 400:
            continue
        s2 = BeautifulSoup(resp.text or '', 'html.parser')
        mails = extract_mailto(s2)
        if mails:
            return 'email', 'email_exposed', 'mailto_found', f'mailto:{mails[0]}', mails[0]
        if has_confirmable_form(s2):
            return 'contact_form', 'confirmable_form', 'form_message_field_no_captcha', resp.url, None

    return 'none', 'no_contact_method', 'form_or_email_not_found', home.url, None


def main():
    city_filter = os.getenv('CLASSIFY_CITY', '').strip().lower()
    limit = int(os.getenv('CLASSIFY_LIMIT', '100'))

    sb = supabase_client()

    query = sb.table('outreach_contacts') \
        .select('id, seed_contact_website, display_name, city') \
        .eq('status', 'not_contacted') \
        .is_('contact_method', 'null') \
        .limit(limit)

    if city_filter:
        query = query.eq('city', city_filter)

    result = query.execute()
    rows = result.data or []
    print(f'Classifying {len(rows)} contacts...')

    counts = {'email': 0, 'contact_form': 0, 'dm': 0, 'none': 0}

    for row in rows:
        method, reason, evidence, delivery_url, email_found = classify(
            (row.get('seed_contact_website') or '').strip()
        )

        update = {
            'contact_method': method,
            'classification_reason': reason,
            'classification_evidence': evidence,
            'classified_at': now_iso(),
            'updated_at': now_iso(),
        }

        # If we found an email, store it for follow-up sequence
        if email_found and not row.get('seed_contact_email'):
            update['seed_contact_email'] = email_found

        sb.table('outreach_contacts').update(update).eq('id', row['id']).execute()
        counts[method] = counts.get(method, 0) + 1

        print(f"  [{row.get('city','?')}] {row.get('display_name','?')} -> {method} ({reason})")
        time.sleep(0.5)

    print(f"build_delivery_queues_db: email={counts['email']} form={counts['contact_form']} dm={counts['dm']} none={counts['none']}")


if __name__ == '__main__':
    main()
