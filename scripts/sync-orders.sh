#!/bin/bash

# Amazon Order Sync Script
# Add to crontab on your VPS:
# */15 * * * * /path/to/sync-orders.sh mfn >> /var/log/amazon-sync.log 2>&1
# 0 2 * * * /path/to/sync-orders.sh fba >> /var/log/amazon-sync.log 2>&1

DOMAIN="https://your-domain.com"  # Change this to your domain
CRON_SECRET="your-cron-secret"     # Change this or leave empty if not set

TYPE=${1:-mfn}  # Default to mfn if no argument

echo "$(date): Starting $TYPE sync..."

if [ -z "$CRON_SECRET" ]; then
    curl -s "$DOMAIN/api/cron/sync-$TYPE"
else
    curl -s -H "Authorization: Bearer $CRON_SECRET" "$DOMAIN/api/cron/sync-$TYPE"
fi

echo "$(date): Sync complete"
