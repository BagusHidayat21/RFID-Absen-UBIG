from pydantic import BaseSettings

class Settings(BaseSettings):
    APP_NAME: str
    APP_VERSION: str
    DEBUG: bool
    DATABASE_URL: str
    SECRET_KEY: str
    ALGORITHM: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int
    FRONTEND_URL: str
    LOG_LEVEL: str

    class Config:
        env_file = ".env"   # bisa diganti ke .env.production saat deploy

settings = Settings()