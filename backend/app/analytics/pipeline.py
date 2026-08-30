from typing import Dict, Any, List, Optional
from app.monday.schemas import MondayBoard
from app.normalization.normalizers import (
    normalize_currency, normalize_sector, normalize_probability
)

class PipelineAnalytics:
    @staticmethod
    def format_inr(amount: float) -> str:
        if amount is None or amount == 0:
            return "₹0"
        abs_amt = abs(amount)
        if abs_amt >= 10_00_000:
            val_cr = amount / 10_00_000
            return f"₹{val_cr:.2f} Cr"
        elif abs_amt >= 1_00_000:
            val_lakh = amount / 1_00_000
            return f"₹{val_lakh:.2f} Lakhs"
        else:
            return f"₹{amount:,.0f}"

    @classmethod
    def analyze_pipeline(
        cls, 
        board: MondayBoard, 
        sector_filter: Optional[str] = None,
        stage_filter: Optional[str] = None
    ) -> Dict[str, Any]:
        
        total_deals = 0
        open_deals = 0
        total_pipeline_value = 0.0
        weighted_pipeline_value = 0.0
        excluded_deals_missing_val = 0

        stages: Dict[str, Dict[str, Any]] = {}
        sectors: Dict[str, Dict[str, Any]] = {}
        deal_list = []

        for item in board.items:
            status = (item.get_value("Deal Status") or "Open").strip()
            sector = normalize_sector(item.get_value("Sector/service"))
            stage = (item.get_value("Deal Stage") or "Unspecified Stage").strip()
            prob_str = item.get_value("Closure Probability")
            prob_val = normalize_probability(prob_str)

            if sector_filter and sector_filter.lower() not in sector.lower():
                continue
            if stage_filter and stage_filter.lower() not in stage.lower():
                continue

            total_deals += 1

            val_text = item.get_value("Masked Deal value")
            deal_val, is_val_missing, _ = normalize_currency(val_text)

            if is_val_missing or deal_val is None:
                excluded_deals_missing_val += 1
                deal_val = 0.0

            weighted_val = deal_val * prob_val

            if status.lower() in ["open", "sales qualified", "proposal sent"]:
                open_deals += 1
                total_pipeline_value += deal_val
                weighted_pipeline_value += weighted_val

            if stage not in stages:
                stages[stage] = {"count": 0, "total_value": 0.0, "weighted_value": 0.0}
            stages[stage]["count"] += 1
            stages[stage]["total_value"] += deal_val
            stages[stage]["weighted_value"] += weighted_val

            if sector not in sectors:
                sectors[sector] = {"count": 0, "total_value": 0.0, "weighted_value": 0.0}
            sectors[sector]["count"] += 1
            sectors[sector]["total_value"] += deal_val
            sectors[sector]["weighted_value"] += weighted_val

            deal_list.append({
                "id": item.id,
                "name": item.name,
                "client_code": item.get_value("Client Code") or "N/A",
                "sector": sector,
                "stage": stage,
                "status": status,
                "deal_value": deal_val,
                "deal_value_formatted": cls.format_inr(deal_val),
                "closure_probability": prob_str or "Medium",
                "tentative_close_date": item.get_value("Tentative Close Date") or "N/A"
            })

        formatted_stages = []
        for stg, data in stages.items():
            formatted_stages.append({
                "stage": stg,
                "count": data["count"],
                "total_value": data["total_value"],
                "total_value_formatted": cls.format_inr(data["total_value"]),
                "weighted_value": data["weighted_value"],
                "weighted_value_formatted": cls.format_inr(data["weighted_value"])
            })

        formatted_stages.sort(key=lambda x: x["total_value"], reverse=True)

        return {
            "summary": {
                "total_deals_analyzed": total_deals,
                "open_deals_count": open_deals,
                "total_pipeline_value": total_pipeline_value,
                "total_pipeline_value_formatted": cls.format_inr(total_pipeline_value),
                "weighted_pipeline_value": weighted_pipeline_value,
                "weighted_pipeline_value_formatted": cls.format_inr(weighted_pipeline_value),
                "excluded_deals_missing_val": excluded_deals_missing_val
            },
            "stage_breakdown": formatted_stages,
            "sector_breakdown": [
                {
                    "sector": s,
                    "count": d["count"],
                    "total_value": d["total_value"],
                    "total_value_formatted": cls.format_inr(d["total_value"])
                } for s, d in sorted(sectors.items(), key=lambda x: x[1]["total_value"], reverse=True)
            ],
            "top_deals": sorted(deal_list, key=lambda x: x["deal_value"], reverse=True)[:10]
        }

