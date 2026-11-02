import pandas as pd
import numpy as np
from typing import Dict, Any, List, Tuple


def compute_rsi(series: pd.Series, period: int = 14) -> pd.Series:
    """
    Computes Wilder's Relative Strength Index (RSI).
    Standard formulation using exponential smoothing (alpha = 1 / period).
    """
    if len(series) < period:
        return pd.Series([np.nan] * len(series), index=series.index)
    
    delta = series.diff()
    gain = delta.clip(lower=0)
    loss = -delta.clip(upper=0)
    
    # Wilder's exponential smoothing (alpha = 1 / period)
    avg_gain = gain.ewm(alpha=1.0 / period, min_periods=period, adjust=False).mean()
    avg_loss = loss.ewm(alpha=1.0 / period, min_periods=period, adjust=False).mean()
    
    # Standard Wilder RSI calculation
    # If avg_loss == 0 and avg_gain > 0 -> RSI = 100
    # If avg_gain == 0 and avg_loss == 0 -> RSI = 50
    # If avg_gain == 0 and avg_loss > 0 -> RSI = 0
    rsi = pd.Series(index=series.index, dtype=float)
    
    zero_loss = (avg_loss == 0)
    zero_gain = (avg_gain == 0)
    
    both_zero = zero_loss & zero_gain
    pure_gain = zero_loss & (~zero_gain)
    pure_loss = zero_gain & (~zero_loss)
    normal = (~zero_loss) & (~zero_gain)
    
    rsi[both_zero] = 50.0
    rsi[pure_gain] = 100.0
    rsi[pure_loss] = 0.0
    
    rs = avg_gain[normal] / avg_loss[normal]
    rsi[normal] = 100.0 - (100.0 / (1.0 + rs))
    
    return rsi.round(2)


def compute_macd(
    series: pd.Series, 
    fast: int = 12, 
    slow: int = 26, 
    signal: int = 9
) -> Tuple[pd.Series, pd.Series, pd.Series]:
    """
    Computes Moving Average Convergence Divergence (MACD).
    Returns (macd_line, signal_line, histogram).
    """
    ema_fast = series.ewm(span=fast, adjust=False).mean()
    ema_slow = series.ewm(span=slow, adjust=False).mean()
    macd_line = (ema_fast - ema_slow).round(2)
    signal_line = macd_line.ewm(span=signal, adjust=False).mean().round(2)
    hist = (macd_line - signal_line).round(2)
    return macd_line, signal_line, hist


def compute_bollinger_bands(
    series: pd.Series, 
    window: int = 20, 
    num_std: float = 2.0
) -> Tuple[pd.Series, pd.Series, pd.Series]:
    """
    Computes Bollinger Bands (Upper, Middle, Lower).
    """
    middle = series.rolling(window=window).mean().round(2)
    std = series.rolling(window=window).std()
    upper = (middle + (num_std * std)).round(2)
    lower = (middle - (num_std * std)).round(2)
    return upper, middle, lower


def compute_moving_averages(series: pd.Series) -> Dict[str, pd.Series]:
    """
    Computes SMA 20, 50, 200 and EMA 20.
    """
    return {
        "sma_20": series.rolling(window=20).mean().round(2),
        "sma_50": series.rolling(window=50).mean().round(2),
        "sma_200": series.rolling(window=200).mean().round(2),
        "ema_20": series.ewm(span=20, adjust=False).mean().round(2),
    }


def compute_support_resistance(df: pd.DataFrame, lookback: int = 60) -> Tuple[float, float]:
    """
    Finds dynamic Support and Resistance from swing highs and swing lows over recent period.
    """
    recent = df.tail(lookback)
    if len(recent) < 5:
        current = float(df['Close'].iloc[-1])
        return round(current * 0.95, 2), round(current * 1.05, 2)
    
    current_price = float(df['Close'].iloc[-1])
    
    # Identify local lows (valleys)
    lows = recent['Low']
    swing_lows = lows[(lows.shift(1) > lows) & (lows.shift(-1) > lows)]
    
    # Identify local highs (peaks)
    highs = recent['High']
    swing_highs = highs[(highs.shift(1) < highs) & (highs.shift(-1) < highs)]
    
    # Support: closest swing low below current price, or absolute recent low
    below_price = swing_lows[swing_lows < current_price]
    if not below_price.empty:
        support = float(below_price.max())
    else:
        support = float(recent['Low'].min())
        
    # Resistance: closest swing high above current price, or absolute recent high
    above_price = swing_highs[swing_highs > current_price]
    if not above_price.empty:
        resistance = float(above_price.min())
    else:
        resistance = float(recent['High'].max())
        
    # Guarantee sanity
    if support >= current_price:
        support = round(current_price * 0.96, 2)
    if resistance <= current_price:
        resistance = round(current_price * 1.04, 2)
        
    return round(support, 2), round(resistance, 2)


def generate_signal(
    current_price: float,
    rsi: float,
    macd: float,
    macd_signal: float,
    sma_20: float,
    sma_50: float,
    sma_200: float,
    bb_upper: float,
    bb_lower: float
) -> Tuple[str, List[str]]:
    """
    Deterministic rule-based technical signal classifier.
    Returns ("Bullish" | "Neutral" | "Bearish", list_of_reasons).
    """
    score = 0
    reasons: List[str] = []
    
    # 1. RSI Signals
    if rsi >= 70:
        score -= 1
        reasons.append(f"RSI ({rsi:.1f}) is in overbought territory (>70), suggesting potential near-term consolidation.")
    elif rsi <= 30:
        score += 1
        reasons.append(f"RSI ({rsi:.1f}) is oversold (<30), indicating strong potential for mean-reversion bounce.")
    elif rsi >= 55:
        score += 1
        reasons.append(f"RSI ({rsi:.1f}) shows sustained positive momentum (>55).")
    elif rsi <= 45:
        score -= 1
        reasons.append(f"RSI ({rsi:.1f}) shows weak downward momentum (<45).")
    else:
        reasons.append(f"RSI ({rsi:.1f}) is in a neutral equilibrium zone (45-55).")
        
    # 2. MACD Signals
    if macd > macd_signal:
        score += 1
        reasons.append(f"MACD line ({macd:.2f}) is above the 9-day signal line ({macd_signal:.2f}), confirming bullish momentum.")
    else:
        score -= 1
        reasons.append(f"MACD line ({macd:.2f}) is below the 9-day signal line ({macd_signal:.2f}), indicating bearish pressure.")
        
    # 3. Moving Average Trend Alignment
    if not np.isnan(sma_50) and not np.isnan(sma_200):
        if current_price > sma_50 and sma_50 > sma_200:
            score += 2
            reasons.append(f"Price (₹{current_price:,.2f}) trades above rising 50-day SMA (₹{sma_50:,.2f}) & 200-day SMA (₹{sma_200:,.2f}) — confirmed Golden Cross trend.")
        elif current_price < sma_50 and sma_50 < sma_200:
            score -= 2
            reasons.append(f"Price (₹{current_price:,.2f}) is below falling 50-day SMA (₹{sma_50:,.2f}) & 200-day SMA (₹{sma_200:,.2f}) — persistent Death Cross downtrend.")
        elif current_price > sma_50:
            score += 1
            reasons.append(f"Price is holding above intermediate 50-day moving average (₹{sma_50:,.2f}).")
        else:
            score -= 1
            reasons.append(f"Price is trading below intermediate 50-day moving average (₹{sma_50:,.2f}).")
    elif not np.isnan(sma_20):
        if current_price > sma_20:
            score += 1
            reasons.append(f"Price is trading above short-term 20-day SMA (₹{sma_20:,.2f}).")
        else:
            score -= 1
            reasons.append(f"Price is trading below short-term 20-day SMA (₹{sma_20:,.2f}).")
            
    # 4. Bollinger Bands Context
    if not np.isnan(bb_upper) and not np.isnan(bb_lower):
        if current_price >= bb_upper * 0.99:
            reasons.append(f"Price is pressing against upper Bollinger Band (₹{bb_upper:,.2f}), signaling strong upside volatility.")
        elif current_price <= bb_lower * 1.01:
            reasons.append(f"Price is testing lower Bollinger Band support (₹{bb_lower:,.2f}).")
            
    # Final classification
    if score >= 2:
        signal = "Bullish"
    elif score <= -2:
        signal = "Bearish"
    else:
        signal = "Neutral"
        
    return signal, reasons


def analyze_dataframe(df: pd.DataFrame) -> Dict[str, Any]:
    """
    Computes all indicators and returns current metrics, series, support/resistance, and signal.
    """
    if df.empty or 'Close' not in df.columns or len(df) < 5:
        raise ValueError("Insufficient price data to compute indicators")
        
    close = df['Close']
    
    rsi = compute_rsi(close)
    macd, macd_signal, macd_hist = compute_macd(close)
    bb_upper, bb_middle, bb_lower = compute_bollinger_bands(close)
    ma = compute_moving_averages(close)
    
    support, resistance = compute_support_resistance(df)
    
    # Last values
    cur_price = float(close.iloc[-1])
    cur_rsi = float(rsi.dropna().iloc[-1]) if not rsi.dropna().empty else 50.0
    cur_macd = float(macd.dropna().iloc[-1]) if not macd.dropna().empty else 0.0
    cur_macd_signal = float(macd_signal.dropna().iloc[-1]) if not macd_signal.dropna().empty else 0.0
    cur_macd_hist = float(macd_hist.dropna().iloc[-1]) if not macd_hist.dropna().empty else 0.0
    
    cur_sma_20 = float(ma['sma_20'].dropna().iloc[-1]) if not ma['sma_20'].dropna().empty else cur_price
    cur_sma_50 = float(ma['sma_50'].dropna().iloc[-1]) if not ma['sma_50'].dropna().empty else cur_price
    cur_sma_200 = float(ma['sma_200'].dropna().iloc[-1]) if not ma['sma_200'].dropna().empty else cur_price
    cur_ema_20 = float(ma['ema_20'].dropna().iloc[-1]) if not ma['ema_20'].dropna().empty else cur_price
    
    cur_bb_upper = float(bb_upper.dropna().iloc[-1]) if not bb_upper.dropna().empty else cur_price * 1.05
    cur_bb_middle = float(bb_middle.dropna().iloc[-1]) if not bb_middle.dropna().empty else cur_price
    cur_bb_lower = float(bb_lower.dropna().iloc[-1]) if not bb_lower.dropna().empty else cur_price * 0.95
    
    signal, reasons = generate_signal(
        current_price=cur_price,
        rsi=cur_rsi,
        macd=cur_macd,
        macd_signal=cur_macd_signal,
        sma_20=cur_sma_20,
        sma_50=cur_sma_50,
        sma_200=cur_sma_200,
        bb_upper=cur_bb_upper,
        bb_lower=cur_bb_lower
    )
    
    # Build timeline series for charting (last 180 points or full length)
    chart_df = pd.DataFrame({
        'Date': df['Date'] if 'Date' in df.columns else df.index.astype(str),
        'Close': close.round(2),
        'RSI': rsi,
        'MACD': macd,
        'MACD_Signal': macd_signal,
        'MACD_Hist': macd_hist,
        'SMA_20': ma['sma_20'],
        'SMA_50': ma['sma_50'],
        'SMA_200': ma['sma_200'],
        'EMA_20': ma['ema_20'],
        'BB_Upper': bb_upper,
        'BB_Middle': bb_middle,
        'BB_Lower': bb_lower,
    }).tail(250)
    
    series_points = []
    for _, row in chart_df.iterrows():
        series_points.append({
            "date": str(row['Date'])[:10],
            "close": float(row['Close']),
            "rsi": None if pd.isna(row['RSI']) else float(row['RSI']),
            "macd": None if pd.isna(row['MACD']) else float(row['MACD']),
            "macd_signal": None if pd.isna(row['MACD_Signal']) else float(row['MACD_Signal']),
            "macd_hist": None if pd.isna(row['MACD_Hist']) else float(row['MACD_Hist']),
            "sma_20": None if pd.isna(row['SMA_20']) else float(row['SMA_20']),
            "sma_50": None if pd.isna(row['SMA_50']) else float(row['SMA_50']),
            "sma_200": None if pd.isna(row['SMA_200']) else float(row['SMA_200']),
            "ema_20": None if pd.isna(row['EMA_20']) else float(row['EMA_20']),
            "bb_upper": None if pd.isna(row['BB_Upper']) else float(row['BB_Upper']),
            "bb_middle": None if pd.isna(row['BB_Middle']) else float(row['BB_Middle']),
            "bb_lower": None if pd.isna(row['BB_Lower']) else float(row['BB_Lower']),
        })
        
    return {
        "current_price": cur_price,
        "rsi_14": cur_rsi,
        "macd": cur_macd,
        "macd_signal": cur_macd_signal,
        "macd_hist": cur_macd_hist,
        "sma_20": cur_sma_20,
        "sma_50": cur_sma_50,
        "sma_200": cur_sma_200,
        "ema_20": cur_ema_20,
        "bb_upper": cur_bb_upper,
        "bb_middle": cur_bb_middle,
        "bb_lower": cur_bb_lower,
        "support_level": support,
        "resistance_level": resistance,
        "signal": signal,
        "signal_reasons": reasons,
        "series": series_points,
    }
