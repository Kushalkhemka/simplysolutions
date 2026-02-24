-- Gmail Enquiries table to cache emails synced via cron
CREATE TABLE IF NOT EXISTS gmail_enquiries (
    id TEXT PRIMARY KEY, -- Gmail message ID
    thread_id TEXT NOT NULL,
    message_id TEXT, -- RFC Message-ID header
    from_address TEXT NOT NULL,
    to_address TEXT,
    subject TEXT,
    date TIMESTAMPTZ,
    snippet TEXT,
    body TEXT,
    labels TEXT[], -- Gmail labels
    customer_name TEXT,
    order_id TEXT,
    product TEXT,
    return_requested TEXT,
    reason TEXT,
    category TEXT DEFAULT 'other', -- delivery, refund, product_claim, tech_support, other
    ai_suggested_reply TEXT, -- Pre-generated AI reply
    ai_template_used TEXT, -- Which template the AI selected
    is_replied BOOLEAN DEFAULT FALSE,
    replied_at TIMESTAMPTZ,
    is_read BOOLEAN DEFAULT FALSE,
    synced_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_gmail_enquiries_thread_id ON gmail_enquiries(thread_id);
CREATE INDEX IF NOT EXISTS idx_gmail_enquiries_order_id ON gmail_enquiries(order_id);
CREATE INDEX IF NOT EXISTS idx_gmail_enquiries_category ON gmail_enquiries(category);
CREATE INDEX IF NOT EXISTS idx_gmail_enquiries_is_replied ON gmail_enquiries(is_replied);
CREATE INDEX IF NOT EXISTS idx_gmail_enquiries_date ON gmail_enquiries(date DESC);
