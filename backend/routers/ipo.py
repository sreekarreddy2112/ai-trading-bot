import logging
from typing import Optional
from fastapi import APIRouter, HTTPException, Query
from models.schemas import IPOListResponse, IPOItem, IPOAIVerdict
from services.ipo_service import list_ipos, get_ipo_by_id, generate_ipo_ai_verdict

router = APIRouter(prefix="/api/ipo", tags=["IPO Tracker"])
logger = logging.getLogger(__name__)


@router.get("", response_model=IPOListResponse)
def get_ipos(status: Optional[str] = Query(None, description="Filter by status: Open, Upcoming, Closed, Listed")):
    """
    Returns Indian IPO listings (NSE/BSE), price bands, issue sizes,
    Grey Market Premium (GMP), and subscription status.
    """
    try:
        return list_ipos(status=status)
    except Exception as e:
        logger.error(f"Error fetching IPO list: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve IPO listings")


@router.get("/{ipo_id}", response_model=IPOItem)
def get_single_ipo(ipo_id: str):
    """
    Returns granular details, lot sizes, and key dates for a specific Indian IPO.
    """
    ipo = get_ipo_by_id(ipo_id)
    if not ipo:
        raise HTTPException(status_code=404, detail=f"IPO '{ipo_id}' not found")
    return ipo


@router.post("/{ipo_id}/ai-verdict", response_model=IPOAIVerdict)
def get_ipo_verdict(ipo_id: str):
    """
    Generates structured AI evaluation (Apply / Avoid / Long Term)
    grounded in valuation multiples, GMP, and institutional subscription data.
    """
    try:
        verdict = generate_ipo_ai_verdict(ipo_id)
        return verdict
    except ValueError as ve:
        raise HTTPException(status_code=404, detail=str(ve))
    except Exception as e:
        logger.error(f"Error generating AI verdict for IPO {ipo_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to evaluate IPO with AI")

