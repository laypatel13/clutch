from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = "sqlite:///./clutch.db"

    # Security
    SECRET_KEY: str = "change-this-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days

    # GitHub OAuth
    GITHUB_CLIENT_ID: str = ""
    GITHUB_CLIENT_SECRET: str = ""
    GITHUB_REDIRECT_URI: str = "http://localhost:8020/auth/github/callback"

    # AI Providers
    GROQ_API_KEY: str = ""

    # App
    FRONTEND_URL: str = "http://localhost:5180"
    ENVIRONMENT: str = "development"

    class Config:
        env_file = ".env"


settings = Settings()