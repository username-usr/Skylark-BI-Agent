from typing import Dict, Any, List, Optional
from app.monday.schemas import MondayBoard
from app.normalization.normalizers import normalize_sector

class OperationsAnalytics:
    @classmethod
    def analyze_operations(
        cls, 
        board: MondayBoard,
        sector_filter: Optional[str] = None
    ) -> Dict[str, Any]:
        
        total_wos = 0
        status_counts: Dict[str, int] = {}
        sector_counts: Dict[str, int] = {}
        nature_counts: Dict[str, int] = {}
        wo_items = []

        for item in board.items:
            sector = normalize_sector(item.get_value("Sector"))
            exec_status = (item.get_value("Execution Status") or "Unspecified").strip()
            nature = (item.get_value("Nature of Work") or "Unspecified").strip()

            if sector_filter and sector_filter.lower() not in sector.lower():
                continue

            total_wos += 1
            status_counts[exec_status] = status_counts.get(exec_status, 0) + 1
            sector_counts[sector] = sector_counts.get(sector, 0) + 1
            nature_counts[nature] = nature_counts.get(nature, 0) + 1

            wo_items.append({
                "id": item.id,
                "name": item.name,
                "customer": item.get_value("Customer Name Code") or "N/A",
                "sector": sector,
                "execution_status": exec_status,
                "nature_of_work": nature,
                "po_date": item.get_value("Date of PO/LOI") or "N/A",
                "delivery_date": item.get_value("Data Delivery Date") or "N/A"
            })

        return {
            "summary": {
                "total_work_orders": total_wos,
                "completed_count": status_counts.get("Completed", 0),
                "in_progress_count": status_counts.get("Executed until current month", 0),
                "not_started_count": status_counts.get("Not Started", 0)
            },
            "status_breakdown": [
                {"status": k, "count": v} for k, v in sorted(status_counts.items(), key=lambda x: x[1], reverse=True)
            ],
            "sector_breakdown": [
                {"sector": k, "count": v} for k, v in sorted(sector_counts.items(), key=lambda x: x[1], reverse=True)
            ],
            "nature_of_work_breakdown": [
                {"nature": k, "count": v} for k, v in sorted(nature_counts.items(), key=lambda x: x[1], reverse=True)
            ],
            "recent_work_orders": wo_items[:10]
        }

