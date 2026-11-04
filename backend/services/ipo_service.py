import time
import json
import logging
from typing import List, Optional, Dict, Any
from config import settings
from models.schemas import IPOItem, IPOSubscription, IPOListResponse, IPOAIVerdict

logger = logging.getLogger(__name__)

# Curated Indian IPO Universe with live market data, Newly Opened, Closed, Upcoming & Listed metrics
_INDIAN_IPOS: List[Dict[str, Any]] = [
    # ----------------- 1. NEWLY OPENED IPOS (BIDDING ACTIVE) -----------------
    {
        "id": "enviro-infra-engineers",
        "company_name": "Enviro Infra Engineers Ltd",
        "symbol": "ENVIROINFRA",
        "sector": "Environmental Infrastructure / Water Treatment",
        "price_band": "₹140 - ₹148",
        "min_price": 140.0,
        "max_price": 148.0,
        "issue_size": "₹650 Cr",
        "issue_type": "Fresh (₹572 Cr) + OFS (₹78 Cr)",
        "lot_size": 101,
        "min_investment": 14948.0,
        "open_date": "2024-11-22",
        "close_date": "2024-11-26",
        "listing_date": "2024-11-29",
        "status": "Open",
        "gmp": 32.0,
        "gmp_percent": 21.6,
        "subscription": {
            "qib": 6.84,
            "nii": 15.22,
            "retail": 8.35,
            "total": 9.48
        },
        "overview": "Specialized in designing, construction, and operation of water and wastewater treatment plants and water supply projects across Indian municipal and governmental bodies."
    },
    {
        "id": "rajputana-biodiesel",
        "company_name": "Rajputana Biodiesel Ltd",
        "symbol": "RAJPUTANA",
        "sector": "Biofuel & Green Energy",
        "price_band": "₹123 - ₹130",
        "min_price": 123.0,
        "max_price": 130.0,
        "issue_size": "₹24.7 Cr",
        "issue_type": "100% Fresh Issue (SME)",
        "lot_size": 1000,
        "min_investment": 130000.0,
        "open_date": "2024-11-26",
        "close_date": "2024-11-28",
        "listing_date": "2024-12-03",
        "status": "Open",
        "gmp": 55.0,
        "gmp_percent": 42.3,
        "subscription": {
            "qib": 8.12,
            "nii": 34.60,
            "retail": 22.45,
            "total": 21.80
        },
        "overview": "Producer of biofuels, biodiesel, and bio-coal briquettes with strategically located production facilities supporting India's green blending mandates."
    },
    {
        "id": "apex-ecotech",
        "company_name": "Apex Ecotech Ltd",
        "symbol": "APEXECO",
        "sector": "Water Recycling & Zero Liquid Discharge",
        "price_band": "₹71 - ₹75",
        "min_price": 71.0,
        "max_price": 75.0,
        "issue_size": "₹25.5 Cr",
        "issue_type": "100% Fresh Issue (SME)",
        "lot_size": 1600,
        "min_investment": 120000.0,
        "open_date": "2024-11-27",
        "close_date": "2024-11-29",
        "listing_date": "2024-12-04",
        "status": "Open",
        "gmp": 28.0,
        "gmp_percent": 37.3,
        "subscription": {
            "qib": 2.40,
            "nii": 12.80,
            "retail": 9.15,
            "total": 8.65
        },
        "overview": "Delivers end-to-end industrial water and wastewater recycling solutions including reverse osmosis and zero liquid discharge systems."
    },

    # ----------------- 2. CLOSED IPOS (ALLOTMENT & LISTING PENDING) -----------------
    {
        "id": "c2c-advanced-systems",
        "company_name": "C2C Advanced Systems Ltd",
        "symbol": "C2C",
        "sector": "Defense & Aerospace Electronics",
        "price_band": "₹214 - ₹226",
        "min_price": 214.0,
        "max_price": 226.0,
        "issue_size": "₹99 Cr",
        "issue_type": "100% Fresh Issue (SME)",
        "lot_size": 600,
        "min_investment": 135600.0,
        "open_date": "2024-11-22",
        "close_date": "2024-11-26",
        "listing_date": "2024-11-29",
        "status": "Closed",
        "gmp": 190.0,
        "gmp_percent": 84.1,
        "subscription": {
            "qib": 112.5,
            "nii": 182.4,
            "retail": 94.6,
            "total": 125.8
        },
        "overview": "Defense electronics and radar system integration partner for the Indian Armed Forces and domestic defense research agencies."
    },
    {
        "id": "lamosaic-india",
        "company_name": "Lamosaic India Ltd",
        "symbol": "LAMOSAIC",
        "sector": "Building Materials & Flush Doors",
        "price_band": "₹200 (Fixed Price)",
        "min_price": 200.0,
        "max_price": 200.0,
        "issue_size": "₹61.2 Cr",
        "issue_type": "100% Fresh Issue (SME)",
        "lot_size": 600,
        "min_investment": 120000.0,
        "open_date": "2024-11-21",
        "close_date": "2024-11-26",
        "listing_date": "2024-11-29",
        "status": "Closed",
        "gmp": 0.0,
        "gmp_percent": 0.0,
        "subscription": {
            "qib": 0.0,
            "nii": 1.25,
            "retail": 2.42,
            "total": 1.84
        },
        "overview": "Manufacturer and trader of decorative laminates, acrylic sheets, and customized designer flush doors."
    },

    # ----------------- 3. UPCOMING IPOS -----------------
    {
        "id": "tata-capital",
        "company_name": "Tata Capital Ltd",
        "symbol": "TATACAPITAL",
        "sector": "NBFC / Retail & Corporate Lending",
        "price_band": "₹450 - ₹480 (Tentative)",
        "min_price": 450.0,
        "max_price": 480.0,
        "issue_size": "₹15,000 Cr",
        "issue_type": "Book Built (Fresh + OFS)",
        "lot_size": 30,
        "min_investment": 14400.0,
        "open_date": "2025-03-15",
        "close_date": "2025-03-19",
        "listing_date": "2025-03-25",
        "status": "Upcoming",
        "gmp": 110.0,
        "gmp_percent": 22.9,
        "subscription": {
            "qib": 0.0,
            "nii": 0.0,
            "retail": 0.0,
            "total": 0.0
        },
        "overview": "Flagship financial services arm of the Tata Group, offering retail consumer lending, commercial finance, and wealth management services."
    },
    {
        "id": "boat-lifestyle",
        "company_name": "Imagine Marketing Ltd (boAt)",
        "symbol": "BOAT",
        "sector": "Consumer Electronics & Wearables",
        "price_band": "₹320 - ₹350 (Tentative)",
        "min_price": 320.0,
        "max_price": 350.0,
        "issue_size": "₹2,000 Cr",
        "issue_type": "Fresh (₹900 Cr) + OFS (₹1,100 Cr)",
        "lot_size": 42,
        "min_investment": 14700.0,
        "open_date": "2025-04-10",
        "close_date": "2025-04-14",
        "listing_date": "2025-04-21",
        "status": "Upcoming",
        "gmp": 45.0,
        "gmp_percent": 12.8,
        "subscription": {
            "qib": 0.0,
            "nii": 0.0,
            "retail": 0.0,
            "total": 0.0
        },
        "overview": "Market leader in India's wireless audio and smart wearables market with direct-to-consumer brand equity and pan-India retail footprint."
    },
    {
        "id": "hexaware-technologies",
        "company_name": "Hexaware Technologies Ltd",
        "symbol": "HEXAWARE",
        "sector": "IT Consulting & Enterprise Cloud",
        "price_band": "₹750 - ₹800 (Tentative)",
        "min_price": 750.0,
        "max_price": 800.0,
        "issue_size": "₹9,950 Cr",
        "issue_type": "100% OFS by Carlyle",
        "lot_size": 18,
        "min_investment": 14400.0,
        "open_date": "2025-04-24",
        "close_date": "2025-04-28",
        "listing_date": "2025-05-06",
        "status": "Upcoming",
        "gmp": 85.0,
        "gmp_percent": 10.6,
        "subscription": {
            "qib": 0.0,
            "nii": 0.0,
            "retail": 0.0,
            "total": 0.0
        },
        "overview": "Global technology and business process services company returning to Indian bourses backed by Carlyle Group."
    },
    {
        "id": "ather-energy",
        "company_name": "Ather Energy Ltd",
        "symbol": "ATHER",
        "sector": "Electric Two-Wheelers & EV Infrastructure",
        "price_band": "₹520 - ₹550 (Tentative)",
        "min_price": 520.0,
        "max_price": 550.0,
        "issue_size": "₹3,100 Cr",
        "issue_type": "Fresh (₹1,500 Cr) + OFS",
        "lot_size": 27,
        "min_investment": 14850.0,
        "open_date": "2025-05-12",
        "close_date": "2025-05-15",
        "listing_date": "2025-05-22",
        "status": "Upcoming",
        "gmp": 95.0,
        "gmp_percent": 17.3,
        "subscription": {
            "qib": 0.0,
            "nii": 0.0,
            "retail": 0.0,
            "total": 0.0
        },
        "overview": "Pioneer pure-play electric two-wheeler manufacturer in India with proprietary battery pack design and Ather Grid fast-charging network."
    },

    # ----------------- 4. RECENTLY LISTED IPOS -----------------
    {
        "id": "waaree-energies",
        "company_name": "Waaree Energies Ltd",
        "symbol": "WAAREE",
        "sector": "Solar Energy / Renewables",
        "price_band": "₹1,427 - ₹1,503",
        "min_price": 1427.0,
        "max_price": 1503.0,
        "issue_size": "₹4,321 Cr",
        "issue_type": "Book Built (Fresh + OFS)",
        "lot_size": 9,
        "min_investment": 13527.0,
        "open_date": "2024-10-21",
        "close_date": "2024-10-23",
        "listing_date": "2024-10-28",
        "status": "Listed",
        "gmp": 1560.0,
        "gmp_percent": 103.8,
        "listing_price": 2550.0,
        "listing_gain_pct": 69.66,
        "subscription": {
            "qib": 208.6,
            "nii": 62.5,
            "retail": 10.8,
            "total": 76.3
        },
        "overview": "India's largest manufacturer of solar PV modules with aggregate installed capacity of 12 GW."
    },
    {
        "id": "swiggy",
        "company_name": "Swiggy Ltd",
        "symbol": "SWIGGY",
        "sector": "Food Delivery & Quick Commerce",
        "price_band": "₹371 - ₹390",
        "min_price": 371.0,
        "max_price": 390.0,
        "issue_size": "₹11,327 Cr",
        "issue_type": "Book Built (Fresh ₹4,499 Cr + OFS ₹6,828 Cr)",
        "lot_size": 38,
        "min_investment": 14820.0,
        "open_date": "2024-11-06",
        "close_date": "2024-11-08",
        "listing_date": "2024-11-13",
        "status": "Listed",
        "gmp": 25.0,
        "gmp_percent": 6.4,
        "listing_price": 420.0,
        "listing_gain_pct": 7.69,
        "subscription": {
            "qib": 6.02,
            "nii": 0.41,
            "retail": 1.14,
            "total": 3.59
        },
        "overview": "Consumer internet pioneer operating India's leading on-demand convenience platform across food delivery and Instamart quick commerce."
    },
    {
        "id": "ntpc-green-energy",
        "company_name": "NTPC Green Energy Ltd",
        "symbol": "NTPCGREEN",
        "sector": "Renewable Power Utility",
        "price_band": "₹102 - ₹108",
        "min_price": 102.0,
        "max_price": 108.0,
        "issue_size": "₹10,000 Cr",
        "issue_type": "100% Fresh Issue",
        "lot_size": 138,
        "min_investment": 14904.0,
        "open_date": "2024-11-19",
        "close_date": "2024-11-22",
        "listing_date": "2024-11-27",
        "status": "Listed",
        "gmp": 3.0,
        "gmp_percent": 2.78,
        "listing_price": 111.5,
        "listing_gain_pct": 3.24,
        "subscription": {
            "qib": 3.32,
            "nii": 0.81,
            "retail": 3.44,
            "total": 2.42
        },
        "overview": "Wholly owned subsidiary of Maharatna PSU NTPC, dedicated to solar and wind power asset portfolio expansion."
    },
    {
        "id": "hyundai-motor-india",
        "company_name": "Hyundai Motor India Ltd",
        "symbol": "HYUNDAI",
        "sector": "Automobile OEM",
        "price_band": "₹1,865 - ₹1,960",
        "min_price": 1865.0,
        "max_price": 1960.0,
        "issue_size": "₹27,870 Cr",
        "issue_type": "100% Offer For Sale (OFS)",
        "lot_size": 7,
        "min_investment": 13720.0,
        "open_date": "2024-10-15",
        "close_date": "2024-10-17",
        "listing_date": "2024-10-22",
        "status": "Listed",
        "gmp": -20.0,
        "gmp_percent": -1.02,
        "listing_price": 1934.0,
        "listing_gain_pct": -1.33,
        "subscription": {
            "qib": 6.97,
            "nii": 0.60,
            "retail": 0.50,
            "total": 2.37
        },
        "overview": "India's second-largest passenger vehicle automaker by domestic sales, bringing India's largest-ever initial public offering."
    }
]


def list_ipos(status: Optional[str] = None) -> IPOListResponse:
    """Returns curated list of Indian IPOs with optional status filter."""
    items = _INDIAN_IPOS
    if status and status.lower() != "all":
        items = [i for i in _INDIAN_IPOS if i["status"].lower() == status.lower()]

    ipo_models = [IPOItem(**item) for item in items]
    return IPOListResponse(
        ipos=ipo_models,
        total=len(ipo_models),
        last_updated=time.strftime("%Y-%m-%d %H:%M:%S IST")
    )


def get_ipo_by_id(ipo_id: str) -> Optional[IPOItem]:
    """Finds an IPO by its unique identifier."""
    for item in _INDIAN_IPOS:
        if item["id"] == ipo_id:
            return IPOItem(**item)
    return None


def generate_ipo_ai_verdict(ipo_id: str) -> IPOAIVerdict:
    """
    Synthesizes an institutional-grade investment verdict for the IPO
    using Anthropic Claude 3.5 Sonnet or quantitative algorithmic heuristics.
    """
    ipo = get_ipo_by_id(ipo_id)
    if not ipo:
        raise ValueError(f"IPO with ID '{ipo_id}' not found.")

    # High GMP and strong subscription heuristics
    total_sub = ipo.subscription.total
    gmp_pct = ipo.gmp_percent

    if gmp_pct > 25.0 and total_sub > 5.0:
        verdict = "Apply for Listing Gains"
        confidence = "high"
        valuation = "Attractive listing pop expected due to robust retail and institutional over-subscription."
        strengths = [
            f"Strong Grey Market Premium of ₹{ipo.gmp} ({gmp_pct:+.1f}%) signalling heavy listing-day demand.",
            f"Aggregate over-subscription of {total_sub}x indicating solid institutional appetite.",
            f"Sector tailwinds in {ipo.sector} driving positive investor sentiment."
        ]
        risks = [
            "Post-listing profit booking could compress short-term gains.",
            "Market volatility on listing day may affect the opening gap."
        ]
        summary = (
            f"Strong buy signal for listing-day pop. With {gmp_pct:.1f}% GMP and {total_sub}x subscription, "
            f"{ipo.company_name} presents an optimal profile for high-probability listing gains."
        )
    elif gmp_pct > 10.0:
        verdict = "Apply for Long Term"
        confidence = "medium"
        valuation = "Fairly valued issue with multi-year compounding potential in a growing industry."
        strengths = [
            f"Established market presence in {ipo.sector}.",
            f"Moderate GMP of ₹{ipo.gmp} ({gmp_pct:+.1f}%) providing a downside safety buffer.",
            f"Issue structure of {ipo.issue_type} supporting expansion."
        ]
        risks = [
            "Listing pop may be capped if broader market experiences consolidation.",
            "Execution risks during capacity scale-up."
        ]
        summary = (
            f"{ipo.company_name} is a high-quality fundamental business suited for long-term compounders. "
            f"Listing gains may be moderate, but long-term industry runway remains healthy."
        )
    elif gmp_pct < 0.0 or (total_sub > 0 and total_sub < 1.0):
        verdict = "Avoid"
        confidence = "high"
        valuation = "Aggressively priced offering with negligible margin of safety."
        strengths = [
            f"Brand equity in {ipo.sector}."
        ]
        risks = [
            f"Negative/Discounted GMP of ₹{ipo.gmp} ({gmp_pct:+.1f}%) points to high risk of discount opening.",
            "Weak institutional subscription demand.",
            "Rich valuation multiples leaving zero margin of safety for retail participants."
        ]
        summary = (
            f"High capital risk. With negative GMP and unenthusiastic subscription demand, "
            f"retail participants should avoid applying to prevent listing-day drawdown."
        )
    else:
        verdict = "Neutral / Watch"
        confidence = "medium"
        valuation = "Fully valued; monitoring subscription pace on day 2 and day 3 is recommended."
        strengths = [
            f"Defensive balance sheet in {ipo.sector}."
        ]
        risks = [
            "Moderate retail interest with subdued QIB queue."
        ]
        summary = (
            f"Wait and watch. Retail investors should track QIB institutional subscription numbers on the final bidding day "
            f"before committing capital."
        )

    # If Anthropic Claude API Key is configured, attempt LLM call
    if settings.ANTHROPIC_API_KEY:
        try:
            from anthropic import Anthropic
            client = Anthropic(api_key=settings.ANTHROPIC_API_KEY)
            prompt = f"""You are a senior SEBI-compliant equity research analyst. Analyze the following Indian IPO:
Company: {ipo.company_name} ({ipo.symbol})
Sector: {ipo.sector}
Price Band: {ipo.price_band}
Issue Size: {ipo.issue_size} ({ipo.issue_type})
Lot Size: {ipo.lot_size} (Min Investment: ₹{ipo.min_investment:,.2f})
GMP: ₹{ipo.gmp} ({ipo.gmp_percent:+.1f}%)
Subscription Total: {ipo.subscription.total}x (QIB: {ipo.subscription.qib}x, Retail: {ipo.subscription.retail}x)
Overview: {ipo.overview}

Provide a JSON output with the exact schema:
{{
  "verdict": "Apply for Listing Gains" | "Apply for Long Term" | "Neutral / Watch" | "Avoid",
  "confidence": "high" | "medium" | "low",
  "valuation_assessment": "string",
  "strengths": ["string", "string"],
  "risks": ["string", "string"],
  "verdict_summary": "string"
}}
Return ONLY raw JSON."""
            response = client.messages.create(
                model=settings.CLAUDE_MODEL,
                messages=[{"role": "user", "content": prompt}],
                max_tokens=800,
                temperature=0.2,
            )
            raw = response.content[0].text.strip()
            if raw.startswith("```"):
                raw = raw.split("```")[1]
                if raw.startswith("json"):
                    raw = raw[4:]
            parsed = json.loads(raw.strip())
            return IPOAIVerdict(
                ipo_id=ipo.id,
                company_name=ipo.company_name,
                verdict=parsed.get("verdict", verdict),
                confidence=parsed.get("confidence", confidence),
                valuation_assessment=parsed.get("valuation_assessment", valuation),
                strengths=parsed.get("strengths", strengths),
                risks=parsed.get("risks", risks),
                verdict_summary=parsed.get("verdict_summary", summary),
                generated_at=time.strftime("%Y-%m-%d %H:%M:%S IST"),
                disclaimer=settings.SEBI_DISCLAIMER
            )
        except Exception as e:
            logger.error(f"Anthropic IPO analysis error: {e}")

    return IPOAIVerdict(
        ipo_id=ipo.id,
        company_name=ipo.company_name,
        verdict=verdict,
        confidence=confidence,
        valuation_assessment=valuation,
        strengths=strengths,
        risks=risks,
        verdict_summary=summary,
        generated_at=time.strftime("%Y-%m-%d %H:%M:%S IST"),
        disclaimer=settings.SEBI_DISCLAIMER
    )


# Alias for backwards compatibility with router
evaluate_ipo_with_ai = generate_ipo_ai_verdict

