import re
from typing import Dict, Any, List, Optional
from app.monday.schemas import MondayBoard
from app.normalization.normalizers import normalize_currency, normalize_sector, normalize_customer_code
from app.analytics.pipeline import PipelineAnalytics

class CrossBoardAnalytics:
    @staticmethod
    def _clean_id(raw_str: str) -> str:
        if not raw_str:
            return ""
        digits = re.sub(r"[^\d]", "", str(raw_str))
        if digits:
            return digits.lstrip("0") or "0"
        return raw_str.upper().strip()

    @classmethod
    def analyze_cross_board_health(
        cls, 
        deals_board: MondayBoard, 
        work_orders_board: MondayBoard,
        customer_filter: Optional[str] = None,
        sector_filter: Optional[str] = None
    ) -> Dict[str, Any]:

        customer_deals: Dict[str, List[Dict[str, Any]]] = {}
        sector_deals: Dict[str, Dict[str, Any]] = {}

        for item in deals_board.items:
            client_code = normalize_customer_code(item.get_value("Client Code"))
            cust_id = cls._clean_id(client_code)
            sector = normalize_sector(item.get_value("Sector/service"))
            status = (item.get_value("Deal Status") or "Open").strip()
            
            val_text = item.get_value("Masked Deal value")
            deal_val, _, _ = normalize_currency(val_text)
            deal_val = deal_val or 0.0

            if customer_filter and customer_filter.upper() not in client_code:
                continue
            if sector_filter and sector_filter.lower() not in sector.lower():
                continue

            deal_info = {
                "id": item.id,
                "name": item.name,
                "client_code": client_code,
                "sector": sector,
                "status": status,
                "deal_value": deal_val,
                "stage": item.get_value("Deal Stage") or "N/A"
            }

            if cust_id not in customer_deals:
                customer_deals[cust_id] = []
            customer_deals[cust_id].append(deal_info)

            if sector not in sector_deals:
                sector_deals[sector] = {"deal_count": 0, "open_pipeline": 0.0}
            sector_deals[sector]["deal_count"] += 1
            if status.lower() == "open":
                sector_deals[sector]["open_pipeline"] += deal_val

        customer_wos: Dict[str, List[Dict[str, Any]]] = {}
        sector_wos: Dict[str, Dict[str, Any]] = {}

        for item in work_orders_board.items:
            customer_code = normalize_customer_code(item.get_value("Customer Name Code"))
            cust_id = cls._clean_id(customer_code)
            sector = normalize_sector(item.get_value("Sector"))
            exec_status = (item.get_value("Execution Status") or "").strip()

            contract_amt, _, _ = normalize_currency(item.get_value("Amount in Rupees (Excl of GST) (Masked)"))
            billed_val, is_billed_missing, _ = normalize_currency(item.get_value("Billed Value in Rupees (Excl of GST.) (Masked)"))
            receivable_amt, _, _ = normalize_currency(item.get_value("Amount Receivable (Masked)"))

            contract_amt = contract_amt or 0.0
            billed_val = billed_val or 0.0
            receivable_amt = receivable_amt or 0.0

            if customer_filter and customer_filter.upper() not in customer_code:
                continue
            if sector_filter and sector_filter.lower() not in sector.lower():
                continue

            wo_info = {
                "id": item.id,
                "name": item.name,
                "customer_code": customer_code,
                "sector": sector,
                "execution_status": exec_status,
                "contract_amt": contract_amt,
                "billed_val": billed_val,
                "receivable_amt": receivable_amt,
                "is_unbilled_completed": exec_status.lower() in ["completed", "executed until current month"] and (is_billed_missing or billed_val == 0)
            }

            if cust_id not in customer_wos:
                customer_wos[cust_id] = []
            customer_wos[cust_id].append(wo_info)

            if sector not in sector_wos:
                sector_wos[sector] = {"wo_count": 0, "total_receivables": 0.0, "unbilled_completed_val": 0.0}
            sector_wos[sector]["wo_count"] += 1
            sector_wos[sector]["total_receivables"] += receivable_amt
            if wo_info["is_unbilled_completed"]:
                sector_wos[sector]["unbilled_completed_val"] += contract_amt

        customer_360 = []
        all_cust_ids = set(customer_deals.keys()).union(set(customer_wos.keys()))

        for cid in all_cust_ids:
            deals = customer_deals.get(cid, [])
            wos = customer_wos.get(cid, [])
            
            open_pipeline = sum(d["deal_value"] for d in deals if d["status"].lower() == "open")
            total_ar = sum(w["receivable_amt"] for w in wos)
            unbilled_val = sum(w["contract_amt"] for w in wos if w["is_unbilled_completed"])
            
            client_name = deals[0]["client_code"] if deals else (wos[0]["customer_code"] if wos else f"CLIENT_{cid}")

            if len(deals) > 0 or len(wos) > 0:
                customer_360.append({
                    "customer_id": cid,
                    "client_code": client_name,
                    "open_deals_count": len([d for d in deals if d["status"].lower() == "open"]),
                    "open_pipeline": open_pipeline,
                    "open_pipeline_formatted": PipelineAnalytics.format_inr(open_pipeline),
                    "work_orders_count": len(wos),
                    "total_receivables": total_ar,
                    "total_receivables_formatted": PipelineAnalytics.format_inr(total_ar),
                    "unbilled_completed_value": unbilled_val,
                    "unbilled_completed_formatted": PipelineAnalytics.format_inr(unbilled_val),
                    "risk_flag": bool(open_pipeline > 0 and (total_ar > 0 or unbilled_val > 0))
                })

        sector_matrix = []
        all_sectors = set(sector_deals.keys()).union(set(sector_wos.keys()))
        for sec in all_sectors:
            sd = sector_deals.get(sec, {"deal_count": 0, "open_pipeline": 0.0})
            sw = sector_wos.get(sec, {"wo_count": 0, "total_receivables": 0.0, "unbilled_completed_val": 0.0})
            sector_matrix.append({
                "sector": sec,
                "deal_count": sd["deal_count"],
                "open_pipeline": sd["open_pipeline"],
                "open_pipeline_formatted": PipelineAnalytics.format_inr(sd["open_pipeline"]),
                "work_order_count": sw["wo_count"],
                "total_receivables": sw["total_receivables"],
                "total_receivables_formatted": PipelineAnalytics.format_inr(sw["total_receivables"]),
                "unbilled_completed_value": sw["unbilled_completed_val"],
                "unbilled_completed_formatted": PipelineAnalytics.format_inr(sw["unbilled_completed_val"])
            })

        high_risk = [c for c in customer_360 if c["risk_flag"]]
        high_risk.sort(key=lambda x: (x["open_pipeline"] + x["total_receivables"]), reverse=True)

        return {
            "high_risk_customers_with_open_deals": high_risk[:10],
            "sector_cross_board_matrix": sorted(sector_matrix, key=lambda x: x["open_pipeline"], reverse=True),
            "customer_360_sample": sorted(customer_360, key=lambda x: x["open_pipeline"], reverse=True)[:15]
        }

