import uuid
import time
import logging
from typing import List, Dict, Optional, Tuple
from models.schemas import CreateAlertRequest, AlertItem, AlertListResponse
from services.market_data import get_stock_data, COMPANY_NAMES, strip_suffix

logger = logging.getLogger(__name__)

# In-memory alerts storage: keyed by user_id -> List of Alert dictionaries
_alerts_store: Dict[str, List[Dict]] = {
    "guest": [
        {
            "id": "alert-guest-1",
            "user_id": "guest",
            "symbol": "RELIANCE",
            "company_name": "Reliance Industries Ltd",
            "alert_type": "ABOVE_LIMIT",
            "target_value": 3100.00,
            "initial_price": 2980.50,
            "status": "ACTIVE",
            "triggered_at": None,
            "note": "Resistance breakout target level",
            "created_at": time.strftime("%Y-%m-%d %H:%M")
        },
        {
            "id": "alert-guest-2",
            "user_id": "guest",
            "symbol": "TCS",
            "company_name": "Tata Consultancy Services Ltd",
            "alert_type": "BELOW_LIMIT",
            "target_value": 4050.00,
            "initial_price": 4120.00,
            "status": "ACTIVE",
            "triggered_at": None,
            "note": "Support zone retest stop loss",
            "created_at": time.strftime("%Y-%m-%d %H:%M")
        },
        {
            "id": "alert-guest-3",
            "user_id": "guest",
            "symbol": "INFY",
            "company_name": "Infosys Ltd",
            "alert_type": "PCT_GAIN",
            "target_value": 2.50,
            "initial_price": 1875.25,
            "status": "TRIGGERED",
            "triggered_at": time.strftime("%Y-%m-%d 11:30 IST"),
            "note": "Quarterly earnings momentum surge",
            "created_at": time.strftime("%Y-%m-%d %H:%M")
        }
    ]
}


def evaluate_alert(alert_data: Dict, current_price: float, change_percent: float) -> Tuple[str, Optional[str], float, float]:
    """
    Evaluates whether an alert condition has met its trigger criteria.
    Returns (status, triggered_at, distance_amount, distance_percent).
    """
    alert_type = alert_data["alert_type"]
    target = float(alert_data["target_value"])
    status = alert_data.get("status", "ACTIVE")
    triggered_at = alert_data.get("triggered_at")

    distance_amount = 0.0
    distance_percent = 0.0

    if alert_type == "ABOVE_LIMIT":
        distance_amount = round(target - current_price, 2)
        distance_percent = round(((target - current_price) / current_price) * 100, 2) if current_price else 0.0
        if current_price >= target and status == "ACTIVE":
            status = "TRIGGERED"
            triggered_at = time.strftime("%Y-%m-%d %H:%M IST")

    elif alert_type == "BELOW_LIMIT":
        distance_amount = round(current_price - target, 2)
        distance_percent = round(((current_price - target) / current_price) * 100, 2) if current_price else 0.0
        if current_price <= target and status == "ACTIVE":
            status = "TRIGGERED"
            triggered_at = time.strftime("%Y-%m-%d %H:%M IST")

    elif alert_type == "PCT_GAIN":
        distance_percent = round(target - change_percent, 2)
        distance_amount = round((distance_percent / 100) * current_price, 2)
        if change_percent >= target and status == "ACTIVE":
            status = "TRIGGERED"
            triggered_at = time.strftime("%Y-%m-%d %H:%M IST")

    elif alert_type == "PCT_DROP":
        threshold = -abs(target)
        distance_percent = round(change_percent - threshold, 2)
        distance_amount = round((distance_percent / 100) * current_price, 2)
        if change_percent <= threshold and status == "ACTIVE":
            status = "TRIGGERED"
            triggered_at = time.strftime("%Y-%m-%d %H:%M IST")

    return status, triggered_at, distance_amount, distance_percent


def get_user_alerts(user_id: str = "guest") -> AlertListResponse:
    """
    Fetches and evaluates all alerts for a user against live market prices.
    """
    user_alert_list = _alerts_store.get(user_id, _alerts_store.get("guest", []))
    items: List[AlertItem] = []

    for alert_raw in user_alert_list:
        sym = alert_raw["symbol"]
        try:
            detail, _ = get_stock_data(sym, period="5d")
            curr_p = detail.current_price
            chg_pct = detail.change_percent
            comp_name = detail.company_name
        except Exception:
            curr_p = alert_raw.get("initial_price", 2500.0)
            chg_pct = 0.5
            comp_name = alert_raw.get("company_name", COMPANY_NAMES.get(sym, f"{sym} Ltd"))

        status, triggered_at, dist_amt, dist_pct = evaluate_alert(alert_raw, curr_p, chg_pct)
        alert_raw["status"] = status
        alert_raw["triggered_at"] = triggered_at

        items.append(AlertItem(
            id=alert_raw["id"],
            user_id=user_id,
            symbol=sym,
            company_name=comp_name,
            alert_type=alert_raw["alert_type"],
            target_value=alert_raw["target_value"],
            initial_price=alert_raw.get("initial_price", curr_p),
            current_price=curr_p,
            distance_percent=dist_pct,
            distance_amount=dist_amt,
            status=status,
            triggered_at=triggered_at,
            note=alert_raw.get("note"),
            created_at=alert_raw["created_at"]
        ))

    active_count = sum(1 for a in items if a.status == "ACTIVE")
    triggered_count = sum(1 for a in items if a.status == "TRIGGERED")

    return AlertListResponse(
        alerts=items,
        active_count=active_count,
        triggered_count=triggered_count,
        last_evaluated=time.strftime("%Y-%m-%d %H:%M:%S IST")
    )


def create_price_alert(user_id: str, req: CreateAlertRequest) -> AlertItem:
    """
    Creates a new limit price or percentage alert for a stock.
    """
    clean_sym = strip_suffix(req.symbol.strip().upper())
    try:
        detail, _ = get_stock_data(clean_sym, period="5d")
        curr_price = detail.current_price
        comp_name = detail.company_name
    except Exception:
        curr_price = 2500.0
        comp_name = COMPANY_NAMES.get(clean_sym, f"{clean_sym} Ltd")

    alert_id = f"alert-{uuid.uuid4().hex[:8]}"
    created_at = time.strftime("%Y-%m-%d %H:%M")

    new_alert_dict = {
        "id": alert_id,
        "user_id": user_id,
        "symbol": clean_sym,
        "company_name": comp_name,
        "alert_type": req.alert_type,
        "target_value": req.target_value,
        "initial_price": curr_price,
        "status": "ACTIVE",
        "triggered_at": None,
        "note": req.note or f"{req.alert_type.replace('_', ' ').title()} alert for {clean_sym}",
        "created_at": created_at
    }

    user_alerts = _alerts_store.setdefault(user_id, [])
    user_alerts.append(new_alert_dict)

    # Calculate distance metrics (new alerts start in ACTIVE status)
    if req.alert_type == "ABOVE_LIMIT":
        dist_amt = round(req.target_value - curr_price, 2)
        dist_pct = round(((req.target_value - curr_price) / curr_price) * 100, 2) if curr_price else 0.0
    elif req.alert_type == "BELOW_LIMIT":
        dist_amt = round(curr_price - req.target_value, 2)
        dist_pct = round(((curr_price - req.target_value) / curr_price) * 100, 2) if curr_price else 0.0
    else:
        dist_pct = round(req.target_value, 2)
        dist_amt = round((dist_pct / 100) * curr_price, 2)

    return AlertItem(
        id=alert_id,
        user_id=user_id,
        symbol=clean_sym,
        company_name=comp_name,
        alert_type=req.alert_type,
        target_value=req.target_value,
        initial_price=curr_price,
        current_price=curr_price,
        distance_percent=dist_pct,
        distance_amount=dist_amt,
        status="ACTIVE",
        triggered_at=None,
        note=new_alert_dict["note"],
        created_at=created_at
    )


def delete_price_alert(user_id: str, alert_id: str) -> bool:
    """Deletes an alert by ID."""
    user_alerts = _alerts_store.get(user_id, [])
    for idx, alert in enumerate(user_alerts):
        if alert["id"] == alert_id:
            user_alerts.pop(idx)
            return True
    # Also check guest pool
    guest_alerts = _alerts_store.get("guest", [])
    for idx, alert in enumerate(guest_alerts):
        if alert["id"] == alert_id:
            guest_alerts.pop(idx)
            return True
    return False


def reset_price_alert(user_id: str, alert_id: str) -> bool:
    """Resets a triggered alert back to ACTIVE."""
    for pool in [_alerts_store.get(user_id, []), _alerts_store.get("guest", [])]:
        for alert in pool:
            if alert["id"] == alert_id:
                alert["status"] = "ACTIVE"
                alert["triggered_at"] = None
                return True
    return False
