from typing import Dict, Any, List, Optional
from app.monday.schemas import MondayBoard
from app.normalization.normalizers import normalize_currency, normalize_sector
from app.analytics.pipeline import PipelineAnalytics

class BillingAnalytics:
    @classmethod
    def analyze_billing_and_collections(
        cls, 
        board: MondayBoard,
        customer_filter: Optional[str] = None,
        sector_filter: Optional[str] = None
    ) -> Dict[str, Any]:

        total_contract_value = 0.0
        total_billed_value = 0.0
        total_collected = 0.0
        total_receivable = 0.0
        unbilled_completed_value = 0.0
        unbilled_completed_count = 0

        ar_priority_accounts: Dict[str, float] = {}
        customer_breakdown: Dict[str, Dict[str, float]] = {}

        for item in board.items:
            customer = (item.get_value("Customer Name Code") or "UNKNOWN").strip().upper()
            sector = normalize_sector(item.get_value("Sector"))
            exec_status = (item.get_value("Execution Status") or "").strip()
            ar_priority = (item.get_value("AR Priority account") or "").strip()

            if customer_filter and customer_filter.upper() not in customer:
                continue
            if sector_filter and sector_filter.lower() not in sector.lower():
                continue

            contract_amt, _, _ = normalize_currency(item.get_value("Amount in Rupees (Excl of GST) (Masked)"))
            billed_val, is_billed_missing, _ = normalize_currency(item.get_value("Billed Value in Rupees (Excl of GST.) (Masked)"))
            collected_amt, _, _ = normalize_currency(item.get_value("Collected Amount in Rupees (Incl of GST.) (Masked)"))
            receivable_amt, _, _ = normalize_currency(item.get_value("Amount Receivable (Masked)"))

            contract_amt = contract_amt or 0.0
            billed_val = billed_val or 0.0
            collected_amt = collected_amt or 0.0
            receivable_amt = receivable_amt or 0.0

            total_contract_value += contract_amt
            total_billed_value += billed_val
            total_collected += collected_amt
            total_receivable += receivable_amt

            if exec_status.lower() in ["completed", "executed until current month"]:
                if is_billed_missing or billed_val == 0:
                    unbilled_completed_count += 1
                    unbilled_completed_value += contract_amt

            if receivable_amt > 0 and (ar_priority or receivable_amt >= 5_00_000):
                ar_priority_accounts[customer] = ar_priority_accounts.get(customer, 0.0) + receivable_amt

            if customer not in customer_breakdown:
                customer_breakdown[customer] = {
                    "contract_value": 0.0,
                    "billed_value": 0.0,
                    "collected_amount": 0.0,
                    "amount_receivable": 0.0
                }
            customer_breakdown[customer]["contract_value"] += contract_amt
            customer_breakdown[customer]["billed_value"] += billed_val
            customer_breakdown[customer]["collected_amount"] += collected_amt
            customer_breakdown[customer]["amount_receivable"] += receivable_amt

        sorted_ar = [
            {
                "customer_code": k,
                "amount_receivable": v,
                "amount_receivable_formatted": PipelineAnalytics.format_inr(v)
            }
            for k, v in sorted(ar_priority_accounts.items(), key=lambda x: x[1], reverse=True)
        ]

        return {
            "summary": {
                "total_contract_value": total_contract_value,
                "total_contract_value_formatted": PipelineAnalytics.format_inr(total_contract_value),
                "total_billed_value": total_billed_value,
                "total_billed_value_formatted": PipelineAnalytics.format_inr(total_billed_value),
                "total_collected": total_collected,
                "total_collected_formatted": PipelineAnalytics.format_inr(total_collected),
                "total_receivable": total_receivable,
                "total_receivable_formatted": PipelineAnalytics.format_inr(total_receivable),
                "unbilled_completed_count": unbilled_completed_count,
                "unbilled_completed_value": unbilled_completed_value,
                "unbilled_completed_value_formatted": PipelineAnalytics.format_inr(unbilled_completed_value)
            },
            "top_ar_accounts": sorted_ar[:10],
            "customer_breakdown": [
                {
                    "customer_code": k,
                    "contract_value_formatted": PipelineAnalytics.format_inr(v["contract_value"]),
                    "billed_value_formatted": PipelineAnalytics.format_inr(v["billed_value"]),
                    "collected_formatted": PipelineAnalytics.format_inr(v["collected_amount"]),
                    "receivable_formatted": PipelineAnalytics.format_inr(v["amount_receivable"]),
                    "receivable_numeric": v["amount_receivable"]
                }
                for k, v in sorted(customer_breakdown.items(), key=lambda x: x[1]["amount_receivable"], reverse=True)[:15]
            ]
        }

