"""Application configuration using Pydantic Settings."""

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

    # Application
    app_name: str = "Budget App"
    app_version: str = "1.0.0"
    debug: bool = False
    environment: str = "development"

    # Database
    database_url: str = "postgresql+asyncpg://postgres:postgres@db:5432/budget_db"

    # Security
    secret_key: str = "change-this-secret-key-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24 * 7  # 7 days
    api_key: str = ""  # Optional API key for frontend authentication

    # CORS - Support wildcard "*" for all origins
    cors_origins: str = "http://localhost:3000,http://frontend:3000"

    # IP Filtering (comma-separated list)
    allowed_ips: str = ""  # e.g., "82.65.136.32,10.0.0.1"
    allowed_referers: str = ""  # e.g., "budget.novacat.fr,localhost"

    # Email SMTP settings
    smtp_host: str = "smtp.gmail.com"
    smtp_port: int = 587
    smtp_user: str = ""
    smtp_password: str = ""
    smtp_from_email: str = ""
    smtp_from_name: str = "DuoBudget"

    # Magic link settings
    magic_link_expire_minutes: int = 15
    frontend_url: str = "http://localhost:3000"

    @property
    def cors_origins_list(self) -> list[str]:
        """Get CORS origins as a list."""
        if self.cors_origins == "*":
            return ["*"]
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    @property
    def allowed_ips_list(self) -> list[str]:
        """Get allowed IPs as a list."""
        if not self.allowed_ips:
            return []
        return [ip.strip() for ip in self.allowed_ips.split(",") if ip.strip()]

    @property
    def allowed_referers_list(self) -> list[str]:
        """Get allowed referers as a list."""
        if not self.allowed_referers:
            return []
        return [ref.strip() for ref in self.allowed_referers.split(",") if ref.strip()]


@lru_cache
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()


settings = get_settings()
