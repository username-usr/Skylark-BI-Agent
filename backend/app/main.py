from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.api import chat, health, boards

app = FastAPI(
    title="Monday.com Business Intelligence Agent API",
    description="Founder-level BI Decision Support Agent for Skylark Drones using Monday.com data",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router, prefix="/api", tags=["Health"])
app.include_router(chat.router, prefix="/api", tags=["Chat"])
app.include_router(boards.router, prefix="/api", tags=["Boards"])

@app.get("/")
async def root():
    return {
        "message": "Monday.com Business Intelligence Agent API is running",
        "docs": "/docs",
        "health": "/api/health"
    }

