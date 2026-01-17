-- =====================================================
-- Ticketing System & Push Notifications - Database Migration
-- Run this in your Supabase SQL Editor
-- =====================================================

-- =====================================================
-- 1. TICKETS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    ticket_number TEXT UNIQUE NOT NULL,
    subject TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('order_issue', 'license_issue', 'payment', 'technical', 'other')),
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'awaiting_reply', 'resolved', 'closed')),
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tickets_user ON tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_number ON tickets(ticket_number);

-- Function to generate ticket number
CREATE OR REPLACE FUNCTION generate_ticket_number()
RETURNS TRIGGER AS $$
DECLARE
    next_num INTEGER;
BEGIN
    SELECT COALESCE(MAX(CAST(SUBSTRING(ticket_number FROM 5) AS INTEGER)), 0) + 1
    INTO next_num
    FROM tickets;
    
    NEW.ticket_number := 'TKT-' || LPAD(next_num::TEXT, 5, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_generate_ticket_number ON tickets;
CREATE TRIGGER trigger_generate_ticket_number
    BEFORE INSERT ON tickets
    FOR EACH ROW
    EXECUTE FUNCTION generate_ticket_number();

-- =====================================================
-- 2. TICKET MESSAGES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS ticket_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    sender_type TEXT NOT NULL CHECK (sender_type IN ('user', 'admin')),
    sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    attachments JSONB DEFAULT '[]',
    is_internal BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ticket_messages_ticket ON ticket_messages(ticket_id);

-- =====================================================
-- 3. PUSH SUBSCRIPTIONS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS push_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    endpoint TEXT NOT NULL,
    keys JSONB NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, endpoint)
);

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user ON push_subscriptions(user_id, is_active);

-- =====================================================
-- 4. NOTIFICATIONS LOG TABLE (for tracking sent notifications)
-- =====================================================

CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('order_update', 'ticket_reply', 'price_alert', 'promotion', 'system')),
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    data JSONB DEFAULT '{}',
    is_read BOOLEAN DEFAULT FALSE,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read);

-- =====================================================
-- 5. RLS POLICIES
-- =====================================================

ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Tickets: Users can view their own
CREATE POLICY "Users can view own tickets" ON tickets
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create tickets" ON tickets
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Ticket messages: Users can view messages on their tickets
CREATE POLICY "Users can view messages on own tickets" ON ticket_messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM tickets 
            WHERE tickets.id = ticket_messages.ticket_id 
            AND tickets.user_id = auth.uid()
        )
        AND is_internal = FALSE
    );

CREATE POLICY "Users can create messages on own tickets" ON ticket_messages
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM tickets 
            WHERE tickets.id = ticket_messages.ticket_id 
            AND tickets.user_id = auth.uid()
        )
        AND sender_type = 'user'
    );

-- Push subscriptions: Users manage their own
CREATE POLICY "Users can manage own subscriptions" ON push_subscriptions
    FOR ALL USING (auth.uid() = user_id);

-- Notifications: Users can view their own
CREATE POLICY "Users can view own notifications" ON notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON notifications
    FOR UPDATE USING (auth.uid() = user_id);

-- =====================================================
-- 6. UPDATE TRIGGER FOR TICKETS
-- =====================================================

CREATE OR REPLACE FUNCTION update_ticket_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_ticket_timestamp ON tickets;
CREATE TRIGGER trigger_update_ticket_timestamp
    BEFORE UPDATE ON tickets
    FOR EACH ROW
    EXECUTE FUNCTION update_ticket_timestamp();

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE 'Migration completed successfully!';
    RAISE NOTICE 'Tables created:';
    RAISE NOTICE '  - tickets (with auto-generated ticket numbers)';
    RAISE NOTICE '  - ticket_messages';
    RAISE NOTICE '  - push_subscriptions';
    RAISE NOTICE '  - notifications';
END $$;
