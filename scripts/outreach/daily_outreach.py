#!/usr/bin/env python3
"""Low-volume daily outreach runner.

Single source of truth for sender/reply email:
- OUTREACH_REPLY_TO_EMAIL
"""

import argparse
import csv
import os
import re
import smtplib
import ssl
import time
from datetime import datetime
from email.message import EmailMessage
from urllib.parse import urljoin, urlparse

import requests
from bs4 import BeautifulSoup

TAXONOMY = {
    'delivered_form',
    'delivered_email',
    'platform_only',
    'no_contact_method',
    'site_down',
    'dm_sent',
    'needs_manual',
    'not_contacted',
}

PLATFORM_DOMAINS = {
    'onlyfans.com', 'www.onlyfans.com',
    'linktr.ee', 'www.linktr.ee',
    'bsky.app', 'www.bsky.app',
    'fansly.com', 'www.fansly.com',
    't.me', 'telegram.me',
}

SUCCESS_HINTS = (
    'thank you', 'thanks for', 'message has been sent', 'successfully sent',
    'we will get back', 'submission received', 'your message was sent', 'inquiry received'
)

KEYWORDS = ('contact', 'booking', 'book', 'inquir', 'reach', 'get-in-touch')

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
}


def required_env(name: str) -> str:
    value = os.getenv(name, '').strip()
    if not value:
        raise RuntimeError(f'Missing required env var: {name}')
    return value


def now_stamp() -> str:
    return datetime.now().strftime('%Y-%m-%d %H:%M')


def clean_url(url: str) -> str:
    url = (url or '').strip()
    if not url:
        return ''
    if not url.startswith(('http://', 'https://')):
        url = 'https://' + url
    return url


def read_csv(path: str):
    with open(path, newline='', encoding='utf-8') as f:
        return list(csv.DictReader(f))


def write_csv(path: str, rows, fieldnames):
    with open(path, 'w', newline='', encoding='utf-8') as f:
        w = csv.DictWriter(f, fieldnames=fieldnames)
        w.writeheader()
        w.writerows(rows)


def ensure_tracker_columns(rows):
    if not rows:
        return []

    for r in rows:
        if 'response_status' not in r or not r['response_status']:
            r['response_status'] = 'not_contacted'
        if r['response_status'] not in TAXONOMY:
            r['response_status'] = 'needs_manual'
        r.setdefault('contact_channel', '')
        r.setdefault('contacted_at', '')
        r.setdefault('claimed', 'no')
        r.setdefault('featured_trial_started', 'no')
        r.setdefault('tracked_clicks_7d', '0')
        r.setdefault('renewal_offer_sent', 'no')
        r.setdefault('paid_99', 'no')
        r.setdefault('notes', '')
        r.setdefault('delivery_evidence', '')
        r.setdefault('delivery_url', '')

    fieldnames = list(rows[0].keys())
    for extra in ('delivery_evidence', 'delivery_url'):
        if extra not in fieldnames:
            fieldnames.append(extra)
    return fieldnames


def extract_mailto(soup: BeautifulSoup):
    out = []
    seen = set()
    for a in soup.select('a[href]'):
        href = (a.get('href') or '').strip()
        if not href.lower().startswith('mailto:'):
            continue
        email_addr = href.split(':', 1)[1].split('?', 1)[0].strip()
        if not email_addr or '@' not in email_addr:
            continue
        key = email_addr.lower()
        if key in seen:
            continue
        seen.add(key)
        out.append(email_addr)
    return out


def contact_pages(base_url: str, soup: BeautifulSoup):
    pages = []
    seen = set()
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


def submit_form(session: requests.Session, page_url: str, form, listing_url: str, sender_name: str, reply_to_email: str):
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

    body = (
        f'Hi,\n\n'
        f'We built a Toronto directory for clients looking for exactly what you offer, and we created a profile for you based on your public presence.\n\n'
        f"It's live here:\n"
        f'{listing_url}\n\n'
        f'You can claim it for free and update your photos, rates, availability, and contact links — takes a few minutes. '
        f'Providers who claim this week also get 7 days of free featured placement at the top of the Toronto page.\n\n'
        f"If you'd rather we take it down, just reply and we'll remove it same day.\n\n"
        f'— {sender_name}\nDommeDirectory\n{reply_to_email}\n'
    )

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
        if inp.name == 'textarea':
            data[n] = inp.text or ''
        else:
            data[n] = inp.get('value', '')

    data[message_field.get('name')] = body
    if name_field is not None and name_field.get('name'):
        data[name_field.get('name')] = sender_name
    if email_field is not None and email_field.get('name'):
        data[email_field.get('name')] = reply_to_email
    if subject_field is not None and subject_field.get('name'):
        data[subject_field.get('name')] = 'Your listing on DommeDirectory — quick note'

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


def send_email(to_addr: str, listing_url: str, sender_name: str, reply_to_email: str, smtp_user: str, smtp_pass: str, smtp_host: str, smtp_port: int):
    msg = EmailMessage()
    msg['From'] = f'{sender_name} <{smtp_user}>'
    msg['To'] = to_addr
    msg['Reply-To'] = reply_to_email
    msg['Subject'] = 'Your listing on DommeDirectory — quick note'
    msg.set_content(
        f'Hi,\n\n'
        f'We built a Toronto directory for clients looking for exactly what you offer, and we created a profile for you based on your public presence.\n\n'
        f"It's live here:\n"
        f'{listing_url}\n\n'
        f'You can claim it for free and update your photos, rates, availability, and contact links — takes a few minutes. '
        f'Providers who claim this week also get 7 days of free featured placement at the top of the Toronto page.\n\n'
        f"If you'd rather we take it down, just reply and we'll remove it same day.\n\n"
        f'— {sender_name}\nDommeDirectory\n{reply_to_email}\n'
    )

    ctx = ssl.create_default_context()
    try:
        with smtplib.SMTP_SSL(smtp_host, smtp_port, context=ctx, timeout=25) as server:
            server.login(smtp_user, smtp_pass)
            server.send_message(msg)
        return 'delivered_email', 'smtp_sent', f'mailto:{to_addr}'
    except Exception:
        return 'needs_manual', 'smtp_send_failed', f'mailto:{to_addr}'


def process_candidate(row, sender_name, reply_to_email, smtp_user, smtp_pass, smtp_host, smtp_port):
    website = clean_url(row.get('seed_contact_website', ''))
    listing_url = (row.get('listing_url') or '').strip()

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

    # email first
    if emails:
        return send_email(
            emails[0],
            listing_url,
            sender_name,
            reply_to_email,
            smtp_user,
            smtp_pass,
            smtp_host,
            smtp_port,
        )

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
        forms = soup.find_all('form')
        for form in forms:
            status, evidence, delivery_url = submit_form(
                session,
                resp.url,
                form,
                listing_url,
                sender_name,
                reply_to_email,
            )
            if status in {'delivered_form', 'needs_manual'}:
                return status, evidence, delivery_url

    return 'no_contact_method', 'form_or_email_not_found', home.url


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--targets', required=True)
    parser.add_argument('--tracker', required=True)
    parser.add_argument('--daily-limit', type=int, default=int(os.getenv('OUTREACH_DAILY_LIMIT', '8')))
    args = parser.parse_args()

    reply_to_email = required_env('OUTREACH_REPLY_TO_EMAIL')
    sender_name = os.getenv('OUTREACH_SENDER_NAME', 'DommeDirectory Partnerships')

    smtp_user = os.getenv('OUTREACH_SMTP_USERNAME', reply_to_email)
    smtp_pass = required_env('OUTREACH_SMTP_PASSWORD')
    smtp_host = os.getenv('OUTREACH_SMTP_HOST', 'mail.spacemail.com')
    smtp_port = int(os.getenv('OUTREACH_SMTP_PORT', '465'))

    targets = read_csv(args.targets)
    tracker = read_csv(args.tracker)
    fieldnames = ensure_tracker_columns(tracker)

    tracker_map = {r['listing_id']: r for r in tracker}

    # Only untouched rows for outbound attempts.
    candidates = []
    for t in targets:
        row = tracker_map.get(t['listing_id'])
        if not row:
            continue
        if row.get('response_status', 'not_contacted') != 'not_contacted':
            continue
        if not t.get('seed_contact_website'):
            continue
        candidates.append((t, row))

    sent_today = 0

    for target, tracker_row in candidates:
        if sent_today >= args.daily_limit:
            break

        status, evidence, delivery_url = process_candidate(
            target,
            sender_name,
            reply_to_email,
            smtp_user,
            smtp_pass,
            smtp_host,
            smtp_port,
        )

        tracker_row['contacted_at'] = now_stamp()
        tracker_row['contact_channel'] = 'email' if status == 'delivered_email' else ('dm' if status in {'platform_only', 'dm_sent'} else 'contact_form')
        tracker_row['response_status'] = status
        tracker_row['delivery_evidence'] = evidence
        tracker_row['delivery_url'] = delivery_url
        tracker_row['notes'] = evidence

        # Count only delivery attempts (not platform_only/no_contact/site_down pre-classification)
        if status in {'delivered_form', 'delivered_email', 'needs_manual'}:
            sent_today += 1

        print(f"{target['title']} -> {status} ({evidence})")
        time.sleep(1.0)

    write_csv(args.tracker, tracker, fieldnames)
    print(f'daily_outreach: attempts_recorded={sent_today}')


if __name__ == '__main__':
    main()
