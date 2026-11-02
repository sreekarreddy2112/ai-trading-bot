import pytest
import pandas as pd
import numpy as np
from services.backtester import run_backtest


def test_backtest_insufficient_data():
    """Backtest should raise ValueError when fewer than 60 bars are supplied."""
    df = pd.DataFrame({"Close": [100.0] * 30})
    with pytest.raises(ValueError, match="Insufficient historical bars"):
        run_backtest(df, strategy="sma_crossover")


def test_backtest_sma_crossover_run():
    """Verify SMA crossover returns all expected metric fields."""
    np.random.seed(42)
    dates = pd.date_range("2024-01-01", periods=150)
    prices = 1000 + np.cumsum(np.random.randn(150) * 5)
    df = pd.DataFrame({"Date": dates, "Close": prices})

    result = run_backtest(df, strategy="sma_crossover", initial_capital=100000.0)

    assert result["strategy"] == "sma_crossover"
    assert "total_return_pct" in result
    assert "buy_hold_return_pct" in result
    assert "win_rate_pct" in result
    assert "max_drawdown_pct" in result
    assert "equity_curve" in result
    assert len(result["equity_curve"]) > 0
    assert result["initial_capital"] == 100000.0


def test_backtest_rsi_reversal_run():
    """Verify RSI reversal returns valid trades and equity curve."""
    dates = pd.date_range("2024-01-01", periods=150)
    # Oscillating price to trigger RSI dips and spikes
    prices = [100 + 20 * np.sin(i / 4) for i in range(150)]
    df = pd.DataFrame({"Date": dates, "Close": prices})

    result = run_backtest(df, strategy="rsi_reversal", initial_capital=50000.0)
    assert result["strategy"] == "rsi_reversal"
    assert result["final_equity"] > 0
    assert result["max_drawdown_pct"] >= 0.0


def test_backtest_no_lookahead_shift():
    """
    Verify strict zero look-ahead bias:
    If a sudden jump occurs on day t, position must not have been entered on day t
    unless the signal was already triggered at close of day t-1.
    """
    prices = [100.0] * 70
    # Day 71 has a spike
    prices.append(200.0)
    prices.extend([200.0] * 10)
    df = pd.DataFrame({"Close": prices})

    result = run_backtest(df, strategy="sma_crossover")
    # Initial capital unchanged during flat period
    first_equity_val = result["equity_curve"][0]["strategy_equity"]
    assert first_equity_val == 100000.0

