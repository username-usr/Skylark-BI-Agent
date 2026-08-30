from fastapi import APIRouter
from app.monday.service import MondayService
from app.normalization.data_quality import DataQualityAudit

router = APIRouter()
monday_service = MondayService()

@router.get("/boards/audit")
async def boards_audit():
    deals_board = await monday_service.get_deals_board()
    wo_board = await monday_service.get_work_orders_board()

    dq_deals = DataQualityAudit.audit_deals_board(deals_board)
    dq_wo = DataQualityAudit.audit_work_orders_board(wo_board)

    return {
        "deals_board": {
            "name": deals_board.name,
            "column_count": len(deals_board.columns),
            "item_count": len(deals_board.items),
            "audit": dq_deals
        },
        "work_orders_board": {
            "name": wo_board.name,
            "column_count": len(wo_board.columns),
            "item_count": len(wo_board.items),
            "audit": dq_wo
        }
    }

