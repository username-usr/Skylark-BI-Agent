from fastapi import APIRouter
from app.monday.service import MondayService

router = APIRouter()
monday_service = MondayService()

@router.get("/health")
async def health_check():
    conn_status = await monday_service.test_connection()
    return {
        "status": "healthy",
        "monday_connection": conn_status
    }

