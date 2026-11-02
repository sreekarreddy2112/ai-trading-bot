import pandas as pd
import numpy as np
from typing import Dict, Any, List
from services.indicators import compute_rsi, compute_moving_averages


def run_backtest(
    df: pd.DataFrame,
    strategy: str = "sma_crossover",
    initial_capital: float = 100000.0
) -> Dict[str, Any]:
    """
    Backtesting engine strictly adhering to ZERO LOOK-AHEAD BIAS.
    Signals calculated on bar [t-1] close determine position held entering bar [t].
    
    Strategies supported:
    1. 'sma_crossover': 20 SMA vs 50 SMA crossover
    2. 'rsi_reversal': Buy when RSI(14) < 30, Sell when RSI(14) > 70
    """
    if len(df) < 60:
        raise ValueError("Insufficient historical bars for backtesting (minimum 60 bars required)")

    df = df.copy()
    close = df['Close']
    dates = pd.Series(df['Date'] if 'Date' in df.columns else df.index.astype(str), index=df.index)

    # 1. Compute Indicators
    if strategy == "sma_crossover":
        ma = compute_moving_averages(close)
        sma_fast = ma['sma_20']
        sma_slow = ma['sma_50']
        
        # Raw indicator signal: 1 if fast > slow, else 0
        raw_signal = (sma_fast > sma_slow).astype(int)
    elif strategy == "rsi_reversal":
        rsi = compute_rsi(close, period=14)
        raw_signal = pd.Series(0, index=df.index)
        position = 0
        for i in range(len(df)):
            current_rsi = rsi.iloc[i]
            if pd.notna(current_rsi):
                if current_rsi < 30:
                    position = 1  # Buy / Long
                elif current_rsi > 70:
                    position = 0  # Exit to cash
            raw_signal.iloc[i] = position
    else:
        raise ValueError(f"Unsupported strategy '{strategy}'. Use 'sma_crossover' or 'rsi_reversal'")

    # 2. Strict No Look-Ahead: Shift signal by 1 bar
    # Signal determined at close of day t-1 is held through day t
    held_position = raw_signal.shift(1).fillna(0)

    # 3. Simulate Daily Returns
    daily_returns = close.pct_change().fillna(0)
    strategy_returns = held_position * daily_returns
    benchmark_returns = daily_returns

    # 4. Construct Equity Curves
    strategy_equity = initial_capital * (1 + strategy_returns).cumprod()
    benchmark_equity = initial_capital * (1 + benchmark_returns).cumprod()

    # 5. Extract Trade Records
    trades: List[Dict[str, Any]] = []
    in_trade = False
    entry_date = ""
    entry_price = 0.0

    for i in range(1, len(df)):
        prev_pos = held_position.iloc[i - 1]
        cur_pos = held_position.iloc[i]
        bar_date = str(dates.iloc[i])[:10]
        bar_price = float(close.iloc[i])

        # Entry
        if prev_pos == 0 and cur_pos == 1:
            in_trade = True
            entry_date = bar_date
            entry_price = bar_price
        # Exit
        elif prev_pos == 1 and cur_pos == 0 and in_trade:
            in_trade = False
            exit_date = bar_date
            exit_price = bar_price
            ret_pct = ((exit_price - entry_price) / entry_price) * 100
            pnl = (ret_pct / 100) * initial_capital
            trades.append({
                "entry_date": entry_date,
                "entry_price": round(entry_price, 2),
                "exit_date": exit_date,
                "exit_price": round(exit_price, 2),
                "trade_type": "LONG",
                "return_pct": round(ret_pct, 2),
                "pnl": round(pnl, 2)
            })

    # If still in trade at the last bar, close it for reporting
    if in_trade:
        last_price = float(close.iloc[-1])
        ret_pct = ((last_price - entry_price) / entry_price) * 100
        pnl = (ret_pct / 100) * initial_capital
        trades.append({
            "entry_date": entry_date,
            "entry_price": round(entry_price, 2),
            "exit_date": str(dates.iloc[-1])[:10],
            "exit_price": round(last_price, 2),
            "trade_type": "LONG (OPEN)",
            "return_pct": round(ret_pct, 2),
            "pnl": round(pnl, 2)
        })

    # 6. Performance Metrics
    final_equity = float(strategy_equity.iloc[-1])
    total_return_pct = round(((final_equity - initial_capital) / initial_capital) * 100, 2)
    
    final_bench = float(benchmark_equity.iloc[-1])
    buy_hold_return_pct = round(((final_bench - initial_capital) / initial_capital) * 100, 2)

    total_trades = len(trades)
    winning_trades = sum(1 for t in trades if t["return_pct"] > 0)
    losing_trades = sum(1 for t in trades if t["return_pct"] <= 0)
    win_rate_pct = round((winning_trades / total_trades * 100), 2) if total_trades > 0 else 0.0

    # Max Drawdown Calculation
    cum_max = strategy_equity.cummax()
    drawdown = (strategy_equity - cum_max) / cum_max
    max_drawdown_pct = round(abs(float(drawdown.min())) * 100, 2)

    # Subsample equity curve for smooth frontend charting (max 150 points)
    step = max(1, len(df) // 150)
    equity_curve = []
    for i in range(0, len(df), step):
        equity_curve.append({
            "date": str(dates.iloc[i])[:10],
            "strategy_equity": round(float(strategy_equity.iloc[i]), 2),
            "benchmark_equity": round(float(benchmark_equity.iloc[i]), 2),
        })

    # Ensure last point is always included
    if equity_curve and equity_curve[-1]["date"] != str(dates.iloc[-1])[:10]:
        equity_curve.append({
            "date": str(dates.iloc[-1])[:10],
            "strategy_equity": round(float(strategy_equity.iloc[-1]), 2),
            "benchmark_equity": round(float(benchmark_equity.iloc[-1]), 2),
        })

    return {
        "strategy": strategy,
        "initial_capital": initial_capital,
        "final_equity": round(final_equity, 2),
        "total_return_pct": total_return_pct,
        "buy_hold_return_pct": buy_hold_return_pct,
        "win_rate_pct": win_rate_pct,
        "max_drawdown_pct": max_drawdown_pct,
        "total_trades": total_trades,
        "winning_trades": winning_trades,
        "losing_trades": losing_trades,
        "equity_curve": equity_curve,
        "trades": trades,
    }
