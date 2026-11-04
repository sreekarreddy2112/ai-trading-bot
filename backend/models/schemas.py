from typing import List, Optional, Literal
from pydantic import BaseModel, Field

# ----------------- Market Overview -----------------

class IndexCard(BaseModel):
    symbol: str
    name: str
    current_price: float
    change: float
    change_percent: float
    sparkline: List[float] = []

class StockMover(BaseModel):
    symbol: str
    name: str
    price: float
    change: float
    change_percent: float

class SectorPerformance(BaseModel):
    sector: str
    change_percent: float

class Nifty50Stock(BaseModel):
    symbol: str
    name: str
    sector: str
    price: float
    change: float
    change_percent: float
    day_high: float
    day_low: float
    week_52_high: float
    week_52_low: float
    volume: int
    value_cr: float
    sparkline: List[float] = []

class MarketOverviewResponse(BaseModel):
    indices: List[IndexCard]
    top_gainers: List[StockMover]
    top_losers: List[StockMover]
    sectors: List[SectorPerformance]
    nifty50_preview: List[Nifty50Stock] = []
    market_status: str = "CLOSED" # OPEN, CLOSED, PRE-OPEN
    market_status_message: str = "NSE Market Closed (Trading: Mon-Fri 09:15 - 15:30 IST)"
    last_updated: str
    data_notice: str = "Data delayed 15 minutes - Educational & Informational Use Only"

# ----------------- Stock Details & History -----------------

class CandlePoint(BaseModel):
    date: str
    open: float
    high: float
    low: float
    close: float
    volume: int

class QuarterlyFinancial(BaseModel):
    quarter: str
    revenue_cr: float
    net_profit_cr: float
    operating_margin_pct: Optional[float] = None

class StockFundamentals(BaseModel):
    market_cap: Optional[float] = None
    market_cap_cr: Optional[float] = None
    pe_ratio: Optional[float] = None
    industry_pe: Optional[float] = None
    pb_ratio: Optional[float] = None
    high_52w: Optional[float] = None
    low_52w: Optional[float] = None
    volume: Optional[int] = None
    avg_volume: Optional[int] = None
    dividend_yield: Optional[float] = None
    eps_ttm: Optional[float] = None
    roe_pct: Optional[float] = None
    roce_pct: Optional[float] = None
    debt_to_equity: Optional[float] = None
    total_revenue_cr: Optional[float] = None
    net_profit_cr: Optional[float] = None
    profit_margin_pct: Optional[float] = None
    operating_margin_pct: Optional[float] = None
    free_cash_flow_cr: Optional[float] = None
    promoter_holding_pct: Optional[float] = None
    quarterly_financials: List[QuarterlyFinancial] = []

class StockDetailResponse(BaseModel):
    symbol: str
    company_name: str
    current_price: float
    change: float
    change_percent: float
    currency: str = "INR"
    exchange: str = "NSE"
    fundamentals: StockFundamentals
    history: List[CandlePoint]
    last_updated: str

# ----------------- Technical Indicators -----------------

class IndicatorSeriesPoint(BaseModel):
    date: str
    close: float
    rsi: Optional[float] = None
    macd: Optional[float] = None
    macd_signal: Optional[float] = None
    macd_hist: Optional[float] = None
    sma_20: Optional[float] = None
    sma_50: Optional[float] = None
    sma_200: Optional[float] = None
    ema_20: Optional[float] = None
    bb_upper: Optional[float] = None
    bb_middle: Optional[float] = None
    bb_lower: Optional[float] = None

class StockIndicatorsResponse(BaseModel):
    symbol: str
    current_price: float
    rsi_14: float
    macd: float
    macd_signal: float
    macd_hist: float
    sma_20: float
    sma_50: float
    sma_200: float
    ema_20: float
    bb_upper: float
    bb_middle: float
    bb_lower: float
    support_level: float
    resistance_level: float
    signal: Literal["Bullish", "Neutral", "Bearish"]
    signal_reasons: List[str]
    series: List[IndicatorSeriesPoint]

# ----------------- Claude AI Analysis -----------------

class AIAnalysisStructuredOutput(BaseModel):
    summary: str = Field(description="2-3 concise sentences summarizing key technical and momentum state")
    trend: Literal["uptrend", "downtrend", "sideways"]
    key_points: List[str] = Field(description="3-4 bullet observations based on provided metrics")
    risks: List[str] = Field(description="Primary downside or volatility risks to note")
    watch_next: List[str] = Field(description="Key price levels, indicator thresholds, or catalysts to monitor")
    confidence: Literal["low", "medium", "high"]

class AIAnalysisResponse(AIAnalysisStructuredOutput):
    symbol: str
    last_close: float
    change_percent: float
    disclaimer: str
    generated_at: str
    cached: bool = False

# ----------------- News & Sentiment -----------------

class NewsItem(BaseModel):
    headline_hash: str
    title: str
    link: str
    publisher: str
    published_date: str
    sentiment: Literal["Positive", "Neutral", "Negative"]
    score: float = Field(ge=-1.0, le=1.0)

class NewsSentimentResponse(BaseModel):
    symbol: Optional[str] = None
    overall_sentiment: Literal["Positive", "Neutral", "Negative"]
    average_score: float
    articles: List[NewsItem]
    total_articles: int

# ----------------- Strategy Backtester -----------------

class BacktestRequest(BaseModel):
    symbol: str
    strategy: Literal["sma_crossover", "rsi_reversal"] = "sma_crossover"
    timeframe_years: int = Field(default=2, ge=1, le=5)
    initial_capital: float = Field(default=100000.0, gt=0)

class EquityPoint(BaseModel):
    date: str
    strategy_equity: float
    benchmark_equity: float

class TradeRecord(BaseModel):
    entry_date: str
    entry_price: float
    exit_date: str
    exit_price: float
    trade_type: str
    return_pct: float
    pnl: float

class BacktestResponse(BaseModel):
    symbol: str
    strategy: str
    timeframe_years: int
    initial_capital: float
    final_equity: float
    total_return_pct: float
    buy_hold_return_pct: float
    win_rate_pct: float
    max_drawdown_pct: float
    total_trades: int
    winning_trades: int
    losing_trades: int
    equity_curve: List[EquityPoint]
    trades: List[TradeRecord]
    disclaimer: str = (
        "Past performance is not a guarantee of future returns. Backtest simulates historical "
        "signals with strictly no look-ahead bias, excluding slippage and brokerage charges."
    )

# ----------------- Watchlist -----------------

class WatchlistAddRequest(BaseModel):
    symbol: str
    user_id: Optional[str] = "guest"

class WatchlistItem(BaseModel):
    id: str
    symbol: str
    company_name: str
    sector: Optional[str] = "Diversified"
    current_price: float
    change: float
    change_percent: float
    signal: str
    trend: Optional[str] = "Uptrend" # Strong Uptrend, Bullish Consolidation, Pullback, Downtrend
    day_high: Optional[float] = None
    day_low: Optional[float] = None
    week_52_high: Optional[float] = None
    week_52_low: Optional[float] = None
    volume: Optional[int] = None
    sparkline: List[float] = []
    ai_brief: str
    added_at: str

# ----------------- Price Alerts (Limit & Volatility) -----------------

class CreateAlertRequest(BaseModel):
    symbol: str
    alert_type: Literal["ABOVE_LIMIT", "BELOW_LIMIT", "PCT_GAIN", "PCT_DROP"]
    target_value: float = Field(gt=0, description="Target limit price or percentage threshold")
    note: Optional[str] = None

class AlertItem(BaseModel):
    id: str
    user_id: str
    symbol: str
    company_name: str
    alert_type: Literal["ABOVE_LIMIT", "BELOW_LIMIT", "PCT_GAIN", "PCT_DROP"]
    target_value: float
    initial_price: float
    current_price: float
    distance_percent: float
    distance_amount: float
    status: Literal["ACTIVE", "TRIGGERED", "CANCELLED"]
    triggered_at: Optional[str] = None
    note: Optional[str] = None
    created_at: str

class AlertListResponse(BaseModel):
    alerts: List[AlertItem]
    active_count: int
    triggered_count: int
    last_evaluated: str

# ----------------- Indian IPO Tracker -----------------

class IPOSubscription(BaseModel):
    qib: float = 0.0
    nii: float = 0.0
    retail: float = 0.0
    total: float = 0.0

class IPOItem(BaseModel):
    id: str
    company_name: str
    symbol: str
    sector: str
    price_band: str
    min_price: float
    max_price: float
    issue_size: str
    issue_type: str
    lot_size: int
    min_investment: float
    open_date: str
    close_date: str
    listing_date: str
    status: Literal["Open", "Upcoming", "Closed", "Listed"]
    gmp: float
    gmp_percent: float
    subscription: IPOSubscription
    listing_price: Optional[float] = None
    listing_gain_pct: Optional[float] = None
    overview: str

class IPOListResponse(BaseModel):
    ipos: List[IPOItem]
    total: int
    last_updated: str
    data_notice: str = "IPO GMP & subscriptions are estimated for informational & educational purposes only."

class IPOAIVerdict(BaseModel):
    ipo_id: str
    company_name: str
    verdict: Literal["Apply for Listing Gains", "Apply for Long Term", "Neutral / Watch", "Avoid"]
    confidence: Literal["low", "medium", "high"]
    valuation_assessment: str
    strengths: List[str]
    risks: List[str]
    verdict_summary: str
    generated_at: str
    disclaimer: str


# ----------------- User Authentication (Email, Username, Phone & Password) -----------------

class UserRegisterRequest(BaseModel):
    email: str
    username: str
    phone: str
    password: str

class UserLoginRequest(BaseModel):
    identifier: str  # email, username, or phone
    password: str

class UserProfileResponse(BaseModel):
    id: str
    email: str
    username: str
    phone: str
    name: str

class AuthTokenResponse(BaseModel):
    status: str
    message: str
    token: str
    user: UserProfileResponse

# Backward-compatibility schemas
class SendOTPRequest(BaseModel):
    email: str

class SendOTPResponse(BaseModel):
    status: str
    message: str
    email: str
    expires_in_seconds: int = 600

class VerifyOTPRequest(BaseModel):
    email: str
    otp: str

class AuthUserResponse(BaseModel):
    id: str
    email: str
    name: str
    verified: bool

class VerifyOTPResponse(BaseModel):
    status: str
    message: str
    token: str
    user: AuthUserResponse



