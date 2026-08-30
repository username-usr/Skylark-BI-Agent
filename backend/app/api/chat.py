from typing import Dict, Any, Optional, List
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.agent.engine import AgentEngine

router = APIRouter()
agent_engine = AgentEngine()

class ChatRequest(BaseModel):
    message: str

class MetricWidget(BaseModel):
    title: str
    value: str
    subtext: Optional[str] = None
    type: str = "neutral"

class WarningWidget(BaseModel):
    type: str
    message: str

class TableWidget(BaseModel):
    title: str
    headers: List[str]
    rows: List[List[Any]]

class ChatResponse(BaseModel):
    answer: str
    metrics: List[MetricWidget] = []
    warnings: List[WarningWidget] = []
    table: Optional[TableWidget] = None

@router.post("/chat", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest):
    if not request.message or not request.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty.")
        
    try:
        res = await agent_engine.process_query(request.message)
        return ChatResponse(**res)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Agent Error: {str(e)}")

