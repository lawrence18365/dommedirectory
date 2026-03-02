#!/usr/bin/env python3
"""Forward new inbox messages and auto-classify outreach replies.

Uses IMAP to read unseen messages and SMTP to forward each message as an .eml
attachment. When Supabase credentials are present, this script also:
  - detects simple positive/opt-out reply intent
  - updates outreach_contacts status (replied / opted_out)
  - optionally sends an auto-ack for positive or opt-out replies
"""

import imaplib
import os
import re
import smtplib
import ssl
from datetime import datetime, timezone
from email import policy
from email.message import EmailMessage
from email.parser import BytesParser
from email.utils import parseaddr
from typing import Optional, Tuple

from supabase import Client, create_client


def getenv_required(name: str) -> str:
    value = os.getenv(name, '').strip()
    if not value:
        raise RuntimeError(f'Missing required env var: {name}')
    return value


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def env_truthy(name: str, default: str = 'false') -> bool:
    value = os.getenv(name, default).strip().lower()
    return value in {'1', 'true', 'yes', 'y', 'on'}


def extract_text(msg: EmailMessage) -> str:
    preferred = msg.get_body(preferencelist=('plain', 'html'))
    if preferred is not None:
        content = preferred.get_content() or ''
    else:
        content = msg.get_content() or ''
    if preferred is not None and preferred.get_content_type() == 'text/html':
        content = re.sub(r'<[^>]+>', ' ', content)
    content = re.sub(r'\s+', ' ', content).strip()
    return content[:4000]


def classify_reply_intent(subject: str, body: str) -> Optional[str]:
    text = f'{subject}\n{body}'.lower()

    # Skip obvious autoresponders.
    if any(s in text for s in ('out of office', 'automatic reply', 'autoreply', 'auto reply')):
        return None

    opt_out_patterns = (
        r'\bdo not contact\b',
        r"\bdon't contact\b",
        r'\bunsubscribe\b',
        r'\bremove me\b',
        r'\bopt out\b',
        r'\btake me off\b',
        r'\bstop\b',
        r'\bnot interested\b',
        r'\bno thanks\b',
        r'^\s*no[\s.,!]*$',
    )
    positive_patterns = (
        r'^\s*yes\b',
        r'\binterested\b',
        r'\bsounds good\b',
        r'\bokay\b',
        r'\bok\b',
        r'\bsure\b',
        r'\bproceed\b',
        r'\bsend (a )?(draft|preview)\b',
        r"\blet'?s do it\b",
    )

    if any(re.search(pattern, text, flags=re.IGNORECASE | re.MULTILINE) for pattern in opt_out_patterns):
        return 'opt_out'
    if any(re.search(pattern, text, flags=re.IGNORECASE | re.MULTILINE) for pattern in positive_patterns):
        return 'positive'
    return None


def append_note(existing: Optional[str], new_note: str) -> str:
    if not existing:
        return new_note
    if new_note in existing:
        return existing
    return f'{existing}\n{new_note}'


def get_supabase_client() -> Optional[Client]:
    url = os.getenv('SUPABASE_URL') or os.getenv('NEXT_PUBLIC_SUPABASE_URL')
    key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
    if not url or not key:
        return None
    return create_client(url, key)


def load_contacts_by_email(sb: Client) -> dict[str, dict]:
    res = sb.table('outreach_contacts') \
        .select('id, seed_contact_email, status, notes, updated_at, last_contacted_at') \
        .limit(5000) \
        .execute()
    rows = res.data or []

    def sort_key(row: dict):
        return (
            row.get('last_contacted_at') or '',
            row.get('updated_at') or '',
        )

    rows.sort(key=sort_key, reverse=True)

    by_email: dict[str, dict] = {}
    for row in rows:
        email = (row.get('seed_contact_email') or '').strip().lower()
        if not email:
            continue
        if email not in by_email:
            by_email[email] = row
    return by_email


def update_contact_status(sb: Client, contact: dict, intent: str, subject: str) -> Tuple[bool, str]:
    contact_id = contact['id']
    previous_status = (contact.get('status') or '').strip()

    if intent == 'opt_out':
        next_status = 'opted_out'
    elif intent == 'positive':
        if previous_status in {'claimed', 'opted_out'}:
            return False, previous_status
        next_status = 'replied'
    else:
        return False, previous_status

    note = f'[{now_iso()}] auto_reply_intent={intent} subject="{subject[:160]}"'
    payload = {
        'status': next_status,
        'notes': append_note(contact.get('notes'), note),
        'updated_at': now_iso(),
    }

    sb.table('outreach_contacts').update(payload).eq('id', contact_id).execute()
    contact['status'] = next_status
    contact['notes'] = payload['notes']
    return True, next_status


def send_auto_ack(
    smtp: smtplib.SMTP_SSL,
    to_email: str,
    sender_name: str,
    reply_to: str,
    original_subject: str,
    intent: str,
) -> bool:
    if intent == 'positive':
        subject = f'Re: {original_subject}' if original_subject else 'Re: DommeDirectory'
        body = (
            'Thanks for confirming.\n\n'
            'Next steps:\n'
            '1) Create a free provider account: https://dommedirectory.com/auth/register\n'
            '2) Reply with your preferred display name + city\n'
            "3) We'll send a private draft for your approval before anything is published\n\n"
            'Reply anytime if you want us to pause or delete your record.\n\n'
            f'— {sender_name}\nDommeDirectory\n{reply_to}\n'
        )
    elif intent == 'opt_out':
        subject = f'Re: {original_subject}' if original_subject else 'Re: DommeDirectory'
        body = (
            "Understood. We've marked your address as opted out and won't contact you again.\n\n"
            f'— {sender_name}\nDommeDirectory\n{reply_to}\n'
        )
    else:
        return False

    smtp_user = os.getenv('OUTREACH_SMTP_USERNAME') or reply_to

    msg = EmailMessage()
    msg['From'] = f'{sender_name} <{smtp_user}>'
    msg['To'] = to_email
    msg['Reply-To'] = reply_to
    msg['Subject'] = subject
    msg.set_content(body)

    try:
        smtp.send_message(msg)
        return True
    except Exception as exc:
        print(f'auto_ack_error: {to_email} -> {exc}')
        return False


def main() -> None:
    imap_host = os.getenv('OUTREACH_IMAP_HOST', 'mail.spacemail.com')
    imap_port = int(os.getenv('OUTREACH_IMAP_PORT', '993'))
    smtp_host = os.getenv('OUTREACH_SMTP_HOST', 'mail.spacemail.com')
    smtp_port = int(os.getenv('OUTREACH_SMTP_PORT', '465'))

    reply_to = getenv_required('OUTREACH_REPLY_TO_EMAIL')
    imap_user = os.getenv('OUTREACH_IMAP_USERNAME', reply_to)
    imap_pass = os.getenv('OUTREACH_IMAP_PASSWORD') or os.getenv('OUTREACH_SMTP_PASSWORD')
    smtp_user = os.getenv('OUTREACH_SMTP_USERNAME', reply_to)
    smtp_pass = os.getenv('OUTREACH_SMTP_PASSWORD')
    forward_to = getenv_required('OUTREACH_FORWARD_TO_EMAIL')
    sender_name = os.getenv('OUTREACH_SENDER_NAME', 'DommeDirectory Partnerships')
    auto_ack_positive = env_truthy('OUTREACH_AUTO_ACK_POSITIVE', 'true')
    auto_ack_opt_out = env_truthy('OUTREACH_AUTO_ACK_OPT_OUT', 'false')

    if not imap_pass:
        raise RuntimeError('Missing OUTREACH_IMAP_PASSWORD (or OUTREACH_SMTP_PASSWORD fallback)')
    if not smtp_pass:
        raise RuntimeError('Missing OUTREACH_SMTP_PASSWORD')

    sb = get_supabase_client()
    contacts_by_email = load_contacts_by_email(sb) if sb else {}
    if sb:
        print(f'forwarder: loaded_contacts={len(contacts_by_email)}')
    else:
        print('forwarder: supabase not configured; reply classification disabled')

    imap = imaplib.IMAP4_SSL(imap_host, imap_port)
    imap.login(imap_user, imap_pass)
    imap.select('INBOX')

    typ, data = imap.search(None, '(UNSEEN)')
    if typ != 'OK':
        raise RuntimeError('Failed to search inbox for unseen mail')

    msg_ids = data[0].split() if data and data[0] else []
    if not msg_ids:
        print('forwarder: no unseen messages')
        imap.logout()
        return

    ctx = ssl.create_default_context()
    sent = 0
    classified_positive = 0
    classified_opt_out = 0
    auto_acks = 0

    with smtplib.SMTP_SSL(smtp_host, smtp_port, context=ctx, timeout=30) as smtp:
        smtp.login(smtp_user, smtp_pass)

        for msg_id in msg_ids:
            typ, fetched = imap.fetch(msg_id, '(RFC822)')
            if typ != 'OK' or not fetched or not isinstance(fetched[0], tuple):
                continue

            raw = fetched[0][1]
            original = BytesParser(policy=policy.default).parsebytes(raw)

            subj = str(original.get('Subject', '(no subject)'))
            from_hdr = str(original.get('From', '(unknown sender)'))
            sender_email = parseaddr(from_hdr)[1].strip().lower()

            # Prevent obvious forwarding loops.
            if forward_to.lower() in str(original.get('To', '')).lower() and 'FWD' in subj.upper():
                imap.store(msg_id, '+FLAGS', '(\\Seen)')
                continue

            # Only forward replies from external senders — skip our own
            # outgoing mail, auto-replies, bounces, and mailer-daemon.
            from_lower = from_hdr.lower()
            if 'dommedirectory.com' in from_lower:
                imap.store(msg_id, '+FLAGS', '(\\Seen)')
                continue
            if any(skip in from_lower for skip in ('mailer-daemon', 'postmaster', 'noreply', 'no-reply')):
                imap.store(msg_id, '+FLAGS', '(\\Seen)')
                continue
            auto = str(original.get('Auto-Submitted', '')).lower()
            if auto and auto != 'no':
                imap.store(msg_id, '+FLAGS', '(\\Seen)')
                continue

            if sb and sender_email:
                intent = classify_reply_intent(subj, extract_text(original))
                if intent:
                    contact = contacts_by_email.get(sender_email)
                    if contact:
                        changed, next_status = update_contact_status(sb, contact, intent, subj)
                        if changed:
                            if intent == 'positive':
                                classified_positive += 1
                                if auto_ack_positive and send_auto_ack(
                                    smtp, sender_email, sender_name, reply_to, subj, intent
                                ):
                                    auto_acks += 1
                            elif intent == 'opt_out':
                                classified_opt_out += 1
                                if auto_ack_opt_out and send_auto_ack(
                                    smtp, sender_email, sender_name, reply_to, subj, intent
                                ):
                                    auto_acks += 1
                            print(f'forwarder: status_update {sender_email} -> {next_status}')

            fwd = EmailMessage()
            fwd['From'] = f'{sender_name} <{reply_to}>'
            fwd['To'] = forward_to
            fwd['Reply-To'] = reply_to
            fwd['Subject'] = f'[Inbox Forward] {subj}'
            fwd.set_content(
                'Forwarded from hello@dommedirectory.com\n\n'
                f'Original From: {from_hdr}\n'
                f'Original Subject: {subj}\n'
            )
            fwd.add_attachment(
                raw,
                maintype='message',
                subtype='rfc822',
                filename='original.eml',
            )

            smtp.send_message(fwd)
            imap.store(msg_id, '+FLAGS', '(\\Seen)')
            sent += 1

    imap.logout()
    print(
        f'forwarder: forwarded={sent} '
        f'classified_positive={classified_positive} '
        f'classified_opt_out={classified_opt_out} '
        f'auto_acks={auto_acks}'
    )


if __name__ == '__main__':
    main()
