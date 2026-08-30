from typing import List, Dict, Any
from app.monday.schemas import MondayBoard
from app.normalization.normalizers import normalize_currency, normalize_date

class DataQualityAudit:
    @staticmethod
    def audit_deals_board(board: MondayBoard) -> Dict[str, Any]:
        total_items = len(board.items)
        missing_value_count = 0
        missing_close_date_count = 0
        missing_client_code_count = 0
        issues = []

        for item in board.items:
            val_text = item.get_value("Masked Deal value")
            _, is_val_missing, _ = normalize_currency(val_text)
            if is_val_missing:
                missing_value_count += 1
                issues.append({
                    "item_id": item.id,
                    "item_name": item.name,
                    "issue_type": "MISSING_DEAL_VALUE",
                    "description": f"Deal '{item.name}' has no numeric deal value specified."
                })

            close_date_text = item.get_value("Tentative Close Date") or item.get_value("Close Date (A)")
            _, _, is_date_missing, _ = normalize_date(close_date_text)
            if is_date_missing:
                missing_close_date_count += 1
                issues.append({
                    "item_id": item.id,
                    "item_name": item.name,
                    "issue_type": "MISSING_CLOSE_DATE",
                    "description": f"Deal '{item.name}' has no tentative or actual close date."
                })

            client_code = item.get_value("Client Code")
            if not client_code or client_code.upper() in ["NONE", "NULL", "N/A", ""]:
                missing_client_code_count += 1

        return {
            "total_deals": total_items,
            "missing_deal_values": missing_value_count,
            "missing_close_dates": missing_close_date_count,
            "missing_client_codes": missing_client_code_count,
            "issues": issues
        }

    @staticmethod
    def audit_work_orders_board(board: MondayBoard) -> Dict[str, Any]:
        total_items = len(board.items)
        unbilled_completed_work = 0
        contradictory_records = []
        issues = []

        for item in board.items:
            exec_status = (item.get_value("Execution Status") or "").strip()
            billing_status = (item.get_value("Billing Status") or "").strip()
            billed_val_text = item.get_value("Billed Value in Rupees (Excl of GST.) (Masked)")
            
            billed_val, is_billed_missing, _ = normalize_currency(billed_val_text)

            if exec_status.lower() in ["completed", "executed until current month"]:
                if is_billed_missing or (billed_val is not None and billed_val == 0):
                    unbilled_completed_work += 1
                    issues.append({
                        "item_id": item.id,
                        "item_name": item.name,
                        "issue_type": "UNBILLED_COMPLETED_WORK",
                        "description": f"Work order '{item.name}' is marked '{exec_status}', but billed value is 0 or missing."
                    })

            if exec_status.lower() == "completed" and billing_status.lower() == "update required":
                contradictory_records.append({
                    "item_id": item.id,
                    "item_name": item.name,
                    "issue_type": "CONTRADICTORY_STATUS",
                    "description": f"Work order '{item.name}' is marked Completed, but Billing Status is 'Update Required'."
                })

        return {
            "total_work_orders": total_items,
            "unbilled_completed_work_count": unbilled_completed_work,
            "contradictory_record_count": len(contradictory_records),
            "contradictory_records": contradictory_records,
            "issues": issues
        }

