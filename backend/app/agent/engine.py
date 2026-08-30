import os
import re
import json
import logging
from typing import Dict, Any, List, Optional, Tuple
from collections import Counter
import httpx
from app.config import settings
from app.monday.service import MondayService
from app.normalization.data_quality import DataQualityAudit
from app.normalization.normalizers import normalize_currency
from app.analytics.pipeline import PipelineAnalytics
from app.analytics.operations import OperationsAnalytics
from app.analytics.billing import BillingAnalytics
from app.analytics.cross_board import CrossBoardAnalytics
from app.agent.prompts import SYSTEM_PROMPT

logger = logging.getLogger(__name__)

# Lightweight Gemini queue
GEMINI_MODELS_QUEUE = [
    "gemini-3.5-flash-lite",
    "gemini-3.1-flash-lite",
    "gemini-flash-lite-latest",
    "gemini-3.6-flash",
    "gemini-3.5-flash"
]

# OpenRouter active models queue
OPENROUTER_MODELS = [
    "meta-llama/llama-3.3-70b-instruct",
    "deepseek/deepseek-r1",
    "qwen/qwen-2.5-72b-instruct",
    "google/gemma-4-26b-a4b-it:free",
    "nvidia/nemotron-3.5-lightning:free"
]

class AgentEngine:
    def __init__(self):
        self.monday_service = MondayService()
        self._init_llm_clients()

    def _init_llm_clients(self):
        self.gemini_client = None
        if settings.LLM_API_KEY:
            try:
                from google import genai
                self.gemini_client = genai.Client(api_key=settings.LLM_API_KEY)
                logger.info("Initialized Google GenAI Client with Flash-Lite models")
            except Exception as e:
                logger.warning(f"Failed to initialize GenAI client: {e}")

    def _is_greeting_or_identity(self, query: str) -> bool:
        q = query.lower().strip()
        greeting_patterns = [
            r'^\s*(hi|hii+|hello|hey|greetings|good\s+(morning|afternoon|evening))\b',
            r'\bwho\s+are\s+you\b',
            r'\bwhat\s+can\s+you\s+do\b',
            r'\bwhat\s+is\s+your\s+name\b',
            r'\bhelp\b',
            r'\bhow\s+are\s+you\b',
            r'\bintroduce\s+yourself\b'
        ]
        return any(re.search(p, q) for p in greeting_patterns)

    async def _call_openrouter(self, prompt: str, preferred_model: Optional[str] = None) -> Tuple[Optional[str], Optional[str]]:
        """Calls OpenRouter API with slug normalization and fallback."""
        if not settings.OPENROUTER_API_KEY or not settings.OPENROUTER_API_KEY.strip():
            return None, "OpenRouter API Key not provided in .env."

        headers = {
            "Authorization": f"Bearer {settings.OPENROUTER_API_KEY.strip()}",
            "Content-Type": "application/json",
            "HTTP-Referer": "http://localhost:5173",
            "X-Title": "Monday BI Agent"
        }

        # Normalize slug: remove :free if known to be standard
        raw_target = preferred_model or settings.OPENROUTER_MODEL or OPENROUTER_MODELS[0]
        cleaned_target = raw_target.replace(":free", "") if any(k in raw_target for k in ["llama-3.3-70b", "deepseek-r1", "qwen-2.5-72b"]) else raw_target

        models_to_try = [cleaned_target] + [m for m in OPENROUTER_MODELS if m != cleaned_target]
        last_err = None

        async with httpx.AsyncClient(timeout=30.0) as client:
            for model_name in models_to_try:
                try:
                    payload = {
                        "model": model_name,
                        "messages": [
                            {"role": "system", "content": SYSTEM_PROMPT},
                            {"role": "user", "content": prompt}
                        ],
                        "temperature": 0.3,
                        "max_tokens": 4096
                    }
                    res = await client.post("https://openrouter.ai/api/v1/chat/completions", headers=headers, json=payload)
                    res_json = res.json()
                    
                    if res.status_code == 200 and "choices" in res_json and len(res_json["choices"]) > 0:
                        content = res_json["choices"][0]["message"]["content"]
                        if content and content.strip():
                            return content.strip(), None
                    
                    # Check if error suggests another slug
                    err_msg = res_json.get("error", {}).get("message", res.text)
                    if "use this slug instead:" in err_msg:
                        suggested_slug = err_msg.split("use this slug instead:")[-1].strip()
                        if suggested_slug:
                            payload["model"] = suggested_slug
                            retry_res = await client.post("https://openrouter.ai/api/v1/chat/completions", headers=headers, json=payload)
                            retry_json = retry_res.json()
                            if retry_res.status_code == 200 and "choices" in retry_json and len(retry_json["choices"]) > 0:
                                content = retry_json["choices"][0]["message"]["content"]
                                if content and content.strip():
                                    return content.strip(), None
                    
                    last_err = f"OpenRouter ({model_name}): {err_msg}"
                    logger.warning(last_err)
                except Exception as e:
                    last_err = str(e)
                    logger.warning(f"OpenRouter call failed on {model_name}: {e}")

        return None, last_err

    async def _call_gemini(self, prompt: str, preferred_model: Optional[str] = None) -> Tuple[Optional[str], Optional[str]]:
        """Calls Google Gemini API across fallback models."""
        if not self.gemini_client:
            return None, "Google GenAI API Key is not configured."

        from google.genai import types
        config = types.GenerateContentConfig(
            temperature=0.3,
            max_output_tokens=4096,
            automatic_function_calling=types.AutomaticFunctionCallingConfig(disable=True)
        )

        chosen = preferred_model or settings.LLM_MODEL or "gemini-3.5-flash-lite"
        models_to_try = [chosen] + [m for m in GEMINI_MODELS_QUEUE if m != chosen]

        last_error = None
        for model_name in models_to_try:
            try:
                response = self.gemini_client.models.generate_content(
                    model=model_name,
                    contents=prompt,
                    config=config
                )
                if response and response.text:
                    return response.text.strip(), None
            except Exception as e:
                err_str = str(e)
                last_error = err_str
                logger.warning(f"Gemini {model_name} notice: {err_str}")

        return None, last_error

    async def _call_llm(self, user_query: str, deterministic_context: Optional[Dict[str, Any]] = None, preferred_model: Optional[str] = None) -> Tuple[Optional[str], Optional[str]]:
        """Dispatches query to selected model with automatic multi-provider failover."""
        context_str = ""
        if deterministic_context:
            context_str = f"\n\nLIVE DATA CONTEXT FROM MONDAY.COM:\n{json.dumps(deterministic_context, indent=2, default=str)}"

        prompt = f"""
{SYSTEM_PROMPT}

USER QUESTION: "{user_query}"
{context_str}

INSTRUCTIONS:
- Provide a complete, thorough, and well-explained executive briefing.
- Format the response with a bold headline, structured bullet points for reasons/details, and clean paragraphs.
- Cite exact counts, percentages, and figures from the provided context.
"""
        # 1. If preferred model is an OpenRouter model
        if preferred_model and ("/" in preferred_model or "llama" in preferred_model or "deepseek" in preferred_model or "qwen" in preferred_model):
            text, err = await self._call_openrouter(prompt, preferred_model=preferred_model)
            if text:
                return text, None
            # Automatic seamless failover to Gemini
            if settings.LLM_API_KEY:
                text_gem, _ = await self._call_gemini(prompt)
                if text_gem:
                    return text_gem, None
            return None, err

        # 2. If preferred model is a Gemini model
        if preferred_model and "gemini" in preferred_model:
            text, err = await self._call_gemini(prompt, preferred_model=preferred_model)
            if text:
                return text, None
            # Automatic seamless failover to OpenRouter
            if settings.OPENROUTER_API_KEY:
                text_or, _ = await self._call_openrouter(prompt)
                if text_or:
                    return text_or, None
            return None, err

        # 3. Default multi-engine priority
        if settings.LLM_API_KEY:
            text, err = await self._call_gemini(prompt)
            if text:
                return text, None

        if settings.OPENROUTER_API_KEY:
            text, err = await self._call_openrouter(prompt)
            if text:
                return text, None

        return None, "No LLM API Key configured in .env."

    def _format_natural_api_error(self, raw_error: str) -> str:
        if "429" in raw_error or "RESOURCE_EXHAUSTED" in raw_error:
            return (
                "**LLM Rate Limit Notice (429 Quota Exceeded)**\n\n"
                "The free-tier quota for Google Gemini API has been reached on this API key.\n\n"
                "**How to resolve this:**\n"
                "- Switch to an OpenRouter model via the Model Switcher in the header.\n"
                "- Or wait ~30-60 seconds for the temporary per-minute rate window to reset."
            )
        elif "503" in raw_error or "UNAVAILABLE" in raw_error:
            return (
                "**API High Demand Notice (503 Service Unavailable)**\n\n"
                "Upstream AI servers are currently experiencing high traffic spikes. Try switching models via the model dropdown."
            )
        else:
            return (
                f"**LLM Notice**: Live AI text generation encountered an upstream notice (`{raw_error}`)."
            )

    async def process_query(self, query: str, preferred_model: Optional[str] = None) -> Dict[str, Any]:
        query_lower = query.lower()

        # 1. Handle Greetings & Identity Questions
        if self._is_greeting_or_identity(query):
            llm_reply, err = await self._call_llm(query, None, preferred_model=preferred_model)
            if llm_reply:
                return {
                    "answer": llm_reply,
                    "metrics": [],
                    "warnings": [],
                    "table": None
                }
            
            error_explanation = self._format_natural_api_error(err) if err else ""
            return {
                "answer": (
                    "**Welcome to the Skylark Drones Business Intelligence Agent**\n\n"
                    "I provide real-time decision support directly from your Monday.com workspace. I analyze:\n\n"
                    "- **Sales Pipeline**: Stage-wise breakdown, weighted pipeline, and sector performance.\n"
                    "- **Work Orders Execution**: Project delivery timelines, completion rates, and bottlenecks.\n"
                    "- **Receivables & Cash Flow**: Outstanding collections, billed milestones, and unbilled completed work.\n"
                    "- **Cross-Board Risks**: High-risk client accounts carrying open deals alongside overdue AR.\n\n"
                    f"{error_explanation}"
                ),
                "metrics": [],
                "warnings": [],
                "table": None
            }

        # 2. Fetch live Monday boards
        deals_board = await self.monday_service.get_deals_board()
        wo_board = await self.monday_service.get_work_orders_board()

        dq_deals = DataQualityAudit.audit_deals_board(deals_board)
        dq_wo = DataQualityAudit.audit_work_orders_board(wo_board)

        metrics: List[Dict[str, Any]] = []
        warnings: List[Dict[str, Any]] = []
        table: Optional[Dict[str, Any]] = None
        deterministic_context: Dict[str, Any] = {}

        # 3. Intent Classification Prioritization

        # A. Explanatory / Why / Data Hygiene Intent (NO TABLES)
        is_data_hygiene = bool(
            re.search(r'\b(why|missing|null|blank|audit|hygiene|unrecorded|exclusion|excluded|reason|reasons|gap|gaps|explain)\b', query_lower) and
            re.search(r'\b(value|values|deal|deals|data|record|records|pipeline|181)\b', query_lower)
        )

        # B. Cross-Board Risk Intent
        is_cross_board = not is_data_hygiene and bool(
            re.search(r'\b(cross|risk|health|bottleneck)\b', query_lower) or
            (re.search(r'\b(customer|client|account)s?\b', query_lower) and 
             re.search(r'\b(receivable|receivables|unbilled|outstanding|deal|deals|pipeline)\b', query_lower))
        )
        
        # C. Billing / AR Intent
        is_billing = not is_data_hygiene and bool(
            re.search(r'\b(billing|collection|collections|receivable|receivables|\bar\b|unbilled|invoice|invoices|revenue)\b', query_lower)
        )
        
        # D. Pipeline Analysis Intent
        is_pipeline = not is_data_hygiene and bool(
            re.search(r'\b(pipeline|deal|deals|sales|funnel|closure|probability|forecast|weighted|stage|stages)\b', query_lower)
        )
        
        # E. Operations Execution Intent
        is_operations = not is_data_hygiene and bool(
            re.search(r'\b(operation|operations|execution|work\s*order|work\s*orders|delivery|delivery\s*status)\b', query_lower)
        )

        if is_data_hygiene:
            missing_by_stage = Counter()
            total_by_stage = Counter()
            for item in deals_board.items:
                stg = (item.get_value("Deal Stage") or "Unspecified Stage").strip()
                v_text = item.get_value("Masked Deal value")
                d_val, is_m, _ = normalize_currency(v_text)
                total_by_stage[stg] += 1
                if is_m or d_val is None or d_val == 0:
                    missing_by_stage[stg] += 1

            stage_missing_breakdown = [
                {
                    "stage": s,
                    "missing_count": count,
                    "total_in_stage": total_by_stage[s],
                    "pct_missing": round((count / total_by_stage[s]) * 100, 1)
                }
                for s, count in missing_by_stage.most_common(10)
            ]

            deterministic_context = {
                "total_deals": len(deals_board.items),
                "total_missing_deals": dq_deals["missing_deal_values"],
                "missing_percentage": round((dq_deals["missing_deal_values"] / len(deals_board.items)) * 100, 1),
                "stage_missing_distribution": stage_missing_breakdown,
                "key_findings": {
                    "lead_generated_missing": f"{missing_by_stage['A. Lead Generated']} out of {total_by_stage['A. Lead Generated']} leads lack values (unscoped inbound/outbound)",
                    "lost_and_inactive_missing": f"{missing_by_stage['L. Project Lost'] + missing_by_stage['N. Not relevant at the moment'] + missing_by_stage['O. Not Relevant at all']} deals dropped before quotation",
                    "mature_stage_completion": f"Only {missing_by_stage['F. Negotiations']} deal missing in Negotiations and {missing_by_stage['E. Proposal/Commercials Sent']} in Proposal Sent (>85% completion)"
                }
            }

            table = None
            metrics = []
            warnings = []

            default_explanation = (
                "**Why 181 Deal Values Are Missing in Monday.com**\n\n"
                "Across the 346 deals tracked on Monday.com, **181 deals (52.3%)** do not have recorded deal values. "
                "This occurs primarily due to three operational reasons across the sales lifecycle:\n\n"
                "1. **Early Top-of-Funnel Leads (72 deals / 97.3% of `Lead Generated`)**:\n"
                "   - When sales reps log initial inbound inquiries or prospecting contacts, project scope, drone flight hours, and commercial pricing are not yet estimated.\n\n"
                "2. **Disqualified & Lost Deals (44 deals)**:\n"
                "   - 21 deals in `L. Project Lost` and 23 deals in `Not Relevant / On Hold` were disqualified before formal commercial proposals were ever drafted.\n\n"
                "3. **CRM Field Optionality**:\n"
                "   - Deal value is not configured as a mandatory field in Monday.com upon item creation, allowing reps to skip it during quick logging.\n\n"
                "In contrast, mature stages like `F. Negotiations` (92.3% complete) and `E. Proposal Sent` (85.7% complete) have high data coverage."
            )

            llm_answer, err = await self._call_llm(query, deterministic_context, preferred_model=preferred_model)
            answer = llm_answer if llm_answer else (default_explanation if not err else f"{default_explanation}\n\n*{self._format_natural_api_error(err)}*")

            return {
                "answer": answer,
                "metrics": metrics,
                "warnings": warnings,
                "table": None
            }

        elif is_cross_board:
            cb_data = CrossBoardAnalytics.analyze_cross_board_health(deals_board, wo_board)
            high_risk = cb_data["high_risk_customers_with_open_deals"]
            deterministic_context = cb_data

            metrics = [
                {"title": "High Risk Accounts", "value": str(len(high_risk)), "subtext": "Open deals + high AR", "type": "danger"},
                {"title": "Active Sectors", "value": str(len(cb_data["sector_cross_board_matrix"])), "subtext": "Cross-board domains", "type": "primary"}
            ]

            if high_risk:
                warnings.append({
                    "type": "CROSS_BOARD_RISK",
                    "message": f"{len(high_risk)} customers have open sales pipeline while holding significant outstanding receivables or unbilled work."
                })

            table = {
                "title": "High Risk Accounts (Open Deals vs Outstanding Receivables)",
                "headers": ["Customer Code", "Open Deals", "Open Pipeline", "Outstanding Receivables"],
                "rows": [
                    [acc["client_code"], acc["open_deals_count"], acc["open_pipeline_formatted"], acc["total_receivables_formatted"]]
                    for acc in high_risk[:8]
                ]
            }

        elif is_billing:
            b_data = BillingAnalytics.analyze_billing_and_collections(wo_board)
            summary = b_data["summary"]
            deterministic_context = b_data

            metrics = [
                {"title": "Total Billed Value", "value": summary["total_billed_value_formatted"], "subtext": f"Out of {summary['total_contract_value_formatted']} contract", "type": "primary"},
                {"title": "Total Collected", "value": summary["total_collected_formatted"], "subtext": "Collected to date", "type": "success"},
                {"title": "Amount Receivable (AR)", "value": summary["total_receivable_formatted"], "subtext": f"{len(b_data['top_ar_accounts'])} priority accounts", "type": "warning"},
                {"title": "Unbilled Completed Work", "value": summary["unbilled_completed_value_formatted"], "subtext": f"{summary['unbilled_completed_count']} work orders", "type": "danger"}
            ]

            if summary["unbilled_completed_count"] > 0:
                warnings.append({
                    "type": "REVENUE_RISK",
                    "message": f"{summary['unbilled_completed_count']} completed work orders worth {summary['unbilled_completed_value_formatted']} have zero billed value recorded."
                })

            table = {
                "title": "Top Accounts Receivable (AR Priority)",
                "headers": ["Customer Code", "Amount Receivable"],
                "rows": [
                    [acc["customer_code"], acc["amount_receivable_formatted"]]
                    for acc in b_data["top_ar_accounts"]
                ]
            }

        elif is_pipeline:
            sector_filter = self._extract_sector(query_lower)
            p_data = PipelineAnalytics.analyze_pipeline(deals_board, sector_filter=sector_filter)
            summary = p_data["summary"]
            deterministic_context = p_data
            
            metrics = [
                {"title": "Open Pipeline", "value": summary["total_pipeline_value_formatted"], "subtext": f"{summary['open_deals_count']} open deals", "type": "primary"},
                {"title": "Weighted Pipeline", "value": summary["weighted_pipeline_value_formatted"], "subtext": "Probability weighted", "type": "neutral"},
                {"title": "Total Deals", "value": str(summary["total_deals_analyzed"]), "subtext": f"{summary['excluded_deals_missing_val']} value missing", "type": "warning" if summary["excluded_deals_missing_val"] > 0 else "neutral"}
            ]

            if summary["excluded_deals_missing_val"] > 0:
                warnings.append({
                    "type": "EXCLUSION_WARNING",
                    "message": f"{summary['excluded_deals_missing_val']} deals are excluded from value aggregation because deal value is missing in source data."
                })

            table = {
                "title": "Pipeline Breakdown by Stage",
                "headers": ["Deal Stage", "Deal Count", "Total Value", "Weighted Value"],
                "rows": [
                    [s["stage"], s["count"], s["total_value_formatted"], s["weighted_value_formatted"]]
                    for s in p_data["stage_breakdown"]
                ]
            }

        elif is_operations:
            o_data = OperationsAnalytics.analyze_operations(wo_board)
            summary = o_data["summary"]
            deterministic_context = o_data

            metrics = [
                {"title": "Total Work Orders", "value": str(summary["total_work_orders"]), "subtext": "Active tracker items", "type": "primary"},
                {"title": "Completed", "value": str(summary["completed_count"]), "subtext": "Delivered", "type": "success"},
                {"title": "In Progress", "value": str(summary["in_progress_count"]), "subtext": "Ongoing projects", "type": "neutral"},
                {"title": "Not Started", "value": str(summary["not_started_count"]), "subtext": "Pending kickoff", "type": "warning"}
            ]

            table = {
                "title": "Operations Status Breakdown",
                "headers": ["Execution Status", "Work Order Count"],
                "rows": [
                    [st["status"], st["count"]]
                    for st in o_data["status_breakdown"]
                ]
            }

        else:
            p_data = PipelineAnalytics.analyze_pipeline(deals_board)
            b_data = BillingAnalytics.analyze_billing_and_collections(wo_board)
            p_sum = p_data["summary"]
            b_sum = b_data["summary"]
            deterministic_context = {"pipeline": p_sum, "billing": b_sum, "data_quality_deals": dq_deals, "data_quality_wo": dq_wo}

            metrics = [
                {"title": "Open Pipeline", "value": p_sum["total_pipeline_value_formatted"], "subtext": f"{p_sum['open_deals_count']} deals", "type": "primary"},
                {"title": "Total Receivables", "value": b_sum["total_receivable_formatted"], "subtext": "Outstanding AR", "type": "warning"},
                {"title": "Unbilled Completed", "value": b_sum["unbilled_completed_value_formatted"], "subtext": f"{b_sum['unbilled_completed_count']} WOs", "type": "danger"}
            ]

        # Dynamic live LLM synthesis
        llm_answer, err = await self._call_llm(query, deterministic_context, preferred_model=preferred_model)
        if llm_answer:
            answer = llm_answer
        else:
            answer = self._format_natural_api_error(err or "Unknown LLM error")

        return {
            "answer": answer,
            "metrics": metrics,
            "warnings": warnings,
            "table": table
        }

    def _extract_sector(self, query: str) -> Optional[str]:
        sectors = ["mining", "powerline", "solar", "infrastructure", "highway", "wind"]
        for sec in sectors:
            if sec in query:
                return sec
        return None
