import logging
from fastapi import APIRouter, HTTPException
from models.schemas import BacktestRequest, BacktestResponse
from services.market_data import get_stock_data
from services.backtester import run_backtest

router = APIRouter(prefix="/api/backtest", tags=["Backtest"])
logger = logging.getLogger(__name__)


@router.post("", response_model=BacktestResponse)
def execute_backtest(req: BacktestRequest):
    """
    Executes historical quantitative backtest on Indian equities.
    Guarantees strictly ZERO LOOK-AHEAD BIAS.
    Supports:
    - SMA Crossover (20 SMA vs 50 SMA)
    - RSI Mean Reversion (Buy < 30, Sell > 70)
    """
    try:
        # Map timeframe to yfinance period
        period_map = {1: "1y", 2: "2y", 3: "3y", 4: "4y", 5: "5y"}
        period_str = period_map.get(req.timeframe_years, "2y")

        # Fetch historical data
        _, hist_df = get_stock_data(req.symbol, period=period_str)

        if len(hist_df) < 60:
            raise HTTPException(
                status_code=400,
                detail=f"Insufficient historical data for {req.symbol} in the requested timeframe"
            )

        result = run_backtest(
            df=hist_df,
            strategy=req.strategy,
            initial_capital=req.initial_capital
        )

        return BacktestResponse(
            symbol=req.symbol.upper(),
            timeframe_years=req.timeframe_years,
            **result
        )

    except HTTPException:
        raise
    except ValueError as val_err:
        raise HTTPException(status_code=400, detail=str(val_err))
    except Exception as e:
        logger.error(f"Backtesting execution failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to run backtest simulation")

