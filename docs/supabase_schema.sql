-- ==============================================================================
-- MarketMind India: Supabase Schema & Row Level Security (RLS) Migration
-- Run this script in the Supabase Dashboard -> SQL Editor
-- ==============================================================================

-- 1. Enable UUID Extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Watchlists Table (Stores user favorite stocks)
CREATE TABLE IF NOT EXISTS public.watchlists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    symbol VARCHAR(30) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT unique_user_symbol UNIQUE (user_id, symbol)
);

-- Enable RLS for Watchlists
ALTER TABLE public.watchlists ENABLE ROW LEVEL SECURITY;

-- Watchlists RLS Policies
CREATE POLICY "Users can view their own watchlist items"
    ON public.watchlists FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert into their own watchlist"
    ON public.watchlists FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete from their own watchlist"
    ON public.watchlists FOR DELETE
    USING (auth.uid() = user_id);

-- 3. Analysis Cache Table (Caches Claude 3.5 Sonnet analysis to minimize token costs)
CREATE TABLE IF NOT EXISTS public.analysis_cache (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    symbol VARCHAR(30) NOT NULL,
    payload JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_analysis_cache_symbol ON public.analysis_cache (symbol, created_at DESC);

-- Enable RLS for Analysis Cache (Public read, authenticated insert)
ALTER TABLE public.analysis_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read for analysis cache"
    ON public.analysis_cache FOR SELECT
    USING (true);

CREATE POLICY "Service or authenticated insert into analysis cache"
    ON public.analysis_cache FOR INSERT
    WITH CHECK (true);

-- 4. News Sentiment Table (Stores categorized headlines keyed by MD5 hash)
CREATE TABLE IF NOT EXISTS public.news_sentiment (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    headline_hash VARCHAR(64) UNIQUE NOT NULL,
    symbol VARCHAR(30),
    headline TEXT NOT NULL,
    sentiment VARCHAR(20) NOT NULL,
    score NUMERIC(4, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_news_sentiment_hash ON public.news_sentiment (headline_hash);

-- Enable RLS for News Sentiment
ALTER TABLE public.news_sentiment ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read for news sentiment"
    ON public.news_sentiment FOR SELECT
    USING (true);

CREATE POLICY "Authenticated or service insert for news sentiment"
    ON public.news_sentiment FOR INSERT
    WITH CHECK (true);

-- 5. Backtests Table (Stores historical strategy simulation runs)
CREATE TABLE IF NOT EXISTS public.backtests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    symbol VARCHAR(30) NOT NULL,
    strategy VARCHAR(50) NOT NULL,
    params JSONB NOT NULL,
    result JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for Backtests
ALTER TABLE public.backtests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own backtests"
    ON public.backtests FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own backtests"
    ON public.backtests FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own backtests"
    ON public.backtests FOR DELETE
    USING (auth.uid() = user_id);



-- 6. Price Alerts Table (Stores user limit price and percentage alerts)
CREATE TABLE IF NOT EXISTS public.price_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    symbol VARCHAR(30) NOT NULL,
    alert_type VARCHAR(30) NOT NULL, -- 'ABOVE_LIMIT', 'BELOW_LIMIT', 'PCT_GAIN', 'PCT_DROP'
    target_value NUMERIC(12, 2) NOT NULL,
    note TEXT,
    initial_price NUMERIC(12, 2) NOT NULL,
    status VARCHAR(20) DEFAULT 'ACTIVE' NOT NULL, -- 'ACTIVE', 'TRIGGERED', 'CANCELLED'
    triggered_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_price_alerts_user ON public.price_alerts (user_id, status);

-- Enable RLS for Price Alerts
ALTER TABLE public.price_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own price alerts"
    ON public.price_alerts FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own price alerts"
    ON public.price_alerts FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own price alerts"
    ON public.price_alerts FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own price alerts"
    ON public.price_alerts FOR DELETE
    USING (auth.uid() = user_id);
