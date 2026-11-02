import pytest
from services.market_data import get_market_overview, get_nifty50_trade_list, get_stock_data
from services.alerts_service import create_price_alert, get_user_alerts, delete_price_alert, reset_price_alert, evaluate_alert
from services.api_providers import MarketDataProvider
from models.schemas import CreateAlertRequest

def test_market_status():
    status = MarketDataProvider.get_market_status()
    assert "status" in status
    assert status["status"] in ["OPEN", "CLOSED", "PRE-OPEN"]
    assert "message" in status

def test_nifty50_trade_list():
    stocks = get_nifty50_trade_list()
    assert len(stocks) >= 30
    first = stocks[0]
    assert first.symbol
    assert first.price > 0
    assert first.day_high >= first.day_low
    assert first.week_52_high >= first.week_52_low
    assert len(first.sparkline) == 5

def test_company_fundamentals():
    detail, df = get_stock_data("RELIANCE", period="1mo")
    assert detail.symbol == "RELIANCE"
    assert detail.fundamentals is not None
    fund = detail.fundamentals
    assert fund.market_cap_cr is not None and fund.market_cap_cr > 100000
    assert fund.pe_ratio is not None and fund.pe_ratio > 0
    assert fund.total_revenue_cr is not None and fund.total_revenue_cr > 100000
    assert fund.net_profit_cr is not None and fund.net_profit_cr > 10000
    assert fund.profit_margin_pct is not None
    assert len(fund.quarterly_financials) == 4

def test_price_alerts_lifecycle():
    user = "test_user_phase1"
    
    # 1. Create target price alert (Above)
    req_above = CreateAlertRequest(
        symbol="TCS",
        alert_type="ABOVE_LIMIT",
        target_value=5000.0,
        note="All-time high breakout target"
    )
    alert = create_price_alert(user, req_above)
    assert alert.symbol == "TCS"
    assert alert.status == "ACTIVE"
    assert alert.target_value == 5000.0
    
    # 2. Evaluate alert when triggered
    status, triggered_at, dist_amt, dist_pct = evaluate_alert(
        {"alert_type": "ABOVE_LIMIT", "target_value": 5000.0, "status": "ACTIVE"},
        current_price=5050.0,
        change_percent=2.5
    )
    assert status == "TRIGGERED"
    assert triggered_at is not None
    
    # 3. Retrieve user alerts
    res = get_user_alerts(user)
    assert len(res.alerts) >= 1
    
    # 4. Reset alert
    reset_ok = reset_price_alert(user, alert.id)
    assert reset_ok is True
    
    # 5. Delete alert
    delete_ok = delete_price_alert(user, alert.id)
    assert delete_ok is True

