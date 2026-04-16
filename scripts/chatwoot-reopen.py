#!/usr/bin/env python3
"""
Resume sending 'reopen_conversation' - contacts 150-296 with fixed content field.
"""

import requests
import time
from datetime import datetime

CHATWOOT_URL = "https://chatwoot-chatwoot.6m9c4g.easypanel.host"
API_TOKEN = "7NerJbggcGGYbFRthnzL57PE"
WHATSAPP_INBOX_ID = 1
TEMPLATE_NAME = "reopen_conversation"
TEMPLATE_CONTENT = "Hello ,\n\nYour support chat session has expired due to 24 hours window limit by meta.\nPlease reply Hi to restart the conversation and continue support. Our team will be able to reply then."
SKIP_FIRST = 149  # Already sent

HEADERS = {"api_access_token": API_TOKEN, "Content-Type": "application/json"}
BASE = f"{CHATWOOT_URL}/api/v1/accounts/1"


def fetch_all_wa_contacts():
    all_contacts = []
    page = 1
    while True:
        resp = requests.post(f"{BASE}/contacts/filter?page={page}", headers=HEADERS, json={
            "payload": [{"attribute_key": "created_at", "filter_operator": "is_greater_than", "values": ["2026-04-08"], "query_operator": None}]
        })
        data = resp.json()
        contacts = data.get("payload", [])
        meta = data.get("meta", {})
        if not contacts: break
        all_contacts.extend(contacts)
        if len(all_contacts) >= meta.get("count", 0): break
        page += 1
        time.sleep(0.3)

    wa = []
    for c in all_contacts:
        for ci in c.get("contact_inboxes", []):
            if ci.get("inbox", {}).get("channel_type") == "Channel::Whatsapp":
                wa.append({"id": c["id"], "name": c.get("name", "?"), "phone": c.get("phone_number", ""),
                           "created": datetime.fromtimestamp(c.get("created_at", 0)).strftime("%Y-%m-%d %H:%M")})
                break
    return wa


def get_wa_conversation(contact_id):
    resp = requests.get(f"{BASE}/contacts/{contact_id}/conversations", headers=HEADERS)
    for conv in resp.json().get("payload", []):
        if conv.get("inbox_id") == WHATSAPP_INBOX_ID:
            return conv["id"]
    return None


def send_template(conversation_id):
    resp = requests.post(f"{BASE}/conversations/{conversation_id}/messages", headers=HEADERS, json={
        "content": TEMPLATE_CONTENT,
        "message_type": "outgoing",
        "template_params": {
            "name": TEMPLATE_NAME,
            "category": "UTILITY",
            "language": "en",
            "processed_params": {}
        }
    })
    return resp.status_code, resp.json()


def main():
    print(f"📋 Fetching contacts...")
    wa_contacts = fetch_all_wa_contacts()
    print(f"✅ Found {len(wa_contacts)} WhatsApp contacts")
    print(f"⏭️  Skipping first {SKIP_FIRST} (already sent)")

    remaining = wa_contacts[SKIP_FIRST:]
    print(f"📨 Sending to {len(remaining)} remaining contacts...\n")

    success = failed = no_convo = 0
    for i, c in enumerate(remaining, SKIP_FIRST + 1):
        print(f"[{i}/{len(wa_contacts)}] {c['name']:<30} {c['phone']:<16} ({c['created']})", end=" ", flush=True)

        conv_id = get_wa_conversation(c["id"])
        if not conv_id:
            print("⚠️ no conv")
            no_convo += 1
            time.sleep(0.2)
            continue

        status, result = send_template(conv_id)
        if status in (200, 201):
            print("✅")
            success += 1
        else:
            err = result.get("error", result.get("message", str(result)))
            print(f"❌ {err}")
            failed += 1
        time.sleep(0.3)

    print(f"\n{'='*60}")
    print(f"📊 DONE! ✅ Sent: {success} | ❌ Failed: {failed} | ⚠️ No conv: {no_convo}")
    print(f"{'='*60}")


if __name__ == "__main__":
    main()
