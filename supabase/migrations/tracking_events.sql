-- =====================================================
-- TRACKING EVENTS TABLE
-- Server-side conversion event audit trail for
-- Meta Conversions API (CAPI) and TikTok Events API.
--
-- Each row represents one conversion event dispatched
-- from the backend to an ad platform.  PII is NOT
-- stored here — only hashed values are transmitted to
-- the platforms; raw user_data stored here is used
-- solely for internal debugging and compliance audits.
-- =====================================================

CREATE TABLE IF NOT EXISTS tracking_events (
    id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Which event type was fired (e.g. Purchase, AddToCart, Lead, ViewContent)
    event_type  VARCHAR(50)  NOT NULL,

    -- Which ad platform received the event ('meta' | 'tiktok')
    platform    VARCHAR(20)  NOT NULL,

    -- Unique event ID used for browser-pixel deduplication
    event_id    VARCHAR(255) UNIQUE,

    -- Raw user data supplied by the caller (stored for audit; PII hashed before sending)
    user_data   JSONB,

    -- Event-specific data (value, currency, content_ids, etc.)
    custom_data JSONB,

    -- Processing status: 'pending' | 'sent' | 'failed' | 'duplicate'
    status      VARCHAR(20)  NOT NULL DEFAULT 'pending',

    -- Raw JSON response returned by the ad platform API
    response    JSONB,

    created_at  TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- =====================================================
-- INDEXES
-- =====================================================

-- Filter by platform (meta / tiktok)
CREATE INDEX IF NOT EXISTS idx_tracking_events_platform
    ON tracking_events (platform);

-- Filter by event type (Purchase, AddToCart, etc.)
CREATE INDEX IF NOT EXISTS idx_tracking_events_event_type
    ON tracking_events (event_type);

-- Time-range queries for dashboards and audits
CREATE INDEX IF NOT EXISTS idx_tracking_events_created_at
    ON tracking_events (created_at DESC);

-- Filter by processing status
CREATE INDEX IF NOT EXISTS idx_tracking_events_status
    ON tracking_events (status);

-- =====================================================
-- AUTO-UPDATE updated_at TRIGGER
-- =====================================================

-- Reuse the function created in 001_create_tables.sql if it exists,
-- otherwise create it here.
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_tracking_events_updated_at
    BEFORE UPDATE ON tracking_events
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ROW LEVEL SECURITY (optional — enable if using anon key)
-- =====================================================
-- ALTER TABLE tracking_events ENABLE ROW LEVEL SECURITY;
-- Only service role can read/write tracking events.
-- CREATE POLICY "service_role_only" ON tracking_events
--     USING (auth.role() = 'service_role');
