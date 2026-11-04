export interface IndexCard {
  symbol: string;
  name: string;
  current_price: number;
  change: number;
  change_percent: number;
  sparkline: number[];
}

export interface StockMover {
  symbol: string;
  name: string;
  price: number;
  change: number;
  change_percent: number;
}

export interface SectorPerformance {
  sector: string;
  change_percent: number;
}

export interface Nifty50Stock {
  symbol: string;
  name: string;
  sector: string;
  price: number;
  change: number;
  change_percent: number;
  day_high: number;
  day_low: number;
  week_52_high: number;
  week_52_low: number;
  volume: number;
  value_cr: number;
  sparkline: number[];
}

export interface MarketOverviewResponse {
  indices: IndexCard[];
  top_gainers: StockMover[];
  top_losers: StockMover[];
  sectors: SectorPerformance[];
  nifty50_preview?: Nifty50Stock[];
  market_status?: "OPEN" | "CLOSED" | "PRE-OPEN";
  market_status_message?: string;
  last_updated: string;
  data_notice: string;
}

export interface CandlePoint {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface QuarterlyFinancial {
  quarter: string;
  revenue_cr: number;
  net_profit_cr: number;
  operating_margin_pct?: number | null;
}

export interface StockFundamentals {
  market_cap?: number | null;
  market_cap_cr?: number | null;
  pe_ratio?: number | null;
  industry_pe?: number | null;
  pb_ratio?: number | null;
  high_52w?: number | null;
  low_52w?: number | null;
  volume?: number | null;
  avg_volume?: number | null;
  dividend_yield?: number | null;
  eps_ttm?: number | null;
  roe_pct?: number | null;
  roce_pct?: number | null;
  debt_to_equity?: number | null;
  total_revenue_cr?: number | null;
  net_profit_cr?: number | null;
  profit_margin_pct?: number | null;
  operating_margin_pct?: number | null;
  free_cash_flow_cr?: number | null;
  promoter_holding_pct?: number | null;
  quarterly_financials?: QuarterlyFinancial[];
}

export interface StockDetailResponse {
  symbol: string;
  company_name: string;
  current_price: number;
  change: number;
  change_percent: number;
  currency: string;
  exchange: string;
  fundamentals: StockFundamentals;
  history: CandlePoint[];
  last_updated: string;
}

export interface IndicatorSeriesPoint {
  date: string;
  close: number;
  rsi?: number | null;
  macd?: number | null;
  macd_signal?: number | null;
  macd_hist?: number | null;
  sma_20?: number | null;
  sma_50?: number | null;
  sma_200?: number | null;
  ema_20?: number | null;
  bb_upper?: number | null;
  bb_middle?: number | null;
  bb_lower?: number | null;
}

export interface StockIndicatorsResponse {
  symbol: string;
  current_price: number;
  rsi_14: number;
  macd: number;
  macd_signal: number;
  macd_hist: number;
  sma_20: number;
  sma_50: number;
  sma_200: number;
  ema_20: number;
  bb_upper: number;
  bb_middle: number;
  bb_lower: number;
  support_level: number;
  resistance_level: number;
  signal: "Bullish" | "Neutral" | "Bearish";
  signal_reasons: string[];
  series: IndicatorSeriesPoint[];
}

export interface AIAnalysisResponse {
  symbol: string;
  last_close: number;
  change_percent: number;
  summary: string;
  trend: "uptrend" | "downtrend" | "sideways";
  key_points: string[];
  risks: string[];
  watch_next: string[];
  confidence: "low" | "medium" | "high";
  disclaimer: string;
  generated_at: string;
  cached?: boolean;
}

export interface NewsItem {
  headline_hash: string;
  title: string;
  link: string;
  publisher: string;
  published_date: string;
  sentiment: "Positive" | "Neutral" | "Negative";
  score: number;
}

export interface NewsSentimentResponse {
  symbol?: string | null;
  overall_sentiment: "Positive" | "Neutral" | "Negative";
  average_score: number;
  articles: NewsItem[];
  total_articles: number;
}

export interface EquityPoint {
  date: string;
  strategy_equity: number;
  benchmark_equity: number;
}

export interface TradeRecord {
  entry_date: string;
  entry_price: number;
  exit_date: string;
  exit_price: number;
  trade_type: string;
  return_pct: number;
  pnl: number;
}

export interface BacktestResponse {
  symbol: string;
  strategy: string;
  timeframe_years: number;
  initial_capital: number;
  final_equity: number;
  total_return_pct: number;
  buy_hold_return_pct: number;
  win_rate_pct: number;
  max_drawdown_pct: number;
  total_trades: number;
  winning_trades: number;
  losing_trades: number;
  equity_curve: EquityPoint[];
  trades: TradeRecord[];
  disclaimer: string;
}

export interface WatchlistItem {
  id: string;
  symbol: string;
  company_name: string;
  sector?: string;
  current_price: number;
  change: number;
  change_percent: number;
  signal: string;
  trend?: string;
  day_high?: number | null;
  day_low?: number | null;
  week_52_high?: number | null;
  week_52_low?: number | null;
  volume?: number | null;
  sparkline?: number[];
  ai_brief: string;
  added_at: string;
}

export interface WatchlistTrendsResponse {
  total_watched: number;
  bullish_pct: number;
  bearish_pct: number;
  neutral_pct: number;
  top_performer?: {
    symbol: string;
    name: string;
    change_percent: number;
    price: number;
  } | null;
  average_change_percent: number;
  market_posture: string;
}

export interface CreateAlertRequest {
  symbol: string;
  alert_type: "ABOVE_LIMIT" | "BELOW_LIMIT" | "PCT_GAIN" | "PCT_DROP";
  target_value: number;
  note?: string;
}

export interface AlertItem {
  id: string;
  user_id: string;
  symbol: string;
  company_name: string;
  alert_type: "ABOVE_LIMIT" | "BELOW_LIMIT" | "PCT_GAIN" | "PCT_DROP";
  target_value: number;
  initial_price: number;
  current_price: number;
  distance_percent: number;
  distance_amount: number;
  status: "ACTIVE" | "TRIGGERED" | "CANCELLED";
  triggered_at?: string | null;
  note?: string | null;
  created_at: string;
}

export interface AlertListResponse {
  alerts: AlertItem[];
  active_count: number;
  triggered_count: number;
  last_evaluated: string;
}

export interface IPOSubscription {
  qib: number;
  nii: number;
  retail: number;
  total: number;
}

export interface IPOItem {
  id: string;
  company_name: string;
  symbol: string;
  sector: string;
  price_band: string;
  min_price: number;
  max_price: number;
  issue_size: string;
  issue_type: string;
  lot_size: number;
  min_investment: number;
  open_date: string;
  close_date: string;
  listing_date: string;
  status: "Open" | "Upcoming" | "Closed" | "Listed";
  gmp: number;
  gmp_percent: number;
  subscription: IPOSubscription;
  listing_price?: number | null;
  listing_gain_pct?: number | null;
  overview: string;
}

export interface IPOListResponse {
  ipos: IPOItem[];
  total: number;
  last_updated: string;
  data_notice: string;
}

export interface IPOAIVerdict {
  ipo_id: string;
  company_name: string;
  verdict: "Apply for Listing Gains" | "Apply for Long Term" | "Neutral / Watch" | "Avoid";
  confidence: "low" | "medium" | "high";
  valuation_assessment: string;
  strengths: string[];
  risks: string[];
  verdict_summary: string;
  generated_at: string;
  disclaimer: string;
}

export interface UserRegisterRequest {
  email: string;
  username: string;
  phone: string;
  password: string;
}

export interface UserLoginRequest {
  identifier: string; // email, username, or phone
  password: string;
}

export interface AuthUserProfile {
  id: string;
  email: string;
  username: string;
  phone: string;
  name: string;
}

export interface AuthSuccessResponse {
  status: string;
  message: string;
  token: string;
  user: AuthUserProfile;
}

