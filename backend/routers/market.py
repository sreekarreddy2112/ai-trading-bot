import logging
from typing import List, Dict, Any
from fastapi import APIRouter, HTTPException
from models.schemas import MarketOverviewResponse, Nifty50Stock
from services.market_data import get_market_overview, get_nifty50_trade_list
from services.api_providers import MarketDataProvider

router = APIRouter(prefix="/api/market", tags=["Market"])
logger = logging.getLogger(__name__)


@router.get("/overview", response_model=MarketOverviewResponse)
def fetch_market_overview():
    """
    Returns benchmark indices (Nifty 50, Sensex, Bank Nifty),
    Top 5 Gainers, Top 5 Losers, Sector Performance, and Live Market Status.
    Cached for 5 minutes.
    """
    try:
        return get_market_overview()
    except Exception as e:
        logger.error(f"Error fetching market overview: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve market overview data")


@router.get("/nifty50", response_model=List[Nifty50Stock])
def fetch_nifty50_constituents():
    """
    Returns live constituent quotes for all core Nifty 50 companies,
    including sector, day high/low, 52-week range, volume, and turnover in ₹ Crores.
    """
    try:
        return get_nifty50_trade_list()
    except Exception as e:
        logger.error(f"Error fetching Nifty 50 trade list: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve Nifty 50 constituents")


@router.get("/status", response_model=Dict[str, Any])
def fetch_market_status():
    """
    Returns live IST NSE session status (Open/Closed/Pre-Open)
    and details about the active market data provider pipeline.
    """
    try:
        status_info = MarketDataProvider.get_market_status()
        provider_info = MarketDataProvider.get_active_provider_info()
        return {
            "market": status_info,
            "provider": provider_info
        }
    except Exception as e:
        logger.error(f"Error fetching market status: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve market status")
