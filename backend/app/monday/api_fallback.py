import os
import logging
from typing import Dict, Any, Optional, List
import pandas as pd
import httpx
from app.config import settings
from app.monday.schemas import MondayBoard, MondayItem, MondayColumn, MondayColumnValue

logger = logging.getLogger(__name__)

class MondayAPIFallback:
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or settings.MONDAY_API_KEY
        self.graphql_url = settings.MONDAY_GRAPHQL_URL

    async def discover_boards(self) -> List[Dict[str, Any]]:
        """Discover live boards from Monday GraphQL API."""
        if not self.api_key:
            return []

        query = """
        query {
          boards (limit: 50) {
            id
            name
          }
        }
        """
        headers = {
            "Authorization": self.api_key,
            "Content-Type": "application/json",
            "API-Version": "2024-01"
        }

        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                res = await client.post(self.graphql_url, json={"query": query}, headers=headers)
                res.raise_for_status()
                data = res.json()
                return data.get("data", {}).get("boards", [])
        except Exception as e:
            logger.warning(f"Failed to discover boards via GraphQL: {e}")
            return []

    async def fetch_board_graphql(self, board_id: str) -> MondayBoard:
        if not self.api_key:
            raise ValueError("MONDAY_API_KEY is not configured.")

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
        headers = {
            "Authorization": self.api_key,
            "Content-Type": "application/json",
            "API-Version": "2024-01"
        }
        payload = {
            "query": query,
            "variables": {"board_id": [str(board_id)]}
        }

        async with httpx.AsyncClient(timeout=30.0) as client:
            res = await client.post(self.graphql_url, json=payload, headers=headers)
            res.raise_for_status()
            data = res.json()
            
            if "errors" in data:
                raise RuntimeError(f"Monday GraphQL error: {data['errors']}")
            
            boards = data.get("data", {}).get("boards", [])
            if not boards:
                raise ValueError(f"Board ID {board_id} not found.")

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

    def load_deals_from_local(self) -> MondayBoard:
        file_path = os.path.join(settings.DATA_DIR, "Deal funnel Data.xlsx")
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"Local Deals file not found at {file_path}")

        df = pd.read_excel(file_path, sheet_name=0)
        columns = [MondayColumn(id=col, title=col, type="text") for col in df.columns]
        
        items = []
        for idx, row in df.iterrows():
            deal_name = str(row.get("Deal Name", f"Deal {idx+1}")).strip()
            col_vals = {}
            for col in df.columns:
                val = row[col]
                text_val = "" if pd.isna(val) else str(val).strip()
                col_vals[col] = MondayColumnValue(
                    id=col,
                    title=col,
                    text=text_val,
                    value=val if not pd.isna(val) else None
                )
            items.append(MondayItem(id=f"deal_{idx+1}", name=deal_name, column_values=col_vals))

        return MondayBoard(
            id="deals_local",
            name="Deals",
            columns=columns,
            items=items
        )

    def load_work_orders_from_local(self) -> MondayBoard:
        file_path = os.path.join(settings.DATA_DIR, "Work_Order_Tracker Data.xlsx")
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"Local Work Orders file not found at {file_path}")

        df = pd.read_excel(file_path, sheet_name=0)
        columns = [MondayColumn(id=col, title=col, type="text") for col in df.columns]

        items = []
        for idx, row in df.iterrows():
            wo_name = str(row.get("Deal name masked", f"WO {idx+1}")).strip()
            col_vals = {}
            for col in df.columns:
                val = row[col]
                text_val = "" if pd.isna(val) else str(val).strip()
                col_vals[col] = MondayColumnValue(
                    id=col,
                    title=col,
                    text=text_val,
                    value=val if not pd.isna(val) else None
                )
            items.append(MondayItem(id=f"wo_{idx+1}", name=wo_name, column_values=col_vals))

        return MondayBoard(
            id="work_orders_local",
            name="Work Orders",
            columns=columns,
            items=items
        )
