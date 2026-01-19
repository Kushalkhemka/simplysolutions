# Amazon Order Sync - Cron Job Setup

## Overview
Set up automated order syncing on your VPS:
- **FBA Orders**: Daily at 2:00 AM
- **Merchant Orders**: Every 15 minutes

---

## Setup Steps

### 1. Install Node.js dependencies on VPS
```bash
cd /var/www/simplysolutions
npm install
```

### 2. Create the cron jobs
```bash
crontab -e
```

Add these lines:
```cron
# FBA Orders Sync - Daily at 2:00 AM
0 2 * * * cd /var/www/simplysolutions && /usr/bin/npx tsx scripts/amazon-orders-sync.ts >> /var/log/simplysolutions/fba-sync.log 2>&1

# Merchant Orders Sync - Every 15 minutes
*/15 * * * * cd /var/www/simplysolutions && /usr/bin/npx tsx scripts/amazon-orders-sync.ts >> /var/log/simplysolutions/merchant-sync.log 2>&1
```

### 3. Create log directory
```bash
sudo mkdir -p /var/log/simplysolutions
sudo chown $USER:$USER /var/log/simplysolutions
```

### 4. Verify cron is working
```bash
# List cron jobs
crontab -l

# Watch logs
tail -f /var/log/simplysolutions/fba-sync.log
tail -f /var/log/simplysolutions/merchant-sync.log
```

---

## Notes

- The sync script uses `.env.local` for Amazon SP-API credentials
- Make sure `AMAZON_SP_*` environment variables are set on VPS
- Script uses rate limiting (200ms delay) to avoid SP-API throttling
