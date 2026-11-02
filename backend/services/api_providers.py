import datetime
import logging
from typing import Dict, Any, Optional
from config import settings

logger = logging.getLogger(__name__)

class MarketDataProvider:
    """
    Unified Indian Market Data Provider Adapter.
    Defaults to Yahoo Finance Institutional Feed for NSE (.NS),
    with pluggable hooks for TrueData, IndianAPI, Groww API, and NSE Official feeds.
    """
    
    @staticmethod
    def get_market_status() -> Dict[str, Any]:
        """
        Determines live NSE market status based on Indian Standard Time (IST - UTC+5:30).
        Standard trading hours: Monday to Friday 09:15 to 15:30 IST.
        """
        # Calculate current time in IST (UTC + 5:30)
        utc_now = datetime.datetime.now(datetime.timezone.utc)
        ist_tz = datetime.timezone(datetime.timedelta(hours=5, minutes=30))
        ist_now = utc_now.astimezone(ist_tz)
        
        weekday = ist_now.weekday() # 0 = Mon, 4 = Fri, 5 = Sat, 6 = Sun
        time_minutes = ist_now.hour * 60 + ist_now.minute

        if weekday >= 5:
            return {
                "status": "CLOSED",
                "is_open": False,
                "badge": "WEEKEND",
                "message": "NSE is closed for the weekend. Re-opens Monday at 09:15 AM IST.",
                "ist_time": ist_now.strftime("%d %b %Y, %I:%M %p IST")
            }
        
        # Pre-market: 09:00 to 09:15
        if 9 * 60 <= time_minutes < 9 * 60 + 15:
            return {
                "status": "PRE-OPEN",
                "is_open": False,
                "badge": "PRE-OPEN",
                "message": "NSE Pre-Market Session in progress. Regular trading starts at 09:15 AM IST.",
                "ist_time": ist_now.strftime("%d %b %Y, %I:%M %p IST")
            }
        
        # Regular trading: 09:15 to 15:30
        if 9 * 60 + 15 <= time_minutes < 15 * 60 + 30:
            return {
                "status": "OPEN",
                "is_open": True,
                "badge": "LIVE",
                "message": "NSE Live Market Session is active (Closes at 03:30 PM IST).",
                "ist_time": ist_now.strftime("%d %b %Y, %I:%M %p IST")
            }
        
        # Post-market
        return {
            "status": "CLOSED",
            "is_open": False,
            "badge": "CLOSED",
            "message": "NSE Market Closed. Normal trading sessions run Mon-Fri 09:15 - 15:30 IST.",
            "ist_time": ist_now.strftime("%d %b %Y, %I:%M %p IST")
        }

    @staticmethod
    def get_active_provider_info() -> Dict[str, Any]:
        """Returns details on the current configured data source pipeline."""
        if settings.TRUEDATA_API_KEY:
            return {
                "provider": "TrueData",
                "feed_type": "Tick-by-Tick WebSocket / REST",
                "tier": "Commercial Enterprise",
                "delay_sec": 0
            }
        elif settings.INDIAN_API_KEY:
            return {
                "provider": "IndianAPI",
                "feed_type": "Direct Indian Market REST API",
                "tier": "Dedicated Developer",
                "delay_sec": 0
            }
        elif settings.GROWW_API_TOKEN:
            return {
                "provider": "Groww API",
                "feed_type": "Broker Gateway",
                "tier": "Retail Broker Connect",
                "delay_sec": 0
            }
        else:
            return {
                "provider": "NSE Institutional Gateway (Yahoo Finance)",
                "feed_type": "Institutional Real-Time / 15m Telemetry",
                "tier": "Standard Open Feed (No subscription required)",
                "delay_sec": settings.NSE_FEED_DELAY_MINUTES * 60
            }

