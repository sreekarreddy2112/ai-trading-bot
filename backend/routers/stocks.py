import logging
from fastapi import APIRouter, HTTPException, Query, Request
from models.schemas import StockDetailResponse, StockIndicatorsResponse, AIAnalysisResponse
from services.market_data import get_stock_data
from services.indicators import analyze_dataframe
from services.ai_analyst import get_ai_stock_analysis
from services.news_sentiment import fetch_rss_headlines

router = APIRouter(prefix="/api/stocks", tags=["Stocks"])
logger = logging.getLogger(__name__)


@router.get("/{symbol}", response_model=StockDetailResponse)
def get_stock_details(symbol: str, period: str = Query("1y", pattern="^(1mo|3mo|6mo|1y|2y|5y)$")):
    """
    Returns company info, fundamentals (PE, market cap, 52-week high/low),
    and historical OHLCV candle data.
    """
    try:
        detail, _ = get_stock_data(symbol, period=period)
        return detail
    except Exception as e:
        logger.error(f"Error fetching stock detail for {symbol}: {e}")
        raise HTTPException(status_code=404, detail=f"Stock data not found for symbol '{symbol}'")


@router.get("/{symbol}/indicators", response_model=StockIndicatorsResponse)
def get_stock_indicators(symbol: str, period: str = Query("1y")):
    """
    Computes technical metrics:
    - RSI(14)
    - MACD(12, 26, 9)
    - SMA 20, 50, 200 & EMA 20
    - Bollinger Bands (20, 2)
    - Dynamic Support and Resistance
    - Rule-based Signal (Bullish, Neutral, Bearish) with explicit reasons.
    """
    try:
        _, hist_df = get_stock_data(symbol, period=period)
        analysis = analyze_dataframe(hist_df)
        
        return StockIndicatorsResponse(
            symbol=symbol.upper(),
            **analysis
        )
    except Exception as e:
        logger.error(f"Error computing indicators for {symbol}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to compute indicators: {str(e)}")


@router.post("/{symbol}/ai-analysis", response_model=AIAnalysisResponse)
async def generate_ai_analysis(symbol: str, request: Request):
    """
    Generates structured AI analysis using Claude API (or deterministic fallback).
    Enforces Pydantic schema validation, 30-min cache, and hourly rate limits.
    """
    try:
        # Determine client identifier for rate limiting
        client_ip = request.client.host if request.client else "default_client"

        # 1. Fetch current price and historical data
        detail, hist_df = get_stock_data(symbol, period="1y")
        
        # 2. Compute technical indicators
        indicators = analyze_dataframe(hist_df)
        
        # 3. Fetch latest headlines for context
        articles = await fetch_rss_headlines(f"{symbol} NSE stock", limit=5)
        headlines = [a["title"] for a in articles]

        # 4. Generate AI analysis
        analysis = await get_ai_stock_analysis(
            symbol=symbol,
            last_close=detail.current_price,
            change_pct=detail.change_percent,
            indicators=indicators,
            headlines=headlines,
            client_id=client_ip
        )
        return analysis

    except ValueError as val_err:
        raise HTTPException(status_code=429, detail=str(val_err))
    except Exception as e:
        logger.error(f"AI analysis generation failed for {symbol}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to generate AI stock analysis")
