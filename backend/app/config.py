"""Configuration settings for the application."""
from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings from environment variables"""
    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=False,
        extra="ignore"
    )

    # Database
    database_url: str = "mysql+pymysql://root:root@localhost:3307/marketplace"

    # JWT
    secret_key: str = "your-secret-key-here-change-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30

    # CORS
    cors_origins: str = "http://localhost:5173,http://localhost:3000"

    # Environment
    environment: str = "development"
    debug: bool = False

    # Server Configuration
    api_host: str = "127.0.0.1"
    api_port: int = 8000

    # Azure Storage Configuration
    azure_storage_connection_string: str = ""
    storage_mode: str = "local"  # "local" or "azure"

    # Sentry Configuration
    sentry_dsn: str = ""

@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance"""
    return Settings()
