# Skylark Drones — Monday.com Business Intelligence Agent
## Executive Decision Log & Technical Architecture Reference


### 1. Executive Summary & Problem Overview
Founders and executive leaders at Skylark Drones require immediate, high-confidence visibility into sales pipelines, project delivery bottlenecks, cash collections, and cross-board risks without manually combing through unstructured Monday.com boards or waiting for ad-hoc spreadsheet cleanup.

This project delivers an end-to-end AI Business Intelligence Decision Support Agent designed specifically for leadership queries. Built with a **3-Layer Monday.com Architecture** (Hosted MCP Server → GraphQL v2 API → Local Dataset Fallback) and a **Hybrid Deterministic Analytics + Conversational LLM Engine**, the agent provides mathematically verified metrics accompanied by actionable executive insights.

---

### 2. Comprehensive Inventory of Implemented Features

| Feature Category | Specific Capability | Implementation Details & Business Impact |
| :--- | :--- | :--- |
| **Monday.com MCP Integration** | **Hosted MCP Protocol (`all_api_read`)** | Implements official Monday Model Context Protocol JSON-RPC 2.0 tool execution to query live workspace boards dynamically. |
| **Monday.com MCP Integration** | **Dynamic Board Auto-Discovery** | Automatically scans user account boards and discovers *Deals Board* (`5030971234`) and *Work Orders Board* (`5030971225`) without manual ID entry. |
| **Monday.com MCP Integration** | **3-Tier Resilient Fallback** | `Hosted Monday MCP → GraphQL v2 API → Offline Cache` guarantees 100% application uptime even during Monday API quota pauses. |
| **Data Resilience & Auditing** | **Zero-Hallucination Policy** | Strictly calculates verified mathematical figures. Incomplete or missing values are never guessed or fabricated. |
| **Data Resilience & Auditing** | **181 Missing Values Diagnosis** | Specifically audits why 52.3% of deals lack values (concentrated in unscoped *Lead Generated* top-of-funnel and dropped stages). |
| **Data Resilience & Auditing** | **Robust Normalization Pipeline** | Standardizes messy Indian Rupee strings (`₹`, `INR`, `Cr`, `Lakhs`, commas), unstructured date formats, and typo-ridden sector names. |
| **Business Intelligence** | **Sales Pipeline & Weighted Forecast** | Computes gross pipeline value (**₹688.15 Cr**), stage distributions, and probability-weighted pipeline (**₹268.36 Cr**). |
| **Business Intelligence** | **Operations Execution Tracker** | Analyzes delivery milestones, in-progress projects, and completion rates across drone flight operations. |
| **Business Intelligence** | **Receivables & Billing (AR)** | Tracks billed contract milestones, payments collected to date, and prioritizes overdue accounts receivable. |
| **Business Intelligence** | **Revenue Leakage Risk Detector** | Pinpoints completed work orders that have ₹0 billed value recorded to prevent unbilled accrued revenue loss. |
| **Business Intelligence** | **Cross-Board Risk Matrix** | Correlates client codes between Deals and Work Orders to flag high-risk accounts opening new deals while holding overdue AR. |
| **Executive UX / UI** | **Live AI Model Switcher** | 1-click model switcher in Header & Chatbar allowing instant switching between Gemini Flash-Lite, Gemini 3.6, Llama 3.3 70B, and DeepSeek R1. |
| **Executive UX / UI** | **Perplexity-Style Typography** | Clean optical neo-grotesque design using `Inter` and `Geist` with customized letter tracking (`-0.02em`) and light grey theme. |
| **Executive UX / UI** | **Real-Time Token Tracker** | Cumulative input/output token counter located strictly at the bottom-right corner of the workspace. |
| **Executive UX / UI** | **1-Click Executive Copy** | One-click formatted clipboard export with interactive feedback for pasting into Slack, Notion, or executive emails. |
| **Executive UX / UI** | **Diagnostic Intent Routing** | Explanatory "why" questions receive structured narrative briefings without dumping unnecessary 17-row tables. |

---

### 3. Tech Stack & Dependencies

| Layer / Component | Technology | Version | Purpose & Rationale |
| :--- | :--- | :--- | :--- |
| **Backend Framework** | **Python / FastAPI** | 3.11 / 0.115+ | High-performance asynchronous API framework with native OpenAPI/Swagger support. |
| **Data Validation** | **Pydantic / Pydantic-Settings** | 2.10+ | Strict type validation, environment variable loading, and structured response schemas. |
| **HTTP & Protocol Client** | **HTTPX** | 0.28+ | Async HTTP client used for MCP JSON-RPC requests, Monday GraphQL calls, and OpenRouter streaming. |
| **Google GenAI SDK** | **google-genai** | 1.3+ | Official SDK for Google Gemini 3.5 Flash-Lite and Gemini 3.6 Flash inference. |
| **Data Normalization** | **OpenPyXL / Regex / Pandas** | 3.1+ | Parsing spreadsheet datasets, date cleaning, and numeric currency normalizers. |
| **Automated Testing** | **Pytest / Pytest-Asyncio** | 8.3+ | Automated test suite verifying normalizers, business analytics, and API endpoints (11/11 passing). |
| **Frontend UI Library** | **React / TypeScript** | 19.0 / 5.7+ | Component-driven frontend architecture with strict type safety. |
| **Build Tooling** | **Vite** | 6.2+ | Ultra-fast HMR and optimized production bundle compilation. |
| **Styling & Icons** | **Tailwind CSS / Lucide React** | 4.0 / 0.475+ | Utility-first responsive styling and minimalist iconography. |
| **Markdown Rendering** | **React Markdown / Remark GFM** | 9.0+ / 4.0+ | Renders rich GitHub-flavored markdown, structured bullet points, and tables. |

---

### 4. External APIs & Cloud Services Used

| Service Name | Endpoint / Protocol | Authentication | Role in Architecture |
| :--- | :--- | :--- | :--- |
| **Monday Hosted MCP** | `https://mcp.monday.com/mcp` (JSON-RPC 2.0) | Bearer Token (`MONDAY_API_KEY`) | Official Model Context Protocol endpoint executing `all_api_read` tool queries. |
| **Monday GraphQL API** | `https://api.monday.com/v2` (GraphQL) | Bearer Token (`MONDAY_API_KEY`) | Dynamic GraphQL fallback for board schema introspection and pagination. |
| **Google Gemini API** | `https://generativelanguage.googleapis.com` | API Key (`LLM_API_KEY`) | Powers `gemini-3.5-flash-lite` (primary fast model) and `gemini-3.6-flash`. |
| **OpenRouter API** | `https://openrouter.ai/api/v1/chat/completions` | API Key (`OPENROUTER_API_KEY`) | Multi-model failover supporting `Llama 3.3 70B`, `DeepSeek R1`, and `Qwen 2.5 72B`. |

---

### 5. Key Architectural Assumptions

1. **Financial Metrics Fidelity (Zero Guesswork Policy)**:
   - When deal values or contract amounts are unrecorded, null, or blank (`181 out of 346 deals`), the system **never imputes or guesses values**. It calculates verifiable metrics and explicitly alerts leadership to CRM data hygiene gaps.
2. **Weighted Pipeline Probability Mapping**:
   - Textual probability entries are converted to mathematical weights: `High / 75-90% → 0.8`, `Medium / 50% → 0.5`, `Low / 10-25% → 0.2`. Numeric percentages are converted to standard decimals \([0.0 - 1.0]\).
3. **Cross-Board Entity Reconciliation**:
   - Accounts across the *Deals Board* and *Work Orders Board* are reconciled via normalized `Client Code` / `Customer Code` strings to identify cross-board exposures (e.g. clients with open sales deals who carry overdue receivables).
4. **Currency Normalization**:
   - All financial numbers are parsed from messy string variants (`₹`, `INR`, commas, trailing decimals, `Cr`, `Lakhs`) into uniform floats and formatted in standard Indian numbering system (`₹ Cr` / `₹ Lakhs`).

---

### 6. Architectural Trade-offs & Rationale

| Decision / Trade-off | Chosen Approach | Alternative Considered | Rationale |
| :--- | :--- | :--- | :--- |
| **Computation Model** | **Deterministic Python Engine + LLM Narrative Synthesis** | Pure LLM Direct Extraction | LLMs are prone to arithmetic errors and token hallucinations when aggregating hundreds of rows. Pure deterministic calculation ensures 100% mathematical accuracy, while the LLM crafts the executive narrative. |
| **Monday.com Connectivity** | **3-Tier Fallback (MCP → GraphQL v2 → Local Data)** | Direct CSV upload only | Complies with the requirement to query Monday.com dynamically using the official Model Context Protocol (`all_api_read`) while guaranteeing zero crashes if Monday API quotas or network timeouts occur. |
| **LLM Tier Strategy** | **Multi-Provider Failover (OpenRouter Models + Gemini Flash-Lite)** | Single Gemini Preview Model | Single preview models frequently trigger `429 Quota Exceeded` or `503 High Demand` on free tiers. The dual-engine queue ensures seamless failover and continuous uptime. |
| **Frontend Aesthetic** | **Minimalist Executive White/Grey Workspace** | Generic Dark Chatbot UI | Designed specifically for founders and executive leaders following Perplexity & Linear design principles (clean typography, no cluttered icons, floating sidebar, token counters). |

---

### 7. Interpretation of "Leadership Updates" (Additional Feature)

We interpreted **"Leadership Updates"** as the need for founders and C-level executives to get immediate executive briefings that can be directly pasted into Slack, Notion, or board meeting presentations:

1. **Executive Summary Matrix**:
   - Consolidates Deals, Project Deliveries, Outstanding Collections, and Accrued Risks into a single snapshot.
2. **Cross-Board Risk Detection**:
   - Specifically flags accounts expanding their sales pipeline while holding overdue invoices or unbilled completed work orders.
3. **1-Click Executive Copy & Token Tracking**:
   - Fast 1-click formatted clipboard export with real-time input/output token tracking for leadership updates.

---

### 8. What We Would Do Differently with More Time

1. **Bi-directional Monday.com Notifications**:
   - Use Monday MCP's `create_notification` tool to trigger automatic Slack/Monday bell notifications to project managers whenever unbilled completed work exceeds ₹50 Lakhs.
2. **Automated Weekly Executive Email / Slack Digest**:
   - Implement scheduled background cron jobs delivering daily 8:00 AM founder briefings on pipeline changes and high-risk AR accounts.
3. **Interactive Visual Charts**:
   - Add native interactive funnel charts (using Chart.js / Recharts) for visual pipeline stage conversion drop-off analysis.
