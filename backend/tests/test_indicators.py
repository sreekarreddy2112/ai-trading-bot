import pytest
import pandas as pd
import numpy as np
from services.indicators import (
    compute_rsi,
    compute_macd,
    compute_bollinger_bands,
    compute_moving_averages,
    compute_support_resistance,
    generate_signal,
    analyze_dataframe,
)


def test_rsi_constant_prices():
    """Constant prices have zero delta, RSI defaults to 50."""
    prices = pd.Series([100.0] * 30)
    rsi = compute_rsi(prices, period=14)
    # The last RSI value should be 50.0 (neutral)
    assert rsi.iloc[-1] == 50.0


def test_rsi_strictly_increasing():
    """Monotonically increasing prices have zero losses, RSI should be 100."""
    prices = pd.Series([100.0 + i for i in range(30)])
    rsi = compute_rsi(prices, period=14)
    assert rsi.iloc[-1] == 100.0


def test_rsi_strictly_decreasing():
    """Monotonically decreasing prices have zero gains, RSI should be 0."""
    prices = pd.Series([200.0 - i for i in range(30)])
    rsi = compute_rsi(prices, period=14)
    assert rsi.iloc[-1] == 0.0


def test_rsi_bounds():
    """RSI must always stay within [0, 100]."""
    np.random.seed(42)
    random_prices = pd.Series(np.cumsum(np.random.randn(100)) + 500)
    rsi = compute_rsi(random_prices, period=14)
    valid_rsi = rsi.dropna()
    assert (valid_rsi >= 0.0).all()
    assert (valid_rsi <= 100.0).all()


def test_macd_calculation():
    """Verify MACD relationship: hist = macd_line - signal_line."""
    prices = pd.Series([100.0 + (i % 7) * 2 for i in range(50)])
    macd, signal, hist = compute_macd(prices, fast=12, slow=26, signal=9)
    # Validate formula: hist == macd - signal
    diff = (macd - signal).round(2)
    assert np.allclose(hist.iloc[-10:], diff.iloc[-10:], atol=0.01)


def test_bollinger_bands():
    """Bollinger Bands upper > middle > lower for non-zero variance."""
    prices = pd.Series([100.0, 102.0, 98.0, 105.0, 99.0] * 6)
    upper, middle, lower = compute_bollinger_bands(prices, window=20, num_std=2.0)
    
    assert upper.iloc[-1] > middle.iloc[-1]
    assert middle.iloc[-1] > lower.iloc[-1]
    # Middle band should equal 20-period simple rolling mean
    expected_mid = prices.tail(20).mean().round(2)
    assert middle.iloc[-1] == expected_mid


def test_moving_averages():
    """Verify SMA calculation matches arithmetic mean."""
    prices = pd.Series(range(1, 201), dtype=float)
    ma = compute_moving_averages(prices)
    
    # Last 20 values mean
    assert ma['sma_20'].iloc[-1] == prices.tail(20).mean().round(2)
    # Last 50 values mean
    assert ma['sma_50'].iloc[-1] == prices.tail(50).mean().round(2)
    # Last 200 values mean
    assert ma['sma_200'].iloc[-1] == prices.tail(200).mean().round(2)


def test_signal_generation():
    """Verify Bullish and Bearish classifications based on indicators."""
    bull_signal, bull_reasons = generate_signal(
        current_price=2500.0,
        rsi=62.0,
        macd=15.0,
        macd_signal=10.0,
        sma_20=2450.0,
        sma_50=2400.0,
        sma_200=2200.0,
        bb_upper=2550.0,
        bb_lower=2350.0
    )
    assert bull_signal == "Bullish"
    assert len(bull_reasons) > 0
    
    bear_signal, bear_reasons = generate_signal(
        current_price=1800.0,
        rsi=40.0,
        macd=-12.0,
        macd_signal=-5.0,
        sma_20=1850.0,
        sma_50=1900.0,
        sma_200=2100.0,
        bb_upper=2000.0,
        bb_lower=1750.0
    )
    assert bear_signal == "Bearish"
    assert len(bear_reasons) > 0


def test_support_resistance_sanity():
    """Support must be below or equal to price, resistance above or equal."""
    dates = pd.date_range("2026-01-01", periods=60)
    prices = [2000 + 50 * np.sin(i / 5) for i in range(60)]
    df = pd.DataFrame({
        "Date": dates,
        "High": [p + 15 for p in prices],
        "Low": [p - 15 for p in prices],
        "Close": prices
    })
    support, resistance = compute_support_resistance(df)
    cur_price = prices[-1]
    assert support < cur_price
    assert resistance > cur_price

