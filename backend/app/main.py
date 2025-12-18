"""FastAPI application entry point."""

import logging
from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db
from app.api.routes import (
    accounts,
    auth,
    categories,
    child_expenses,
    child_monthly_budgets,
    expenses,
    projects,
    recurring_charges,
    users,
)
from app.core.config import settings

# Configure logging
logger = logging.getLogger(__name__)
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)

# Constants
DOCS_URL = "/api/docs"
REDOC_URL = "/api/redoc"
OPENAPI_URL = "/api/openapi.json"
HEALTH_URL = "/api/health"
PUBLIC_ENDPOINTS = [HEALTH_URL, DOCS_URL, REDOC_URL, OPENAPI_URL]


def _is_public_endpoint(path: str) -> bool:
    """Check if the endpoint is public (health check, docs)."""
    return path in PUBLIC_ENDPOINTS


def _get_client_ip(request: Request) -> str:
    """Extract client IP from request, handling X-Forwarded-For."""
    forwarded_for = request.headers.get("X-Forwarded-For", "")
    if forwarded_for:
        return forwarded_for.split(",")[0].strip()
    return request.client.host if request.client else ""


def _is_ip_allowed(client_ip: str, allowed_ips: list[str]) -> bool:
    """Check if client IP is in the allowed list."""
    return bool(allowed_ips) and client_ip in allowed_ips


def _is_referer_allowed(referer: str, allowed_referers: list[str]) -> bool:
    """Check if referer matches any allowed referers."""
    if not allowed_referers or not referer:
        return False
    return any(allowed_ref in referer for allowed_ref in allowed_referers)


@asynccontextmanager
async def lifespan(_app: FastAPI) -> AsyncGenerator[None, None]:
    """Application lifespan handler."""
    # Startup
    yield
    # Shutdown


def create_application() -> FastAPI:
    """Create and configure the FastAPI application."""
    app = FastAPI(
        title=settings.app_name,
        version=settings.app_version,
        description="Budget management application for couples",
        docs_url=DOCS_URL,
        redoc_url=REDOC_URL,
        openapi_url=OPENAPI_URL,
        lifespan=lifespan,
        # Enable automatic slash redirect for better compatibility
        redirect_slashes=True,
    )

    # Configure CORS with explicit settings for production
    cors_origins = settings.cors_origins_list
    allow_all_origins = "*" in cors_origins and len(cors_origins) == 1

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"] if allow_all_origins else cors_origins,
        allow_credentials=True,  # Always allow credentials for authenticated requests
        allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allow_headers=["*"],  # Allow all headers including Authorization
        expose_headers=["Content-Length"],
        max_age=86400,  # 24 hours cache for preflight
    )

    # Note: Removed custom OPTIONS handler to let CORSMiddleware handle preflight requests
    # This prevents interference with standard CORS behavior

    # Make CORS variables available to middleware functions
    app.state.cors_origins = cors_origins
    app.state.allow_all_origins = allow_all_origins

    # HTTPS redirect middleware (force HTTPS in production)
    @app.middleware("http")
    async def force_https_redirect(request: Request, call_next):
        """Force HTTPS redirect and add security headers."""
        # Log ALL requests with full details
        forwarded_proto = request.headers.get("X-Forwarded-Proto", "")
        forwarded_for = request.headers.get("X-Forwarded-For", "")
        host = request.headers.get("Host", "")
        referer = request.headers.get("Referer", "")

        logger.info(
            f"📥 REQUEST: {request.method} {request.url.path} | "
            f"Host={host} | Proto={forwarded_proto} | "
            f"IP={forwarded_for} | Referer={referer}"
        )

        # Simple HTTP to HTTPS redirect for non-Cloud-Run environments
        if forwarded_proto == "http" and "cloudrun.app" not in host:
            logger.warning(
                f"🚨 HTTP request detected! Forcing HTTPS redirect for {request.url.path}"
            )
            http_scheme = "http://"
            https_scheme = "https://"
            url = str(request.url).replace(http_scheme, https_scheme, 1)

            # Add CORS headers to the redirect response
            cors_origins = request.app.state.cors_origins
            allow_all_origins = request.app.state.allow_all_origins
            headers = {"Location": url}
            if allow_all_origins:
                headers["Access-Control-Allow-Origin"] = "*"
            else:
                origin = request.headers.get("Origin", "")
                if origin in cors_origins:
                    headers["Access-Control-Allow-Origin"] = origin
                    headers["Vary"] = "Origin"

            return JSONResponse(
                status_code=status.HTTP_308_PERMANENT_REDIRECT,
                headers=headers,
                content={"detail": "HTTPS required", "redirect": url},
            )

        response = await call_next(request)

        # ✅ CRITICAL FIX: Force HTTPS in Location headers from redirects
        http_scheme = "http://"
        https_scheme = "https://"
        if "Location" in response.headers:
            location = response.headers["Location"]
            if location.startswith(http_scheme):
                logger.warning(f"🔧 Fixing HTTP redirect to HTTPS: {location}")
                response.headers["Location"] = location.replace(http_scheme, https_scheme, 1)

        # Note: CORS headers are now handled by the dedicated CORS middleware
        # We only need to ensure HTTPS Location headers are corrected here

        # Add strict security headers to ALL responses
        response.headers["Strict-Transport-Security"] = (
            "max-age=31536000; includeSubDomains; preload"
        )
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        # CSP to block mixed content
        response.headers["Content-Security-Policy"] = (
            "upgrade-insecure-requests; block-all-mixed-content"
        )

        # Ensure CORS headers are present on all responses (not just preflight)
        cors_origins = request.app.state.cors_origins
        allow_all_origins = request.app.state.allow_all_origins
        if not allow_all_origins:
            origin = request.headers.get("Origin", "")
            if origin in cors_origins:
                response.headers["Access-Control-Allow-Origin"] = origin
                response.headers["Vary"] = "Origin"
                response.headers["Access-Control-Allow-Credentials"] = "true"

        logger.info(f"📤 RESPONSE: {response.status_code} for {request.url.path}")
        return response

    # IP and Referer filtering middleware (security layer)
    @app.middleware("http")
    async def ip_referer_filter(request: Request, call_next):
        """Filter requests by IP address and Referer header."""
        # Skip filtering for public endpoints
        if _is_public_endpoint(request.url.path):
            return await call_next(request)

        # Skip if no IP/Referer filtering configured
        if not settings.allowed_ips_list and not settings.allowed_referers_list:
            return await call_next(request)

        # Get client IP
        client_ip = _get_client_ip(request)

        # Check IP whitelist
        if _is_ip_allowed(client_ip, settings.allowed_ips_list):
            return await call_next(request)

        # Check Referer whitelist
        referer = request.headers.get("Referer", "")
        if _is_referer_allowed(referer, settings.allowed_referers_list):
            return await call_next(request)

        # Deny access if restrictions exist but none matched
        return JSONResponse(
            status_code=status.HTTP_403_FORBIDDEN,
            content={"detail": "Access denied: IP or Referer not allowed"},
        )

    # API Key middleware (optional security layer)
    @app.middleware("http")
    async def verify_api_key(request: Request, call_next):
        """Verify API key if configured."""
        # Skip API key check if not configured or for public endpoints
        if not settings.api_key or _is_public_endpoint(request.url.path):
            return await call_next(request)

        # Check X-API-Key header
        api_key = request.headers.get("X-API-Key")
        if api_key != settings.api_key:
            return JSONResponse(
                status_code=status.HTTP_403_FORBIDDEN,
                content={"detail": "Invalid or missing API key"},
            )

        return await call_next(request)

    # Include routers
    app.include_router(auth.router, prefix="/api")
    app.include_router(users.router, prefix="/api")
    app.include_router(categories.router, prefix="/api")
    app.include_router(accounts.router, prefix="/api")
    app.include_router(expenses.router, prefix="/api")
    app.include_router(child_expenses.router, prefix="/api")
    app.include_router(child_monthly_budgets.router, prefix="/api")
    app.include_router(projects.router, prefix="/api")
    app.include_router(recurring_charges.router, prefix="/api")

    @app.get(HEALTH_URL)
    async def health_check() -> dict:
        """Health check endpoint."""
        return {"status": "healthy", "version": settings.app_version}

    @app.get("/api/db-health")
    async def db_health_check(db: AsyncSession = Depends(get_db)) -> dict:
        """Database health check endpoint."""
        try:
            # Test basic database connectivity
            await db.execute(text("SELECT 1"))
            db_status = "connected"

            # Test if required tables exist
            tables_to_check = ["users", "child_expenses", "child_monthly_budgets"]
            missing_tables = []

            for table in tables_to_check:
                try:
                    await db.execute(text(f"SELECT 1 FROM {table} LIMIT 1"))
                except Exception:
                    missing_tables.append(table)

            table_status = (
                "all_present" if not missing_tables else f"missing: {', '.join(missing_tables)}"
            )

            return {
                "status": "healthy",
                "database": db_status,
                "tables": table_status,
                "version": settings.app_version,
            }
        except Exception as e:
            return {
                "status": "unhealthy",
                "database": "disconnected",
                "error": str(e),
                "version": settings.app_version,
            }

    return app


app = create_application()
