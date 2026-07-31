import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Sentellent Agentic Equity Analyst"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Security / Auth
    SECRET_KEY: str = os.getenv("SECRET_KEY", "sentellent_secret_jwt_key_2026_super_secure")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # OAuth Test Users explicitly requested by Sentellent
    TEST_USERS: list[str] = ["harisankar@sentellent.com", "naga@sentellent.com", "demo@sentellent.com"]
    
    # Database: Supports SQLite, AWS RDS Postgres, or Supabase Postgres with pgvector
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")
    SUPABASE_KEY: str = os.getenv("SUPABASE_KEY", "")
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./sql_app.db")
    
    # LLM & Embeddings (Gemini / OpenAI / Fallback local embeddings)
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", os.getenv("OPENAI_API_KEY", ""))
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    
    class Config:
        case_sensitive = True

settings = Settings()
