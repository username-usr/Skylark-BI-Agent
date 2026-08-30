import json
import logging
from typing import Dict, Any, Optional, List
import httpx
from app.config import settings
from app.monday.schemas import MondayBoard, MondayItem, MondayColumn, MondayColumnValue

logger = logging.getLogger(__name__)

class MondayMCPClient:
    def __init__(self, mcp_url: Optional[str] = None, api_key: Optional[str] = None):
        self.mcp_url = mcp_url or settings.MONDAY_MCP_URL
        self.api_key = api_key or settings.MONDAY_API_KEY
        self._request_id = 0

    def _headers(self) -> Dict[str, str]:
        headers = {
            "Content-Type": "application/json",
            "Accept": "application/json, text/event-stream"
        }
        if self.api_key:
            headers["Authorization"] = self.api_key
            headers["x-api-key"] = self.api_key
        return headers

    async def _jsonrpc_call(self, method: str, params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        self._request_id += 1
        payload = {
            "jsonrpc": "2.0",
            "id": self._request_id,
            "method": method,
            "params": params or {}
        }
        
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.post(self.mcp_url, headers=self._headers(), json=payload)
            response.raise_for_status()
            res_data = response.json()
            if "error" in res_data:
                raise RuntimeError(f"Monday MCP error: {res_data['error']}")
            return res_data.get("result", {})

    async def list_tools(self) -> List[Dict[str, Any]]:
        result = await self._jsonrpc_call("tools/list")
        return result.get("tools", [])

    async def call_tool(self, tool_name: str, arguments: Dict[str, Any]) -> Dict[str, Any]:
        params = {
            "name": tool_name,
            "arguments": arguments
        }
        return await self._jsonrpc_call("tools/call", params)

    async def execute_mcp_query(self, query: str, variables: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Executes read-only GraphQL queries directly through Monday Hosted MCP tool 'all_api_read'."""
        args = {
            "query": query,
            "variables": json.dumps(variables or {})
        }
        result = await self.call_tool("all_api_read", args)
        
        if "structuredContent" in result:
            return result["structuredContent"]
        
        # Parse content text
        for item in result.get("content", []):
            if item.get("type") == "text":
                try:
                    return json.loads(item["text"])
                except Exception:
                    pass
        return result

    async def fetch_board_via_mcp(self, board_id: str) -> MondayBoard:
        """Fetches board metadata and items using Monday Hosted MCP."""
        query = """
        query ($board_id: [ID!]) {
          boards (ids: $board_id) {
            id
            name
            columns {
              id
              title
              type
            }
            items_page (limit: 500) {
              items {
                id
                name
                column_values {
                  id
                  text
                  value
                  type
                }
              }
            }
          }
        }
        """
        data = await self.execute_mcp_query(query, {"board_id": [str(board_id)]})
        boards = data.get("boards", [])
        if not boards:
            raise ValueError(f"Board ID {board_id} not found via MCP.")

        board_data = boards[0]
        columns = [MondayColumn(**col) for col in board_data.get("columns", [])]
        col_id_to_title = {col.id: col.title for col in columns}

        items = []
        items_raw = board_data.get("items_page", {}).get("items", [])
        for item in items_raw:
            col_vals = {}
            for cv in item.get("column_values", []):
                c_id = cv.get("id")
                title = col_id_to_title.get(c_id, c_id)
                col_vals[title] = MondayColumnValue(
                    id=c_id,
                    title=title,
                    text=cv.get("text"),
                    value=cv.get("value")
                )
            items.append(MondayItem(id=str(item["id"]), name=item["name"], column_values=col_vals))

        return MondayBoard(
            id=str(board_data["id"]),
            name=board_data["name"],
            columns=columns,
            items=items
        )
