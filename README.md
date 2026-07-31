# Sentellent Hiring Challenge: Contextual Agentic AI Indian Stock Analyst (RAG)

An **Equity Research Chief of Staff for the NSE / BSE** running in the cloud with Retrieval-Augmented Generation (RAG), dynamic investor persona memory, automated stock sentiment & fundamentals ingestion, Terraform Infrastructure as Code (IaC), and GitHub Actions CI/CD.

---

## 🌟 Key Features

### 1. 🤖 LangGraph Agentic RAG & Dynamic Memory
- **Investor Persona Memory**: Automatically detects user investment goals from chat (e.g. *"I'm a conservative, dividend-focused investor and I avoid high-debt companies"*) and updates the persistent memory state graph (Risk Profile, Debt Ceiling, Dividend Floor).
- **Grounded & Cited RAG Queries**: Grounded strictly in ingested Screener.in fundamentals and Indian financial media news (Economic Times, Moneycontrol, LiveMint, Business Standard).
- **INR Currency Enforcement**: All stock prices, market caps, target prices, and valuations are formatted in **INR (Rs. / ₹)**.
- **Anti-Hallucination Guardrail**: If asked about an un-ingested stock or un-grounded claim, the agent explicitly responds: *"I don't have that in the ingested data."*

### 2. ⚡ Efficient Engineering & Idempotent Ingestion
- **Idempotent News Ingestion**: Deduplicates overlapping financial news articles using `sha256(URL + Title)` hashing to prevent duplicate chunking and vector store inflation.
- **Concurrent-Safe Ingestion**: Employs ticker locks in the database so concurrent background refreshes and manual follow requests never create race conditions.
- **Algorithmic Screening**: Scores and screens stocks against investor persona rules using multi-factor financial logic before LLM synthesis, avoiding expensive per-stock LLM calls.
- **Automated Rolling Sentiment**: LLM tags each news article with sentiment impact score (-5.0 to +5.0) and key event tags (Earnings Beat, Dividend Announcement, Expansion), automatically updating the stock's rolling sentiment index.

### 3. 👥 OAuth Test Users Configured
Per challenge requirements, the following evaluators are pre-configured:
- `harisankar@sentellent.com`
- `naga@sentellent.com`

---

## 🏗️ System Architecture

```
                                  +------------------------------------+
                                  |   Next.js 14 Frontend Dashboard    |
                                  |   (Dark Mode, Watchlist, Chat UI)  |
                                  +-----------------+------------------+
                                                    |
                                          HTTP / REST API Calls
                                                    v
                                  +------------------------------------+
                                  |       FastAPI Python Backend       |
                                  |    (Auth, Stocks, Ingestion API)   |
                                  +--------+------------------+--------+
                                           |                  |
                    +----------------------+                  +----------------------+
                    |                                                                |
                    v                                                                v
    +-------------------------------+                                +-------------------------------+
    |       LangGraph Agent         |                                |  Ingestion Pipeline (Idempotent)|
    |  - Persona Memory Extractor   |                                |  - Screener.in Fundamentals   |
    |  - Vector RAG Matcher         |                                |  - Indian Financial RSS Feeds |
    |  - Algorithmic Screener       |                                |  - sha256 Article Hashes      |
    |  - Grounded Answer Generator  |                                |  - Ticker Locks               |
    +---------------+---------------+                                +---------------+---------------+
                    |                                                                |
                    +-------------------------------+--------------------------------+
                                                    |
                                                    v
                                  +------------------------------------+
                                  |  PostgreSQL + pgvector Database    |
                                  |  (Stocks, News Chunks, Personas)   |
                                  +------------------------------------+
```

---

## 🚀 Cloud Infrastructure & DevOps (AWS + Terraform + CI/CD)

### AWS Terraform Modules (`terraform/`)
- **VPC & Subnets**: Multi-AZ public and private subnets, Internet Gateway, Security Groups.
- **AWS RDS PostgreSQL (pgvector)**: Provisioned PostgreSQL 15 database instance with vector extension for RAG embeddings.
- **AWS ECR**: Container registries for backend and frontend Docker images.
- **AWS ECS Fargate**: Serverless container orchestration for API backend and web frontend tasks.
- **AWS ALB**: Application Load Balancer with routing rules for `/api/*` and web traffic.

### CI/CD Pipeline (`.github/workflows/deploy.yml`)
1. **Test & Lint**: Runs backend unit tests (`run_tests.py`) on every push/PR.
2. **Docker Build & ECR Push**: Builds multi-stage production Docker images and pushes tagged images to AWS ECR.
3. **Terraform Apply & ECS Deploy**: Validates IaC scripts and triggers rolling deployment update on AWS ECS Fargate.

---

## 🛠️ Running Locally

### Option 1: Quick Local Run (Standard Python)
```bash
# 1. Run Backend Unit Test Suite
python3 backend/tests/run_tests.py

# 2. Start Backend API Server
cd backend
python3 -m app.main

# 3. Start Frontend Dashboard
cd frontend
npm run dev
```

### Option 2: Docker Compose (PostgreSQL + pgvector)
```bash
docker-compose up --build
```
Access the application at `http://localhost:3000` and API docs at `http://localhost:8000/docs`.

---

## 🧪 Verification & Demonstration

1. **Authentication**: Select `harisankar@sentellent.com` or `naga@sentellent.com` from the top navigation bar.
2. **Ingest Indian Stock**: Enter a ticker (e.g. `RELIANCE`, `TCS`, `HDFCBANK`) -> pipeline pulls Screener.in fundamentals + Indian news RSS -> embeds chunks -> updates rolling sentiment index.
3. **Persona Update**: Tell the bot: *"I'm a conservative, dividend-focused investor and I avoid high-debt companies"* -> Agent updates persona memory graph (`Max Debt/Eq: 0.5`, `Min Div Yield: 1.5%`).
4. **Grounded Query**: Ask: *"What's the sentiment on TCS this week?"* -> Agent returns cited analysis in INR with news links.
5. **Personalized Recommendations**: Ask: *"Recommend stocks for my profile."* -> Agent screens out high-debt stocks, ranks top candidates, and returns cited recommendations with 1-line rationales.
6. **Anti-Hallucination Check**: Ask: *"What is the revenue of un-ingested stock XYZ?"* -> Agent responds: *"I don't have that in the ingested data."*

---

## 👨‍💻 Submission Details
- **Role**: Full Stack AI SDE Intern
- **Company**: Sentellent
- **Submission Form**: `forms.gle/qWxabTxLjEkJ2LcEA`
