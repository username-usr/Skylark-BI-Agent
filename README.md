# Skylark Drones — Monday.com Business Intelligence Agent

[![Live Hosted Prototype](https://img.shields.io/badge/Live_Hosted_App-monday--bi--agent--smhz.onrender.com-7c3aed?style=for-the-badge&logo=render)](https://monday-bi-agent-smhz.onrender.com/)
[![GitHub Repository](https://img.shields.io/badge/GitHub_Repo-Skylark--BI--Agent-0ea5e9?style=for-the-badge&logo=github)](https://github.com/username-usr/Skylark-BI-Agent)
[![Automated Tests](https://img.shields.io/badge/Tests-11%20Passed-emerald?style=for-the-badge&logo=pytest)](https://github.com/username-usr/Skylark-BI-Agent)

An AI Business Intelligence Decision Support Agent designed for founders and executives to query, analyze, and diagnose real-time business performance across **Monday.com Deals pipeline** and **Work Orders execution** boards.

---

> ### 🌐 Live Hosted Prototype (Deliverable #1)
> **Direct Application URL**: **[https://monday-bi-agent-smhz.onrender.com/](https://monday-bi-agent-smhz.onrender.com/)**  
> *Ready to test immediately without local setup or installation.*

---

## 🌟 Key Capabilities

1. **Live Monday.com MCP Integration**:
   - Directly connects to Monday.com via official **Model Context Protocol (MCP)** using `all_api_read` and GraphQL v2 fallback.
   - Automatically discovers board IDs (`Deals` & `Work Orders`) without manual configuration.

2. **Executive Business Intelligence**:
   - **Executive Leadership Briefing**: 1-click multi-board summary combining pipeline, delivery, cash flow, and key risks.
   - **Deals Pipeline**: Calculates total pipeline value, probability-weighted pipeline, and stage conversion breakdowns.
   - **Operations & Execution**: Tracks active work order milestones, delivery statuses, and project completion rates.
   - **Receivables & Billing (AR)**: Pinpoints outstanding payments and revenue collected.
   - **Revenue Leakage Alert**: Identifies unbilled completed projects to prevent accrued revenue loss.
   - **Cross-Board Risk Analytics**: Detects high-risk customer accounts carrying active sales pipeline alongside unpaid invoices.

3. **Data Resilience & Hygiene Auditing**:
   - Gracefully normalizes messy INR currency strings, dates, and sector names.
   - Accurately diagnoses and communicates missing data caveats (e.g. 181 deals missing values) without hallucinating.

4. **Multi-Model LLM Engine**:
   - Built-in **AI Model Switcher** allowing instant switching between **Google Gemini 3.5 Flash-Lite**, **Gemini 3.6 Flash**, **Llama 3.3 70B**, and **DeepSeek R1**.
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
│ 1. Hosted Monday MCP Server   │                       │ 1. Google Gemini Flash-Lite   │
│ 2. GraphQL v2 Dynamic Query   │                       │ 2. OpenRouter (Llama 3.3 70B) │
│ 3. Local Dataset Fallback     │                       │ 3. Deterministic Context Feed │
└───────────────────────────────┘                       └───────────────────────────────┘
```

---

## 🚀 Quick Start & Setup Guide

### 1. Live Hosted Application (Zero Local Setup)
Open **[https://monday-bi-agent-smhz.onrender.com/](https://monday-bi-agent-smhz.onrender.com/)** in any browser.

---

### 2. Local Environment Setup

Clone repository:
```bash
git clone https://github.com/username-usr/Skylark-BI-Agent.git
cd Skylark-BI-Agent
```

Create a `.env` file in root:
```env
MONDAY_API_KEY=your_monday_api_personal_token
MONDAY_MCP_URL=https://mcp.monday.com/mcp
MONDAY_GRAPHQL_URL=https://api.monday.com/v2
LLM_API_KEY=your_google_gemini_api_key
LLM_MODEL=gemini-3.5-flash-lite
OPENROUTER_API_KEY=your_openrouter_api_key
```

Run Backend:
```bash
cd backend
uv run uvicorn app.main:app --reload --port 8000
```

Run Frontend:
```bash
cd frontend
npm install
npm run dev
```
Open **`http://localhost:5173`**.

---

### 3. Running Automated Tests

```bash
cd backend
uv run pytest tests -o pythonpath=.
```

---

## 📁 Repository Structure

```
├── backend/
│   ├── app/
│   │   ├── agent/            # Prompt engineering & multi-model LLM engine
│   │   ├── analytics/        # Deterministic pipeline, billing, ops & cross-board logic
│   │   ├── monday/           # Hosted MCP client, GraphQL queries, and schema parsers
│   │   ├── normalization/    # Currency, date, and data hygiene audits
│   │   ├── config.py         # App configuration & .env loader
│   │   └── main.py           # FastAPI entrypoint + static frontend SPA mount
│   └── tests/                # Pytest unit & integration test suite
├── frontend/
│   ├── src/
│   │   ├── components/       # Chat interface, sidebar, metric cards, tables
│   │   ├── services/         # API client & local storage session management
│   │   └── App.tsx           # Main workspace layout
├── data/                     # Offline dataset backups (Deals & Work Orders)
├── decision-log.md           # Executive Decision Log & Architecture Rationale
├── README.md                 # Project Documentation
└── Dockerfile                # Multi-stage production container
```

---

## 🛡️ Data Resilience & Integrity Guarantees

- **No Arithmetic Hallucinations**: All sums, weighted probabilities, and percentages are computed deterministically in Python before being synthesized by the LLM.
- **Missing Value Handling**: Incomplete or missing values are never guessed. The agent explicitly identifies and communicates data gaps to leadership.
- **Graceful Fallbacks**: If Monday API rate limits or network issues occur, the agent falls back across MCP → GraphQL → local caches without crashing.
