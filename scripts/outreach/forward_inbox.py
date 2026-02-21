#!/usr/bin/env python3
"""Forward all new inbox messages to a target mailbox.

Uses IMAP to read unseen messages and SMTP to forward each message as an .eml attachment.
Designed for cron use.
"""

import imaplib
import os
import smtplib
import ssl
from email import policy
from email.message import EmailMessage
from email.parser import BytesParser


def getenv_required(name: str) -> str:
    value = os.getenv(name, '').strip()
    if not value:
        raise RuntimeError(f'Missing required env var: {name}')
    return value


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

    if not imap_pass:
        raise RuntimeError('Missing OUTREACH_IMAP_PASSWORD (or OUTREACH_SMTP_PASSWORD fallback)')
    if not smtp_pass:
        raise RuntimeError('Missing OUTREACH_SMTP_PASSWORD')

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

            # Prevent obvious forwarding loops.
            if forward_to.lower() in str(original.get('To', '')).lower() and 'FWD' in subj.upper():
                imap.store(msg_id, '+FLAGS', '(\\Seen)')
                continue

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
    print(f'forwarder: forwarded={sent}')


if __name__ == '__main__':
    main()
