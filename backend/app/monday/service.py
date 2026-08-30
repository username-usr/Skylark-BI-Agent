import logging
from typing import Optional, Dict, Any, List
from app.config import settings
from app.monday.schemas import MondayBoard
from app.monday.mcp_client import MondayMCPClient
from app.monday.api_fallback import MondayAPIFallback

logger = logging.getLogger(__name__)

class MondayService:
    def __init__(self):
        self.mcp_client = MondayMCPClient()
        self.api_fallback = MondayAPIFallback()
        self._deals_board_id: Optional[str] = settings.DEALS_BOARD_ID
        self._wo_board_id: Optional[str] = settings.WORK_ORDERS_BOARD_ID
        self._discovered = False

    async def _auto_discover_board_ids(self):
        if self._discovered or not settings.MONDAY_API_KEY:
            return
        
        boards = []
        # Try discovering via MCP all_api_read tool first
        try:
            query = "query { boards (limit: 50) { id name } }"
            data = await self.mcp_client.execute_mcp_query(query)
            boards = data.get("boards", [])
        except Exception as e:
            logger.info(f"MCP discovery fallback: {e}")
            boards = await self.api_fallback.discover_boards()

        for b in boards:
            b_name = b.get("name", "").lower().replace("-", " ")
            b_id = str(b.get("id"))
            if not self._deals_board_id and ("deal" in b_name or "pipeline" in b_name or "funnel" in b_name):
                self._deals_board_id = b_id
                logger.info(f"Auto-discovered Deals Board ID: {b_id} ({b.get('name')})")
            elif not self._wo_board_id and ("work" in b_name or "order" in b_name or "tracker" in b_name):
                self._wo_board_id = b_id
                logger.info(f"Auto-discovered Work Orders Board ID: {b_id} ({b.get('name')})")
        self._discovered = True

    async def get_deals_board(self) -> MondayBoard:
        await self._auto_discover_board_ids()
        board_id = self._deals_board_id or settings.DEALS_BOARD_ID

        if settings.MONDAY_API_KEY and board_id:
            # 1. Try MCP Protocol
            try:
                board = await self.mcp_client.fetch_board_via_mcp(board_id)
                if board and len(board.items) > 0:
                    return board
            except Exception as e:
                logger.info(f"MCP fetch failed ({e}). Proceeding to GraphQL.")

            # 2. Try GraphQL Protocol
            try:
                return await self.api_fallback.fetch_board_graphql(board_id)
            except Exception as e:
                logger.warning(f"GraphQL fetch failed ({e}). Using local fallback data.")

        return self.api_fallback.load_deals_from_local()

    async def get_work_orders_board(self) -> MondayBoard:
        await self._auto_discover_board_ids()
        board_id = self._wo_board_id or settings.WORK_ORDERS_BOARD_ID

        if settings.MONDAY_API_KEY and board_id:
            # 1. Try MCP Protocol
            try:
                board = await self.mcp_client.fetch_board_via_mcp(board_id)
                if board and len(board.items) > 0:
                    return board
            except Exception as e:
                logger.info(f"MCP fetch failed ({e}). Proceeding to GraphQL.")

            # 2. Try GraphQL Protocol
            try:
                return await self.api_fallback.fetch_board_graphql(board_id)
            except Exception as e:
                logger.warning(f"GraphQL fetch failed ({e}). Using local fallback data.")

        return self.api_fallback.load_work_orders_from_local()

    async def test_connection(self) -> Dict[str, Any]:
        await self._auto_discover_board_ids()
        status = {
            "mcp_url": settings.MONDAY_MCP_URL,
            "has_api_key": bool(settings.MONDAY_API_KEY),
            "deals_board": False,
            "work_orders_board": False,
            "deals_item_count": 0,
            "work_orders_item_count": 0,
            "source": "unknown"
        }

        try:
            deals = await self.get_deals_board()
            status["deals_board"] = True
            status["deals_item_count"] = len(deals.items)
            status["source"] = "Monday MCP Live" if settings.MONDAY_API_KEY else "Local Dataset (Deals)"
        except Exception as e:
            status["deals_error"] = str(e)

        try:
            wo = await self.get_work_orders_board()
            status["work_orders_board"] = True
            status["work_orders_item_count"] = len(wo.items)
        except Exception as e:
            status["wo_error"] = str(e)

        return status
