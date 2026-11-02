import json
import time
import logging
from typing import Dict, Any, List, Optional
from config import settings
from models.schemas import AIAnalysisStructuredOutput, AIAnalysisResponse

logger = logging.getLogger(__name__)

# In-memory analysis cache (30-minute TTL per symbol)
_ai_cache: Dict[str, Dict[str, Any]] = {}
_ai_cache_time: Dict[str, float] = {}

# Simple in-memory rate limiter: dict of ip/client -> list of timestamps
_rate_limiter: Dict[str, List[float]] = {}


def check_rate_limit(client_id: str) -> bool:
    """Enforces 10 requests per client per hour."""
    now = time.time()
    hour_ago = now - 3600
    timestamps = [t for t in _rate_limiter.get(client_id, []) if t > hour_ago]
    if len(timestamps) >= settings.AI_RATE_LIMIT_PER_HOUR:
        return False
    timestamps.append(now)
    _rate_limiter[client_id] = timestamps
    return True


def generate_fallback_synthesis(
    symbol: str,
    last_close: float,
    change_pct: float,
    indicators: Dict[str, Any],
    headlines: List[str]
) -> AIAnalysisStructuredOutput:
    """
    Algorithmic synthesis engine providing accurate, grounded technical analysis
    when the Anthropic API key is not configured or in testing mode.
    Guarantees strict compliance with the Pydantic schema and never invents prices.
    """
    rsi = indicators.get("rsi_14", 50.0)
    signal = indicators.get("signal", "Neutral")
    sma_50 = indicators.get("sma_50", last_close)
    sma_200 = indicators.get("sma_200", last_close)
    support = indicators.get("support_level", last_close * 0.95)
    resistance = indicators.get("resistance_level", last_close * 1.05)
    macd = indicators.get("macd", 0.0)
    macd_signal = indicators.get("macd_signal", 0.0)

    # Determine trend
    if last_close > sma_50 and sma_50 >= sma_200:
        trend = "uptrend"
    elif last_close < sma_50 and sma_50 <= sma_200:
        trend = "downtrend"
    else:
        trend = "sideways"

    # Confidence calculation
    if (signal == "Bullish" and trend == "uptrend") or (signal == "Bearish" and trend == "downtrend"):
        confidence = "high"
    elif signal != "Neutral":
        confidence = "medium"
    else:
        confidence = "low"

    summary = (
        f"{symbol} is currently trading at ₹{last_close:,.2f} ({'+' if change_pct >= 0 else ''}{change_pct:.2f}%), "
        f"exhibiting an overall {trend} structure based on multi-timeframe moving averages. "
        f"The technical setup currently presents a {signal.lower()} posture with the 14-day RSI standing at {rsi:.1f}."
    )

    key_points = [
        f"Price trades at ₹{last_close:,.2f}, positioned {'above' if last_close > sma_50 else 'below'} the 50-day SMA (₹{sma_50:,.2f}).",
        f"Momentum indicator RSI(14) registers at {rsi:.1f}, reflecting {'balanced equilibrium' if 45 <= rsi <= 55 else ('positive momentum' if rsi > 55 else 'bearish pressure')}.",
        f"MACD line ({macd:.2f}) is {'above' if macd > macd_signal else 'below'} its 9-day signal line ({macd_signal:.2f}).",
        f"Calculated immediate dynamic support rests at ₹{support:,.2f} with resistance capped at ₹{resistance:,.2f}."
    ]

    risks = [
        f"A confirmed break below technical support at ₹{support:,.2f} could accelerate selling pressure toward lower swing targets.",
        "Broader market volatility in the benchmark Nifty 50 could amplify sector-wide drawdowns regardless of stock fundamentals.",
        f"{'Overbought exhaustion risks if momentum decelerates' if rsi > 65 else 'Subdued volume participation could prolong consolidation'}."
    ]

    watch_next = [
        f"Monitor price reaction near resistance at ₹{resistance:,.2f} for potential breakout confirmation.",
        f"Watch dynamic support at ₹{support:,.2f} as a critical line of defence for buyers.",
        "Track upcoming quarterly corporate earnings, institutional FII/DII flow prints, and sector developments."
    ]

    return AIAnalysisStructuredOutput(
        summary=summary,
        trend=trend,
        key_points=key_points,
        risks=risks,
        watch_next=watch_next,
        confidence=confidence
    )


async def get_ai_stock_analysis(
    symbol: str,
    last_close: float,
    change_pct: float,
    indicators: Dict[str, Any],
    headlines: List[str],
    client_id: str = "default_user"
) -> AIAnalysisResponse:
    """
    Executes AI analysis using Anthropic Claude (claude-3-5-sonnet/claude-sonnet-5-5).
    Includes 30-minute caching, rate-limiting, JSON validation, and deterministic fallback.
    """
    clean_sym = symbol.strip().upper().replace(".NS", "")
    now = time.time()

    # Check cache
    if clean_sym in _ai_cache and (now - _ai_cache_time.get(clean_sym, 0) < settings.AI_ANALYSIS_CACHE_SECONDS):
        cached_data = _ai_cache[clean_sym]
        return AIAnalysisResponse(
            **cached_data,
            cached=True
        )

    # Check rate limit
    if not check_rate_limit(client_id):
        raise ValueError("Hourly AI analysis limit reached (10 requests/hr). Please try again later.")

    structured_output: Optional[AIAnalysisStructuredOutput] = None

    # Call Claude if API Key is configured
    if settings.ANTHROPIC_API_KEY:
        try:
            from anthropic import Anthropic
            client = Anthropic(api_key=settings.ANTHROPIC_API_KEY)

            system_prompt = (
                "You are a market analysis assistant for Indian equities. "
                "Use ONLY the data provided. Never invent numbers. Never say buy or sell. "
                "Explain in simple English. Return only JSON in the schema below:\n"
                "{\n"
                '  "summary": "2-3 sentences",\n'
                '  "trend": "uptrend | downtrend | sideways",\n'
                '  "key_points": ["..."],\n'
                '  "risks": ["..."],\n'
                '  "watch_next": ["..."],\n'
                '  "confidence": "low | medium | high"\n'
                "}"
            )

            user_input = {
                "symbol": clean_sym,
                "last_close": last_close,
                "change_percent": change_pct,
                "rsi_14": indicators.get("rsi_14"),
                "macd": indicators.get("macd"),
                "macd_signal": indicators.get("macd_signal"),
                "sma_20": indicators.get("sma_20"),
                "sma_50": indicators.get("sma_50"),
                "sma_200": indicators.get("sma_200"),
                "support_level": indicators.get("support_level"),
                "resistance_level": indicators.get("resistance_level"),
                "signal": indicators.get("signal"),
                "signal_reasons": indicators.get("signal_reasons"),
                "recent_headlines": headlines[:5]
            }

            for attempt in range(2):  # Retry once on format failure
                try:
                    response = client.messages.create(
                        model="claude-3-5-sonnet-20241022",
                        max_tokens=1000,
                        temperature=0.2,
                        system=system_prompt,
                        messages=[{"role": "user", "content": json.dumps(user_input, indent=2)}]
                    )
                    raw_text = response.content[0].text.strip()
                    if raw_text.startswith("```"):
                        raw_text = raw_text.split("```")[1]
                        if raw_text.startswith("json"):
                            raw_text = raw_text[4:]
                        raw_text = raw_text.strip()

                    parsed_json = json.loads(raw_text)
                    structured_output = AIAnalysisStructuredOutput(**parsed_json)
                    break
                except Exception as inner_err:
                    logger.warning(f"Claude JSON parsing attempt {attempt + 1} failed: {inner_err}")
                    if attempt == 1:
                        structured_output = None
        except Exception as e:
            logger.error(f"Anthropic API execution error: {e}")
            structured_output = None

    # Use algorithmic fallback if Claude is unavailable or API key not present
    if structured_output is None:
        structured_output = generate_fallback_synthesis(
            symbol=clean_sym,
            last_close=last_close,
            change_pct=change_pct,
            indicators=indicators,
            headlines=headlines
        )

    # Append compliance disclaimer in code (not in model prompt)
    response_payload = {
        **structured_output.model_dump(),
        "symbol": clean_sym,
        "last_close": last_close,
        "change_percent": change_pct,
        "disclaimer": settings.SEBI_DISCLAIMER,
        "generated_at": time.strftime("%Y-%m-%d %H:%M:%S IST"),
    }

    # Cache result
    _ai_cache[clean_sym] = response_payload
    _ai_cache_time[clean_sym] = now

    return AIAnalysisResponse(**response_payload, cached=False)

