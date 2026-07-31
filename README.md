# Sentellent Equity Chief: Contextual Agentic AI Indian Stock Analyst (RAG)

> **S E N T E L L E N T &nbsp; H I R I N G &nbsp; C H A L L E N G E &nbsp; S U B M I S S I O N**  
> **Mission:** Build a Contextual Agentic AI Indian Stock Analyst (RAG)  
> **Role:** Full Stack AI SDE Intern | **Company:** Sentellent  
> **Deadline:** Wednesday, Aug 5th, 11:59 PM  
> **GitHub Repository:** [https://github.com/SonaRajarajan/Sentellent_Stock_Analyst](https://github.com/SonaRajarajan/Sentellent_Stock_Analyst)  
> **Submission Link:** [forms.gle/qWxabTxLjEkJ2LcEA](https://forms.gle/qWxabTxLjEkJ2LcEA)

---

## 🚀 Executive Summary & Mission

**Sentellent Equity Chief** is a Personal Agentic AI Indian Equity Analyst site—an Equity Research Chief of Staff for the **NSE / BSE**—that runs in the cloud and answers financial queries using **Retrieval Augmented Generation (RAG)** and **Dynamic Memory**.

The application allows users to log in, follow Indian equity tickers (e.g., `RELIANCE`, `TCS`, `HDFCBANK`, `INFY`), and automatically ingests fundamental ratios from Screener.in alongside real-time news from Indian financial media RSS feeds into a PostgreSQL `pgvector` vector store.

---

## 🧠 Core Architecture: RAG + Dynamic Memory

Built on **LangGraph**, the agent maintains state and grounds every recommendation:

1. **From Chat (Investor Persona Extraction):** When a user states *"I am a conservative, dividend-focused investor and I avoid high-debt companies"*, the agent automatically updates the long-term memory graph (`risk_profile: Conservative`, `max_debt_to_equity: 0.5`, `min_dividend_yield: 2.0%`).
2. **From Data (RAG Ingestion):** Ingests fundamentals from Screener.in and financial news from Indian RSS feeds (Economic Times, Moneycontrol, LiveMint, Business Standard). Automatically extracts sentiment, tags events, and stores embeddings in `pgvector`.
3. **Grounded & Cited Responses in INR (Rs.):** Every claim and stock pick is grounded in ingested sources with explicit citations (`[Source 1]`) and figures priced in **INR (Rs.)**. If data is unavailable, the agent responds *"I don't have that in the ingested data"*.
4. **Engineering Efficiency at Scale:**
   - **Content-Hashed Deduplication:** sha256 article deduplication avoids redundant indexing.
   - **Idempotent Ingestion:** Parallel refresh jobs use `IngestionLock` to eliminate race conditions.
   - **Multi-Factor Algorithmic Screener:** Scores NIFTY/BSE stocks against investor constraints using efficient multi-factor algorithms rather than brute-force LLM calls.

---

## 🛠️ Tech Stack

- **Frontend:** Next.js 14, React 18, TailwindCSS, Recharts, Lucide Icons
- **Backend:** Python 3.11+, FastAPI, Uvicorn
- **AI & Agent Framework:** LangChain, LangGraph State Machine
- **Vector Store & Database:** PostgreSQL 15 + `pgvector` extension on **Supabase Cloud** (Project ID: `yhfvgvfbugoajgbxddxx`)
- **Data Sources:**
  - **Fundamentals:** Screener.in (scraped responsibly with rate limits & NSE/BSE symbol mapping)
  - **News Feeds:** Indian Financial Media RSS (Economic Times, Moneycontrol, LiveMint, Business Standard)
  - **Prices:** yfinance (`.NS` tickers) for live quotes in **INR (Rs.)**
- **DevOps & Infrastructure:** Docker, Docker Compose, Terraform IaC (`terraform/main.tf`), GitHub Actions CI/CD (`.github/workflows/deploy.yml`)

---

## 🔑 Authentication & Evaluator Access

The portal supports OAuth / Evaluator Login. Per the challenge specification, the following **mandatory test accounts** are configured for instant evaluator access:

- **Evaluator Test User 1:** `harisankar@sentellent.com`
- **Evaluator Test User 2:** `naga@sentellent.com`

---

## ⚙️ Step-by-Step Local Setup & Execution Guide

### Prerequisites
- Python 3.11+
- Node.js 18+ and `npm`
- Git

### ⚡ Option A: One-Click Launcher Script (Recommended for Evaluators)

Run both backend and frontend dev servers with a single command:

```bash
# Clone the repository
git clone https://github.com/SonaRajarajan/Sentellent_Stock_Analyst.git
cd Sentellent_Stock_Analyst

# Make the launcher script executable and run
chmod +x run_app.sh
./run_app.sh
```

- **Frontend Application:** [http://localhost:3000](http://localhost:3000)
- **Backend API Server:** [http://localhost:8000](http://localhost:8000)
- **Interactive API Docs (Swagger):** [http://localhost:8000/docs](http://localhost:8000/docs)

---

### 🔧 Option B: Manual Setup

#### 1. Backend Setup (FastAPI + LangGraph)

```bash
cd backend

# Create and activate virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure Environment Variables (.env)
cp .env.example .env
```

**Configure `.env` file:**
```env
DATABASE_URL=postgresql://postgres:Kemumaki%4026@db.yhfvgvfbugoajgbxddxx.supabase.co:5432/postgres
GEMINI_API_KEY=your_gemini_api_key_here
PORT=8000
HOST=0.0.0.0
```

**Run Backend Server:**
```bash
python3 -m app.main
```

#### 2. Frontend Setup (Next.js 14)

```bash
cd frontend

# Install dependencies
npm install

# Start Next.js Development Server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

### 🐳 Option C: Docker Setup

Run the containerized application using Docker Compose:

```bash
# Build and run containers
docker-compose up --build
```

---

## 🔌 API Endpoint Documentation

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/` | Root health check |
| `POST` | `/api/ingest` | Triggers Screener.in & RSS ingestion for a given ticker (e.g. `{"ticker": "RELIANCE"}`) |
| `POST` | `/api/chat` | Main Agent RAG endpoint; accepts user queries & returns grounded, cited answers |
| `GET` | `/api/screener` | Retrieves multi-factor Screener.in fundamental ratios & sentiment scores |
| `GET` | `/api/portfolio` | Fetches currently tracked stocks & portfolio valuation in INR (Rs.) |
| `POST` | `/api/persona` | Updates or retrieves the active investor persona memory graph |

---

## 🏗️ Infrastructure as Code & CI/CD Pipeline

- **Terraform (`terraform/main.tf`):** Defines PostgreSQL `pgvector` database extension provisioning, security groups, and cloud database parameters.
- **GitHub Actions (`.github/workflows/deploy.yml`):** Automated CI/CD pipeline that runs unit test suites, validates Terraform code, builds multi-stage Docker images, and verifies database migrations on push to `main`.

---

## ✅ Feature Checklist Verification

- [x] **Auth & Test Users:** Google OAuth / Evaluator Login with `harisankar@sentellent.com` & `naga@sentellent.com`.
- [x] **RAG Ingestion:** Fetches Screener.in fundamentals + Indian RSS news feeds into Supabase `pgvector`.
- [x] **Dynamic Memory:** Extracts investor rules from chat and updates investor persona graph.
- [x] **Grounded & Cited Answers:** Every response links back to ingested sources with figures in INR (Rs.).
- [x] **Engineering Efficiency:** sha256 article deduplication, `IngestionLock` idempotent pipeline, and multi-factor algorithmic screener.
- [x] **Containerization & IaC:** Dockerized frontend/backend and Terraform scripts.

---

*Built for the Sentellent Full Stack AI SDE Internship Challenge.*
