import os
import sys
from pathlib import Path

# Ensure backend directory is in sys.path so it runs from any current working directory
backend_dir = Path(__file__).resolve().parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

import logging
from fastapi import FastAPI, Response, Request
from fastapi.middleware.cors import CORSMiddleware
from config import settings
from routers import market, stocks, news, backtest, watchlist, ipo, alerts, auth

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("MarketMind")

# Security: In production, internal Swagger (/docs) and ReDoc (/redoc) are disabled
is_production = (
    os.getenv("ENVIRONMENT", "development").lower() == "production"
    or os.getenv("RENDER", "").lower() == "true"
    or os.getenv("VERCEL_ENV", "").lower() == "production"
)

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description=settings.DESCRIPTION,
    docs_url=None if is_production else "/docs",
    redoc_url=None if is_production else "/redoc",
    openapi_url=None if is_production else "/openapi.json",
)

# Secure CORS configuration: explicit origins + regex for trusted deployments, no wildcard with credentials
cors_origins = [o for o in settings.ALLOWED_ORIGINS if o and o != "*"]
for default_origin in ["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:3001"]:
    if default_origin not in cors_origins:
        cors_origins.append(default_origin)

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_origin_regex=r"^https://[a-zA-Z0-9\-_]+\.vercel\.app$|^http://(localhost|127\.0\.0\.1):\d+$",
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "X-Requested-With", "Accept"],
)

# Include routers
app.include_router(market.router)
app.include_router(stocks.router)
app.include_router(news.router)
app.include_router(backtest.router)
app.include_router(watchlist.router)
app.include_router(ipo.router)
app.include_router(alerts.router)
app.include_router(auth.router)


@app.get("/favicon.ico", include_in_schema=False)
def favicon():
    return Response(status_code=204)


@app.get("/health")
def health_check():
    """System health check and diagnostic endpoint."""
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "ai_provider": "Anthropic Claude (claude-3-5-sonnet)" if settings.ANTHROPIC_API_KEY else "Algorithmic Grounded Synthesis (Active)",
        "disclaimer": settings.SEBI_DISCLAIMER
    }


@app.get("/")
def root():
    return {
        "app": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "documentation": "/docs",
        "disclaimer": settings.SEBI_DISCLAIMER
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

