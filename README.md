# Sentellent Equity Chief: Contextual Agentic AI Indian Stock Analyst (RAG)

> **Sentellent Full Stack AI SDE Internship Challenge Submission**  
> **Role:** Full Stack AI SDE Intern | **Company:** Sentellent  
> **Date:** Friday, July 31, 2026  
> **Deadline:** Wednesday, August 5th, 11:59 PM  
> **GitHub Repository:** [https://github.com/SonaRajarajan/Sentellent_Stock_Analyst](https://github.com/SonaRajarajan/Sentellent_Stock_Analyst)  
> **Submission Link:** [forms.gle/qWxabTxLjEkJ2LcEA](https://forms.gle/qWxabTxLjEkJ2LcEA)

---

## 📸 Original Application & Supabase Cloud Infrastructure Screenshots

Per the Sentellent Challenge evaluation rubric, heavy weightage is placed on deployment, containerization, Infrastructure as Code (IaC), and automated CI/CD automation.

### ⚡ 1. Supabase Cloud Database & Vector Store Console (Project `yhfvgvfbugoajgbxddxx`)
![Supabase Cloud Database Console](docs/images/supabase_console.jpg)

- **Supabase Cloud Project ID**: `yhfvgvfbugoajgbxddxx`
- **Database Engine**: PostgreSQL 15.3 with **`pgvector` extension enabled**
- **Connection URI**: `postgresql://postgres:Kemumaki%4026@db.yhfvgvfbugoajgbxddxx.supabase.co:5432/postgres`
- **Tables Provisioned**: `stocks`, `news_articles`, `investor_personas`, `citations`

---

### 🔑 2. Original Auth & Sign In Portal Screen
![Login Portal Screen](docs/images/login_portal.jpg)

- Includes mandatory evaluator test user options for **`harisankar@sentellent.com`** and **`naga@sentellent.com`**.
- Fast one-click evaluator login buttons for immediate testing.

---

### 🔍 3. Original Dashboard Overview & Live Search Autocomplete
![Dashboard Overview & Search Autocomplete](docs/images/dashboard_autocomplete.jpg)

- Live search autocomplete dropdown with one-click **`+ Ingest RAG`** badges (`RELIANCE`, `TCS`, `HDFCBANK`, `INFY`, `TATAMOTORS`, `ITC`, `COALINDIA`, `NTPC`, `ICICIBANK`, `SBIN`, `BHARTIARTL`, `LT`).
- Ingested stocks immediately update the **#1 top mini-card** with a glowing **`NEW`** badge and recalculated portfolio values in **INR (Rs.)**.

---

### 📊 4. Original Analytics & Visualizations Page
![Analytics & Visualizations Page](docs/images/analytics_charts.jpg)

- **NIFTY 50 & Stock Price Trend Area Chart**: Time-series growth in INR with high-contrast legible tooltips.
- **ROCE % vs P/E Ratio Comparison Bar Chart**: Valuation vs profitability screening.
- **Sector Allocation Donut Chart**: High-contrast, legible sector breakdown across IT, Energy, Financials, Auto, and FMCG.

---

### 🔍 5. Original Screener.in Ratios & Fundamentals Engine
![Screener Ratios Engine](docs/images/screener_ratios.jpg)

- Interactive controls for **Max Debt/Equity ceiling** (0.0 - 2.5) and **Min Dividend Yield** (0.0% - 5.0%).
- Screener table displaying P/E, Debt/Equity, ROCE %, ROE %, Sales & Profit growth.

---

## 🧠 Architectural Overview: LangGraph RAG Agent + Dynamic Memory

```
                       +-----------------------------------+
                       |    Screener.in Fundamentals &     |
                       |    Indian News RSS Feeds          |
                       +-----------------+-----------------+
                                         |
                                         v (sha256 Deduplication & IngestionLock)
                       +-----------------+-----------------+
                       |  Vector Ingestion Pipeline &      |
                       |  pgvector Cosine Similarity Store |
                       +-----------------+-----------------+
                                         |
                                         v
+-----------------------+     +----------+----------+     +------------------------+
| User Chat & Investor  | --> | LangGraph Agent RAG | --> | Grounded & Cited Answers|
| Persona Memory Graph  |     | Grounding Guardrails|     | All figures in INR(Rs.)|
+-----------------------+     +---------------------+     +------------------------+
```

1. **Grounded Answers & Citations in INR (`Rs`)**: Every claim and stock recommendation is backed by a retrieved vector source `[Source 1]` and priced in Indian Rupees (`Rs.`).
2. **Anti-Hallucination Guardrail**: If requested information is missing from ingested feeds, the agent explicitly responds *"I don't have that in the ingested data"* instead of fabricating facts.
3. **LangGraph Dynamic Memory**: Investor rules (e.g. *"I avoid high-debt companies"*) dynamically update persona state (`risk_profile`, `max_debt_to_equity: 0.5`, `min_dividend_yield`).
4. **Algorithmic Multi-Factor Screener**: Scores NIFTY/BSE stocks against investor constraints using efficient multi-factor algorithms.
5. **Idempotent Ingestion Pipeline**: Content-hashed article deduplication and `IngestionLock` ensure concurrent refresh jobs never double-index or corrupt state.

---

## ⚡ Quick Start for Evaluators

Run both backend & frontend with a single command:

```bash
# Clone the repository
git clone https://github.com/SonaRajarajan/Sentellent_Stock_Analyst.git
cd Sentellent_Stock_Analyst

# Execute one-click launcher script
./run_app.sh
```

- **Frontend UI:** `http://localhost:3000`
- **Backend API:** `http://localhost:8000`

---

## 🛠️ Tech Stack

- **Frontend:** Next.js 14, React, TailwindCSS, Recharts, Lucide-Icons
- **Backend:** Python 3, FastAPI, LangChain, LangGraph
- **Database & Vector Store:** PostgreSQL 15 + `pgvector` (Supabase Cloud project `yhfvgvfbugoajgbxddxx`), SQLite fallback
- **Data Sources:** Screener.in, Indian Financial RSS Feeds (Economic Times, Moneycontrol, LiveMint, Business Standard)
- **DevOps & Cloud:** Docker, Terraform IaC, Supabase PostgreSQL pgvector, GitHub Actions CI/CD

---

*Built for Sentellent Full Stack AI SDE Internship Challenge.*
