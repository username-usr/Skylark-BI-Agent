from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field

class MondayColumnValue(BaseModel):
    id: str
    title: str
    text: Optional[str] = None
    value: Optional[Any] = None

class MondayColumn(BaseModel):
    id: str
    title: str
    type: str

class MondayItem(BaseModel):
    id: str
    name: str
    column_values: Dict[str, MondayColumnValue] = Field(default_factory=dict)
    
    def get_value(self, title_or_id: str) -> Optional[str]:
        target = title_or_id.lower().strip()
        for key, col in self.column_values.items():
            if key.lower().strip() == target or col.title.lower().strip() == target:
                return col.text
        return None

class MondayBoard(BaseModel):
    id: str
    name: str
    columns: List[MondayColumn] = Field(default_factory=list)
    items: List[MondayItem] = Field(default_factory=list)

