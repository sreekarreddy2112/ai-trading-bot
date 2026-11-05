import re
import logging
from typing import Optional
from fastapi import APIRouter, HTTPException, Header, Path as FastApiPath
from models.schemas import CreateAlertRequest, AlertItem, AlertListResponse
from services.alerts_service import (
    get_user_alerts,
    create_price_alert,
    delete_price_alert,
    reset_price_alert,
)
from routers.watchlist import get_user_id

router = APIRouter(prefix="/api/alerts", tags=["Price Alerts"])
logger = logging.getLogger(__name__)

ALERT_ID_PARAM = FastApiPath(..., pattern=r"^[A-Za-z0-9_\-]{5,50}$", description="Unique Alert Identifier")


@router.get("", response_model=AlertListResponse)
def list_alerts(authorization: Optional[str] = Header(None)):
    """
    Returns the user's active and triggered price alerts,
    dynamically evaluated against current live market prices.
    """
    try:
        user_id = get_user_id(authorization)
        return get_user_alerts(user_id)
    except Exception as e:
        logger.error(f"Error retrieving alerts: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to retrieve price alerts")


@router.post("", response_model=AlertItem)
def create_alert(req: CreateAlertRequest, authorization: Optional[str] = Header(None)):
    """
    Creates a new limit price alert (Target, Stop Loss, % Gain, % Drop)
    for any Indian equity.
    """
    try:
        user_id = get_user_id(authorization)
        return create_price_alert(user_id, req)
    except Exception as e:
        logger.error(f"Error creating price alert for {req.symbol}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to create price alert")


@router.delete("/{alert_id}")
def delete_alert(alert_id: str = ALERT_ID_PARAM, authorization: Optional[str] = Header(None)):
    """
    Deletes an existing price alert by ID.
    Enforces authorization check ensuring only the owning user can delete their alert.
    """
    try:
        user_id = get_user_id(authorization)
        success = delete_price_alert(user_id, alert_id)
        if not success:
            raise HTTPException(status_code=404, detail="Alert not found or unauthorized")
        return {"status": "success", "message": "Alert deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting alert {alert_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete alert")


@router.post("/{alert_id}/reset")
def reset_alert(alert_id: str = ALERT_ID_PARAM, authorization: Optional[str] = Header(None)):
    """
    Resets a triggered alert back to ACTIVE status.
    Enforces authorization check ensuring only the owning user can reset their alert.
    """
    try:
        user_id = get_user_id(authorization)
        success = reset_price_alert(user_id, alert_id)
        if not success:
            raise HTTPException(status_code=404, detail="Alert not found or unauthorized")
        return {"status": "success", "message": "Alert reset to ACTIVE"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error resetting alert {alert_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to reset alert")

