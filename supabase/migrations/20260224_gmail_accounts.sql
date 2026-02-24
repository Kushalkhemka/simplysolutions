-- Gmail accounts table to support multiple OAuth email accounts
CREATE TABLE IF NOT EXISTS gmail_accounts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    label TEXT, -- Display name e.g. "CodeKeys Main", "Support Account"
    client_id TEXT NOT NULL,
    client_secret TEXT NOT NULL,
    refresh_token TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    last_synced_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add account_id to gmail_enquiries to track which account the email came from
ALTER TABLE gmail_enquiries ADD COLUMN IF NOT EXISTS account_id UUID REFERENCES gmail_accounts(id);
ALTER TABLE gmail_enquiries ADD COLUMN IF NOT EXISTS account_email TEXT;
