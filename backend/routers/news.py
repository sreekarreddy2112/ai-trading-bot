import logging
from typing import Optional
from fastapi import APIRouter, HTTPException, Query
from models.schemas import NewsSentimentResponse
from services.news_sentiment import analyze_news_sentiment

router = APIRouter(prefix="/api/news", tags=["News"])
logger = logging.getLogger(__name__)


@router.get("", response_model=NewsSentimentResponse)
async def get_market_or_stock_news(symbol: Optional[str] = Query(None, description="NSE stock ticker (e.g. RELIANCE)")):
    """
    Fetches real-time headlines with sentiment classification (Positive / Neutral / Negative).
    Sentiment outputs are cached per headline hash.
    """
    try:
        clean_symbol = symbol.strip().upper() if symbol else None
        return await analyze_news_sentiment(clean_symbol)
    except Exception as e:
        logger.error(f"Error fetching news for symbol {symbol}: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch and analyze news sentiment")

