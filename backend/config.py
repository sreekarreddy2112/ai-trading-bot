import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env file from backend root
env_path = Path(__file__).resolve().parent / ".env"
load_dotenv(dotenv_path=env_path)

class Settings:
    PROJECT_NAME: str = "MarketMind India"
    VERSION: str = "1.0.0"
    DESCRIPTION: str = "AI Indian Stock Market Analyst & Quantitative Intelligence Platform"
    
    # Anthropic Claude API Key
    ANTHROPIC_API_KEY: str = os.getenv("ANTHROPIC_API_KEY", "").strip()
    CLAUDE_MODEL: str = os.getenv("CLAUDE_MODEL", "claude-3-5-sonnet-20241022")
    
    # Supabase credentials (optional for cloud persistence)
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "").strip()
    SUPABASE_SERVICE_KEY: str = os.getenv("SUPABASE_SERVICE_KEY", "").strip()
    SUPABASE_ANON_KEY: str = os.getenv("SUPABASE_ANON_KEY", "").strip()
    
    # News API Key (optional)
    NEWS_API_KEY: str = os.getenv("NEWS_API_KEY", "").strip()
    
    # External Indian Market API Providers (Optional - yfinance NSE institutional feed is default)
    INDIAN_API_KEY: str = os.getenv("INDIAN_API_KEY", "").strip()
    TRUEDATA_API_KEY: str = os.getenv("TRUEDATA_API_KEY", "").strip()
    GROWW_API_TOKEN: str = os.getenv("GROWW_API_TOKEN", "").strip()
    NSE_FEED_DELAY_MINUTES: int = int(os.getenv("NSE_FEED_DELAY_MINUTES", "15"))
    
    # CORS Origins
    ALLOWED_ORIGINS: list[str] = [
        origin.strip()
        for origin in os.getenv(
            "ALLOWED_ORIGIN", 
            "http://localhost:3000,http://127.0.0.1:3000,http://localhost:3001"
        ).split(",")
        if origin.strip()
    ]
    
    # Caching durations (in seconds)
    MARKET_OVERVIEW_CACHE_SECONDS: int = 300      # 5 minutes
    AI_ANALYSIS_CACHE_SECONDS: int = 1800          # 30 minutes
    NEWS_CACHE_SECONDS: int = 600                  # 10 minutes
    
    # Rate Limiting: 10 requests per user/IP per hour for AI endpoints
    AI_RATE_LIMIT_PER_HOUR: int = 10
    
    # Compliance Disclaimer
    SEBI_DISCLAIMER: str = (
        "MarketMind India is an analytical and educational platform. "
        "It does not provide SEBI-registered investment advice, stock recommendations, "
        "or portfolio management services. Analysis is strictly algorithmic and informational. "
        "Past performance is no guarantee of future returns."
    )

settings = Settings()

