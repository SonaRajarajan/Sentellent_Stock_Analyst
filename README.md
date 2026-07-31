# Sentellent Equity Chief: Contextual Agentic AI Indian Stock Analyst (RAG)

> **Sentellent Full Stack AI SDE Internship Challenge Submission**  
> **Role:** Full Stack AI SDE Intern | **Company:** Sentellent  
> **Date:** Friday, July 31, 2026  
> **Deadline:** Wednesday, August 5th, 11:59 PM  
> **GitHub Repository:** [https://github.com/SonaRajarajan/Sentellent_Stock_Analyst](https://github.com/SonaRajarajan/Sentellent_Stock_Analyst)  
> **Submission Link:** [forms.gle/qWxabTxLjEkJ2LcEA](https://forms.gle/qWxabTxLjEkJ2LcEA)

---

## ⚡ Supabase Production Cloud Infrastructure & Application Screenshots

Per the Sentellent Challenge evaluation rubric, heavy weightage is placed on cloud database deployment, containerization, Infrastructure as Code (IaC), and automated CI/CD automation.

### 📊 1. Supabase Production Cloud Console (Project `yhfvgvfbugoajgbxddxx`)
![Supabase Production Cloud Dashboard](docs/images/supabase_production.png)

- **Supabase Cloud Project**: `yhfvgvfbugoajgbxddxx` (`Indian Stock` / `main PRODUCTION`)
- **Total Requests**: 923 Total Requests (92.6% Success Rate)
- **API Gateway**: 418 requests | **Postgres DB**: 310 requests | **Auth Services**: 107 requests | **Storage**: 59 requests
- **Vector Extension**: Active PostgreSQL 15 + `pgvector` embedding storage enabled for RAG retrieval

---

### 🔑 2. Authentication & Sign In Portal Screen
![Login Portal Screen](docs/images/login_portal.png)

- Mandatory evaluator test user sign-in options for **`harisankar@sentellent.com`** and **`naga@sentellent.com`**.
- Fast one-click evaluator sign-in for seamless testing.

---

### 🔍 3. Live Dashboard Overview & Ingestion Control Bar
![Dashboard Overview Screen](docs/images/dashboard_overview.png)

- Logged-in user profile: **`sonavrajarajan@gmail.com`**.
- **Total Tracked Holding**: `Rs 12,641,750.00 (+12.4%)` dynamically updated in INR.
- **⚡ Quick Ingest Select**: One-click company pills (`RELIANCE`, `TCS`, `HDFCBANK`, `INFY`, `TATAMOTORS`, `ITC`, `COALINDIA`) triggering live Screener.in fundamentals + RSS news ingestion into `pgvector`.
- **Top Mini Cards & Watchlist Table**: Real-time fundamentals (P/E ratio, Debt/Equity ceiling, ROCE %) and RAG Chief Assistant drawer.

---

### 📈 4. Tracked Stock Fundamentals & Sentiment Metrics
![Tracked Stock Fundamentals Table](docs/images/fundamentals_detail.png)

- Detailed fundamental breakdown table mapping NSE & BSE symbols, prices in **INR (Rs.)**, P/E ratios, and Debt to Equity metrics (`0.42` for RELIANCE, `0.08` for TCS, `0.85` for HDFCBANK, `0.09` for INFY).

---

### 💼 5. Tracked Indian Equity Portfolio Manager Screen
![Tracked Portfolio Manager](docs/images/portfolio_manager.png)

- Full portfolio view displaying tracked stock cards (`TCS`, `HDFCBANK`, `RELIANCE`, `INFY`, `TATAMOTORS`, `ITC`, `COALINDIA`, `NTPC`).
- Displays live sentiment badges (`Bullish`), P/E, Debt/Eq, ROCE %, Dividend Yields, and one-click *"View Screener Fundamentals & News"* action buttons.

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
