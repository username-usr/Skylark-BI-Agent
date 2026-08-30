from typing import List, Dict, Any

BI_TOOLS_DECLARATIONS = [
    {
        "name": "get_pipeline_summary",
        "description": "Analyze sales deals pipeline, total pipeline value, weighted pipeline value, stage breakdown, and sector breakdown.",
        "parameters": {
            "type": "OBJECT",
            "properties": {
                "sector": {
                    "type": "STRING",
                    "description": "Optional sector name to filter (e.g., Mining, Powerline, Solar, Infrastructure)"
                },
                "stage": {
                    "type": "STRING",
                    "description": "Optional deal stage filter"
                }
            }
        }
    },
    {
        "name": "get_operations_summary",
        "description": "Analyze Work Orders operational execution status, project completion, and delivery performance.",
        "parameters": {
            "type": "OBJECT",
            "properties": {
                "sector": {
                    "type": "STRING",
                    "description": "Optional sector filter"
                }
            }
        }
    },
    {
        "name": "get_billing_and_collections_summary",
        "description": "Analyze billing, collections, accounts receivable (AR), unbilled completed work, and top priority AR accounts.",
        "parameters": {
            "type": "OBJECT",
            "properties": {
                "customer_code": {
                    "type": "STRING",
                    "description": "Optional customer identifier code"
                },
                "sector": {
                    "type": "STRING",
                    "description": "Optional sector filter"
                }
            }
        }
    },
    {
        "name": "get_cross_board_customer_health",
        "description": "Analyze cross-board customer 360 health, linking open deals with outstanding receivables, unbilled completed work, and sector execution matrix.",
        "parameters": {
            "type": "OBJECT",
            "properties": {
                "customer_code": {
                    "type": "STRING",
                    "description": "Optional customer identifier code"
                },
                "sector": {
                    "type": "STRING",
                    "description": "Optional sector filter"
                }
            }
        }
    },
    {
        "name": "audit_data_quality",
        "description": "Audit data quality issues, missing deal values, missing close dates, and status contradictions across Deals and Work Orders boards.",
        "parameters": {
            "type": "OBJECT",
            "properties": {}
        }
    }
]

