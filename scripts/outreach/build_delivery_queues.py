#!/usr/bin/env python3
"""Build outreach delivery queues from tracker rows not yet contacted."""

import argparse
import csv
from urllib.parse import urljoin, urlparse

import requests
from bs4 import BeautifulSoup

PLATFORM = {
    'onlyfans.com', 'www.onlyfans.com',
    'linktr.ee', 'www.linktr.ee',
    'bsky.app', 'www.bsky.app',
    'fansly.com', 'www.fansly.com',
    't.me', 'telegram.me',
}

KEYWORDS = ('contact', 'booking', 'book', 'inquir', 'reach', 'get-in-touch')

HEADERS = {
    'User-Agent': 'Mozilla/5.0',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
}


def read_csv(path: str):
    with open(path, newline='', encoding='utf-8') as f:
        return list(csv.DictReader(f))


def write_csv(path: str, rows, fieldnames):
    with open(path, 'w', newline='', encoding='utf-8') as f:
        w = csv.DictWriter(f, fieldnames=fieldnames)
        w.writeheader()
        w.writerows(rows)


def extract_mailto(soup: BeautifulSoup):
    emails = []
    seen = set()
    for a in soup.select('a[href]'):
        href = (a.get('href') or '').strip()
        if href.lower().startswith('mailto:'):
            addr = href.split(':', 1)[1].split('?', 1)[0].strip()
            if addr and '@' in addr and addr.lower() not in seen:
                seen.add(addr.lower())
                emails.append(addr)
    return emails


def has_confirmable_form(soup: BeautifulSoup):
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
    out = []
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
        out.append(norm)
        if len(out) >= 5:
            break
    return out


def classify_row(session, row):
    website = (row.get('seed_contact_website') or '').strip()
    item = {
        'listing_id': row.get('listing_id', ''),
        'title': row.get('title', ''),
        'listing_url': row.get('listing_url', ''),
        'seed_contact_website': website,
        'seed_source_url': row.get('seed_source_url', ''),
        'reason': '',
        'delivery_evidence': '',
        'delivery_url': '',
    }

    if not website:
        item['reason'] = 'no_contact_method'
        item['delivery_evidence'] = 'missing_seed_contact_website'
        return 'no_contact', item

    if not website.startswith(('http://', 'https://')):
        website = f'https://{website}'
        item['seed_contact_website'] = website

    try:
        host = urlparse(website).netloc.lower()
    except Exception:
        item['reason'] = 'no_contact_method'
        item['delivery_evidence'] = 'invalid_website_url'
        return 'no_contact', item

    if host in PLATFORM:
        item['reason'] = 'platform_only'
        item['delivery_evidence'] = f'platform_domain:{host}'
        item['delivery_url'] = website
        return 'dm', item

    try:
        home = session.get(website, timeout=20, allow_redirects=True)
    except Exception:
        item['reason'] = 'no_contact_method'
        item['delivery_evidence'] = 'site_unreachable'
        item['delivery_url'] = website
        return 'no_contact', item

    if home.status_code >= 500:
        item['reason'] = 'no_contact_method'
        item['delivery_evidence'] = f'http_{home.status_code}'
        item['delivery_url'] = home.url
        return 'no_contact', item

    soup = BeautifulSoup(home.text or '', 'html.parser')
    mails = extract_mailto(soup)
    if mails:
        item['reason'] = 'email_exposed'
        item['delivery_evidence'] = 'mailto_found'
        item['delivery_url'] = f'mailto:{mails[0]}'
        return 'email', item

    if has_confirmable_form(soup):
        item['reason'] = 'confirmable_form'
        item['delivery_evidence'] = 'form_message_field_no_captcha'
        item['delivery_url'] = home.url
        return 'form', item

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
            item['reason'] = 'email_exposed'
            item['delivery_evidence'] = 'mailto_found'
            item['delivery_url'] = f'mailto:{mails[0]}'
            return 'email', item

        if has_confirmable_form(s2):
            item['reason'] = 'confirmable_form'
            item['delivery_evidence'] = 'form_message_field_no_captcha'
            item['delivery_url'] = resp.url
            return 'form', item

    item['reason'] = 'no_contact_method'
    item['delivery_evidence'] = 'form_or_email_not_found'
    item['delivery_url'] = home.url
    return 'no_contact', item


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--tracker', required=True)
    parser.add_argument('--out-dir', required=True)
    parser.add_argument('--deliverable-limit', type=int, default=30)
    args = parser.parse_args()

    rows = read_csv(args.tracker)
    pending = [r for r in rows if (r.get('response_status') or '').strip() == 'not_contacted']

    session = requests.Session()
    session.headers.update(HEADERS)

    email_first = []
    forms = []
    dm_queue = []
    no_contact = []

    for row in pending:
        bucket, item = classify_row(session, row)
        if bucket == 'email':
            email_first.append(item)
        elif bucket == 'form':
            forms.append(item)
        elif bucket == 'dm':
            dm_queue.append(item)
        else:
            no_contact.append(item)

    for lst in (email_first, forms, dm_queue, no_contact):
        lst.sort(key=lambda x: (x.get('title') or '').lower())

    fields = ['listing_id', 'title', 'listing_url', 'seed_contact_website', 'seed_source_url', 'reason', 'delivery_evidence', 'delivery_url']

    write_csv(f"{args.out_dir}/batch2_email_first.csv", email_first, fields)
    write_csv(f"{args.out_dir}/batch2_forms_confirmable.csv", forms, fields)
    write_csv(f"{args.out_dir}/dm_queue.csv", dm_queue, fields)
    write_csv(f"{args.out_dir}/no_contact_method.csv", no_contact, fields)

    deliverable = (email_first + forms)[:args.deliverable_limit]
    write_csv(f"{args.out_dir}/batch2_deliverable_30.csv", deliverable, fields)

    print(f"email_first={len(email_first)} forms={len(forms)} dm_queue={len(dm_queue)} no_contact={len(no_contact)} deliverable={len(deliverable)}")


if __name__ == '__main__':
    main()
