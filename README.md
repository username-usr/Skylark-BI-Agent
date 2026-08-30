# Skylark Drones — Monday.com Business Intelligence Agent

An AI Business Intelligence Agent designed for founders and executives to query, analyze, and diagnose real-time business performance across **Monday.com Deals pipeline** and **Work Orders execution** boards.

---

## 🌟 Key Capabilities

1. **Live Monday.com MCP Integration**:
   - Directly connects to Monday.com via official **Model Context Protocol (MCP)** using `all_api_read` and GraphQL v2 fallback.
   - Automatically discovers board IDs (`Deals` & `Work Orders`) without manual configuration.

2. **Executive Business Intelligence**:
   - **Deals Pipeline**: Calculates total pipeline value, probability-weighted pipeline, and stage conversion breakdowns.
   - **Operations & Execution**: Tracks active work order milestones, delivery statuses, and project completion rates.
   - **Receivables & Billing (AR)**: Pinpoints outstanding payments and revenue collected.
   - **Revenue Leakage Alert**: Identifies unbilled completed projects to prevent accrued revenue loss.
   - **Cross-Board Risk Analytics**: Detects high-risk customer accounts carrying active sales pipeline alongside unpaid invoices.

3. **Data Resilience & Hygiene Auditing**:
   - Gracefully normalizes messy INR currency strings, dates, and sector names.
   - Accurately diagnoses and communicates missing data caveats (e.g. 181 deals missing values) without hallucinating.

4. **Multi-Model LLM Engine**:
   - Prioritizes fast, low-cost models (**Google Gemini 3.5 Flash-Lite** / **OpenRouter Free Models** like Llama 3.3 70B).
   - Dual-engine failover guarantees continuous uptime with zero rate limit crashes.

---

## 🏗️ Architecture Overview

```
                          ┌─────────────────────────────┐
                          │   React + Tailwind UI       │
                          │   (Perplexity-style Light)  │
                          └──────────────┬──────────────┘
                                         │ HTTP REST (/api/chat)
                                         ▼
                          ┌─────────────────────────────┐
                          │     FastAPI Backend Agent   │
                          └──────┬───────────────┬──────┘
                                 │               │
            ┌────────────────────┘               └─────────────────────┐
            ▼                                                          ▼
┌───────────────────────────────┐                       ┌───────────────────────────────┐
│     Monday.com Service Layer  │                       │   Conversational LLM Engine   │
│ 1. Hosted Monday MCP Server   │                       │ 1. OpenRouter (Free Models)   │
│ 2. GraphQL v2 Dynamic Query   │                       │ 2. Google Gemini Flash-Lite   │
│ 3. Local Dataset Fallback     │                       │ 3. Deterministic Context Feed │
└───────────────────────────────┘                       └───────────────────────────────┘
```

---

## 🚀 Quick Start & Setup Guide

### 1. Prerequisites
- **Python 3.11+** with `uv` (or `pip`)
- **Node.js 18+** with `npm`
- **Monday.com API Token** (Personal API token from *Monday.com → Profile → Developers → API*)
- **LLM API Key** (Google Gemini key from [Google AI Studio](https://aistudio.google.com/) or OpenRouter key from [OpenRouter](https://openrouter.ai/))

---

### 2. Environment Configuration (`.env`)

Create a `.env` file in the project root:

```env
# ==============================================================================
# Monday.com Configuration
# ==============================================================================
MONDAY_API_KEY=your_monday_api_personal_token
MONDAY_MCP_URL=https://mcp.monday.com/mcp
MONDAY_GRAPHQL_URL=https://api.monday.com/v2

# (Optional) Specific Board IDs. If left blank, the agent auto-discovers them!
DEALS_BOARD_ID=
WORK_ORDERS_BOARD_ID=

# ==============================================================================
# LLM Configuration
# ==============================================================================
# Google Gemini
LLM_API_KEY=your_google_gemini_api_key
LLM_MODEL=gemini-3.5-flash-lite

# OpenRouter (Optional for free Llama 3.3 70B failover)
OPENROUTER_API_KEY=
OPENROUTER_MODEL=meta-llama/llama-3.3-70b-instruct:free
```

---

### 3. Running the Backend

```bash
cd backend
uv run uvicorn app.main:app --reload --port 8000
```
*API docs available at: `http://localhost:8000/docs`*

---

### 4. Running the Frontend

```bash
cd frontend
npm install
npm run dev
```
*Interactive UI opens at: `http://localhost:5173`*

---

### 5. Running Automated Tests

```bash
cd backend
uv run pytest tests -o pythonpath=.
```

---

## 📁 Repository Structure

```
├── backend/
│   ├── app/
│   │   ├── agent/            # Prompt engineering & LLM engine
│   │   ├── analytics/        # Deterministic pipeline, billing, ops & cross-board logic
│   │   ├── monday/           # Hosted MCP client, GraphQL queries, and schema parsers
│   │   ├── normalization/    # Currency, date, and data hygiene audits
│   │   ├── config.py         # App configuration & .env loader
│   │   └── main.py           # FastAPI entrypoint
│   └── tests/                # Pytest unit & integration test suite
├── frontend/
│   ├── src/
│   │   ├── components/       # Chat interface, sidebar, metric cards, tables
│   │   ├── services/         # API client & local storage session management
│   │   └── App.tsx           # Main workspace layout
├── data/                     # Offline dataset backups (Deals & Work Orders)
├── decision-log.md           # Executive Decision Log & Architecture Rationale
├── README.md                 # Project Documentation
└── .env.example              # Template environment file
```

---

## 🛡️ Data Resilience & Integrity Guarantees

- **No Arithmetic Hallucinations**: All sums, weighted probabilities, and percentages are computed deterministically in Python before being synthesized by the LLM.
- **Missing Value Handling**: Incomplete or missing values are never guessed. The agent explicitly identifies and communicates data gaps to leadership.
- **Graceful Fallbacks**: If Monday API rate limits or network issues occur, the agent falls back across MCP → GraphQL → local caches without crashing.

