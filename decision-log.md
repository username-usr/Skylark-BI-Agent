# Skylark Drones — Monday.com Business Intelligence Agent

## Executive Decision Log & Technical Architecture


### 1. Executive Summary & Problem Overview

Founders and executive leaders at Skylark Drones require immediate, high-confidence visibility into revenue pipelines, project delivery bottlenecks, cash collections, and cross-board risks without manually combing through unstructured Monday.com boards or waiting for ad-hoc spreadsheet cleanup.

This project delivers an end-to-end AI Business Intelligence Decision Support Agent designed specifically for leadership queries. Built with a **3-Layer Monday.com Architecture** (Hosted MCP Server → GraphQL v2 API → Local Dataset Fallback) and a **Hybrid Deterministic Analytics + Conversational LLM Engine**, the agent provides mathematically verified metrics accompanied by actionable executive insights.

### 2. Key Assumptions Made

1. **Financial Metrics Fidelity (Zero Guesswork Policy)**:
   - When deal values or contract amounts are unrecorded, null, or blank (`181 out of 346 deals`), the system **never hallucinates or imputes values**. Instead, it strictly calculates verifiable metrics and explicitly communicates data hygiene caveats to leadership.
2. **Weighted Pipeline Probability Mapping**:
   - Textual probability values are normalized into mathematical weights: `High / 75-90% → 0.8`, `Medium / 50% → 0.5`, `Low / 10-25% → 0.2`. Numeric percentages are converted to decimals \([0.0 - 1.0]\).
3. **Cross-Board Entity Reconciliation**:
   - Accounts across the *Deals Board* and *Work Orders Board* are reconciled via normalized `Client Code` / `Customer Code` strings to identify cross-board exposures (e.g. clients with open sales deals who carry overdue receivables).
4. **Currency Normalization**:
   - All financial numbers are parsed from messy string variants (`₹`, `INR`, commas, trailing decimals, `Cr`, `Lakhs`) into uniform floats and formatted in standard Indian numbering system (`₹ Cr` / `₹ Lakhs`).


### 3. Key Architectural Trade-offs & Rationale

| Decision / Trade-off | Chosen Approach | Alternative Considered | Rationale |
| :--- | :--- | :--- | :--- |
| **Computation Model** | **Deterministic Python Engine + LLM Narrative Synthesis** | Pure LLM Direct Extraction | LLMs are prone to arithmetic errors and token hallucinations when aggregating hundreds of rows. Pure deterministic calculation ensures 100% mathematical accuracy, while the LLM crafts the executive narrative. |
| **Monday.com Connectivity** | **3-Tier Fallback (MCP → GraphQL v2 → Local Data)** | Direct CSV upload only | Complies with the requirement to query Monday.com dynamically using the official Model Context Protocol (`all_api_read`) while guaranteeing zero crashes if Monday API quotas or network timeouts occur. |
| **LLM Tier Strategy** | **Multi-Provider Failover (OpenRouter Free Models + Gemini Flash-Lite)** | Single Gemini Preview Model | Single preview models frequently trigger `429 Quota Exceeded` or `503 High Demand` on free tiers. The dual-engine queue ensures seamless failover and continuous uptime. |
| **Frontend Aesthetic** | **Minimalist Executive White/Grey Workspace** | Generic Dark Chatbot UI | Designed specifically for founders and executive leaders following Perplexity & Linear design principles (clean typography, no cluttered icons, floating sidebar, token counters). |


### 4. Interpretation of "Leadership Updates" (Additional Feature)

We interpreted **"Leadership Updates"** as the need for founders and C-level executives to get immediate executive briefings that can be directly pasted into Slack, Notion, or board meeting presentations:

1. **Executive Summary Matrix**:
   - Consolidates Deals, Project Deliveries, Outstanding Collections, and Accrued Risks into a single snapshot.
2. **Cross-Board Risk Detection**:
   - Specifically flags accounts expanding their sales pipeline while holding overdue invoices or unbilled completed work orders.
3. **1-Click Executive Copy & Token Tracking**:
   - Fast 1-click formatted clipboard export with real-time input/output token tracking for leadership updates.


### 5. What We Would Do Differently with More Time

1. **Bi-directional Monday.com Notifications**:
   - Use Monday MCP's `create_notification` tool to trigger automatic Slack/Monday bell notifications to project managers whenever unbilled completed work exceeds ₹50 Lakhs.
2. **Automated Weekly Executive Email / Slack Digest**:
   - Implement scheduled background cron jobs delivering daily 8:00 AM founder briefings on pipeline changes and high-risk AR accounts.
3. **Interactive Visual Charts**:
   - Add native interactive funnel charts (using Chart.js / Recharts) for visual pipeline stage conversion drop-off analysis.


### 6. Summary Checklist of Technical Assignment Requirements

- [x] **Monday.com Integration**: Live dynamic queries via hosted Monday MCP Server (`all_api_read`) & GraphQL v2 API.
- [x] **Data Resilience**: Gracefully handles messy data, date formatting, currency cleaning, and 181 missing deal values.
- [x] **Query Understanding**: Classifies founder-level business queries and diagnostics.
- [x] **Business Intelligence**: Sector breakdowns, weighted pipeline, work order bottlenecks, AR tracking, and unbilled revenue leakage.
- [x] **Conversational Interface**: Clean natural language responses without robotic section headers.
- [x] **Decision Log & Setup Documentation**: Comprehensive decision log and production README provided.

