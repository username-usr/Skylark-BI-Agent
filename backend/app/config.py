import os
from pathlib import Path
from dotenv import load_dotenv
from pydantic_settings import BaseSettings

# Load .env directly from project root
env_file = Path(__file__).resolve().parent.parent.parent / ".env"
if env_file.exists():
    load_dotenv(str(env_file), override=True)
else:
    load_dotenv(override=True)

class Settings(BaseSettings):
    MONDAY_API_KEY: str = os.getenv("MONDAY_API_KEY", "")
    MONDAY_MCP_URL: str = os.getenv("MONDAY_MCP_URL", "https://mcp.monday.com/mcp")
    MONDAY_GRAPHQL_URL: str = os.getenv("MONDAY_GRAPHQL_URL", "https://api.monday.com/v2")
    
    # Gemini
    LLM_API_KEY: str = os.getenv("LLM_API_KEY", "")
    LLM_MODEL: str = os.getenv("LLM_MODEL", "gemini-3.5-flash-lite")
    
    # OpenRouter
    OPENROUTER_API_KEY: str = os.getenv("OPENROUTER_API_KEY", "")
    OPENROUTER_MODEL: str = os.getenv("OPENROUTER_MODEL", "meta-llama/llama-3.3-70b-instruct:free")
    
    DEALS_BOARD_ID: str = os.getenv("DEALS_BOARD_ID", "")
    WORK_ORDERS_BOARD_ID: str = os.getenv("WORK_ORDERS_BOARD_ID", "")
    
    DATA_DIR: str = str(Path(__file__).resolve().parent.parent.parent / "data")
    
    HOST: str = "127.0.0.1"
    PORT: int = 8000

    class Config:
        extra = "ignore"

settings = Settings()
