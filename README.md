# Sentellent Equity Chief: Contextual Agentic AI Indian Stock Analyst (RAG)

> **Sentellent Full Stack AI SDE Internship Challenge Submission**  
> **Role:** Full Stack AI SDE Intern | **Company:** Sentellent  
> **Deadline:** Wednesday, Aug 5th, 11:59 PM  
> **GitHub Repository:** [https://github.com/SonaRajarajan/Sentellent_Stock_Analyst](https://github.com/SonaRajarajan/Sentellent_Stock_Analyst)  
> **Submission Link:** [forms.gle/qWxabTxLjEkJ2LcEA](https://forms.gle/qWxabTxLjEkJ2LcEA)

---

## 📐 System Architecture Flowchart

```mermaid
flowchart TD
    subgraph Data Sources ["Data Sources (Indian Market)"]
        Screener["Screener.in (Fundamentals Ratios)"]
        RSS["Indian Financial Media RSS (ET, Moneycontrol, LiveMint)"]
        YFinance["yfinance (.NS Stock Quotes in INR)"]
    end

    subgraph Ingestion Pipeline ["Ingestion Engine (Idempotent & Deduplicated)"]
        SHA256["sha256 Article Content Deduplication"]
        Lock["IngestionLock (Race Condition Prevention)"]
        Embed["Embedding Engine (Text Chunk & Embed)"]
    end

    subgraph Storage ["Cloud Vector Database"]
        PGVector[("Supabase PostgreSQL 15 + pgvector\n(Project: yhfvgvfbugoajgbxddxx)")]
    end

    subgraph Agent Brain ["Agentic Brain (LangGraph State Machine)"]
        MemoryGraph["Learned Investor Persona Graph\n(Risk Profile, Debt Ceiling, Div Yield)"]
        MultiFactor["Multi-Factor Algorithmic Screener\n(Fast Vector & Ratio Ranking)"]
        AntiHallucination["Anti-Hallucination Guardrails\n(Un-sourced Answer Shield)"]
    end

    subgraph Client ["Frontend Interface (Next.js 14)"]
        UI["User Portal & Auth (harisankar@sentellent.com / naga@sentellent.com)\nhttp://localhost:3000"]
    end

    Screener --> SHA256
    RSS --> SHA256
    YFinance --> SHA256
    SHA256 --> Lock
    Lock --> Embed
    Embed --> PGVector

    UI <--> MemoryGraph
    MemoryGraph <--> MultiFactor
    MultiFactor <--> PGVector
    PGVector <--> AntiHallucination
    AntiHallucination -->|Grounded Citations in INR| UI
```

---

## ⚡ Quick Start: Single Terminal Execution

Run **both Frontend and Backend concurrently from a single terminal**:

```bash
# 1. Clone the repository
git clone https://github.com/SonaRajarajan/Sentellent_Stock_Analyst.git
cd Sentellent_Stock_Analyst

# 2. Run both servers from a single terminal command
./run_app.sh
```

- **Frontend Application:** [http://localhost:3000](http://localhost:3000)
- **Backend API Server:** [http://localhost:8000](http://localhost:8000)
- **Interactive API Documentation:** [http://localhost:8000/docs](http://localhost:8000/docs)

---

## 
<img width="1470" height="956" alt="image" src="https://github.com/user-attachments/assets/e1d61f4f-977d-4880-a863-78e367a5d0fc" />


<img width="1470" height="956" alt="image" src="https://github.com/user-attachments/assets/aba9767a-c545-4215-bf89-198f55234ec7" />










## 🔑 Evaluator Access & Test Accounts

Per the challenge specification, pre-configured test user access is available for evaluators:
- `harisankar@sentellent.com`
- `naga@sentellent.com`

---

## 🛠️ Core Tech Stack

- **Frontend:** Next.js 14, React 18, TailwindCSS, Recharts
- **Backend:** Python 3.11+, FastAPI, Uvicorn
- **AI & Agent Framework:** LangChain, LangGraph State Machine
- **Vector Database:** PostgreSQL 15 + `pgvector` extension on Supabase Cloud
- **DevOps:** Docker, Docker Compose, Terraform IaC, GitHub Actions CI/CD

---

*Built for the Sentellent Full Stack AI SDE Internship Challenge.*
