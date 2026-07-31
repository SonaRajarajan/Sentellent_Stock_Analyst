import json
import logging
from typing import List, Dict, Any, TypedDict, Optional
from app.db.models import Stock, NewsArticle, NewsChunkVector, InvestorPersona
from app.agent.memory import extract_and_update_persona
from app.services.screener_engine import screen_and_rank_stocks
from app.services.vector_store import rank_vector_matches

logger = logging.getLogger(__name__)

def run_agent_workflow(user_id: int, user_query: str, db) -> Dict[str, Any]:
    """
    Executes the Agentic RAG Workflow for Indian Stock Analysis.
    Node 1: Extract & Update Investor Persona Memory.
    Node 2: Retrieve Relevant Vector Chunks & Stock Fundamentals.
    Node 3: Screen & Match Stocks against Persona rules.
    Node 4: Synthesize Grounded, Cited Response in INR (or return Anti-Hallucination fallback).
    """
    # Node 1: Memory & Persona Update
    persona_info = extract_and_update_persona(user_id, user_query, db)
    persona_obj = db.query(InvestorPersona).filter(InvestorPersona.user_id == user_id).first()

    query_lower = user_query.lower()
    citations = []
    retrieved_stocks = []
    recommendations = []

    # Node 2: Check for explicit stock tickers mentioned in query
    all_stocks = db.query(Stock).all()
    mentioned_symbols = [s.symbol for s in all_stocks if s.symbol.lower() in query_lower]
    
    # Fetch vector chunk matches
    all_chunk_records = []
    chunk_objs = db.query(NewsChunkVector).all()
    for c in chunk_objs:
        art = db.query(NewsArticle).filter(NewsArticle.id == c.article_id).first()
        all_chunk_records.append({
            "id": c.id,
            "stock_symbol": c.stock_symbol,
            "chunk_text": c.chunk_text,
            "vector_json": c.vector_json,
            "title": art.title if art else "Financial News",
            "url": art.url if art else "#",
            "source": art.source if art else "Financial Media",
            "published_at": str(getattr(art, 'published_at', ''))
        })

    top_chunks = rank_vector_matches(user_query, all_chunk_records, top_k=4)

    for chunk in top_chunks:
        citations.append({
            "id": f"source-{len(citations)+1}",
            "title": chunk["title"],
            "url": chunk["url"],
            "source": chunk["source"],
            "text": chunk["chunk_text"],
            "symbol": chunk["stock_symbol"]
        })

    # Node 3: Screening & Recommendation Branching
    is_rec_query = any(k in query_lower for k in ["recommend", "buy", "pick", "suggest", "portfolio", "what should i buy"])
    if is_rec_query:
        recommendations = screen_and_rank_stocks(persona_obj, db, limit=4)
        for r in recommendations:
            if r.get("citation"):
                cit = r["citation"]
                citations.append({
                    "id": f"source-{len(citations)+1}",
                    "title": cit.get("title", f"{r['name']} Fundamentals"),
                    "url": cit.get("url", "#"),
                    "source": cit.get("source", "Screener.in"),
                    "text": r["rationale"],
                    "symbol": r["symbol"]
                })

    # Node 4: Answer Synthesis with Grounding & INR Enforcement
    words_in_query = [w.upper() for w in user_query.split()]
    unknown_tickers = [w for w in words_in_query if len(w) >= 3 and w.isupper() and w.isalpha() and w not in [s.symbol for s in all_stocks]]
    
    if unknown_tickers and "sentiment" in query_lower and not top_chunks:
        final_answer = f"I don't have that in the ingested data. The stock symbol **{unknown_tickers[0]}** has not been ingested yet. Please follow this ticker to ingest its fundamentals and recent news into the vector store."
        return {
            "answer": final_answer,
            "citations": [],
            "recommendations": [],
            "persona": persona_info
        }

    # Case A: Recommendation Response
    if is_rec_query and recommendations:
        lines = [
            f"Based on your **{persona_obj.risk_profile}** investor persona (Max Debt/Equity: **{persona_obj.max_debt_to_equity}**, Min Dividend Yield: **{persona_obj.min_dividend_yield}%**), here are the top screened Indian equity picks matched against ingested fundamentals and sentiment:\n"
        ]
        for i, rec in enumerate(recommendations, 1):
            lines.append(
                f"**{i}. {rec['symbol']} ({rec['name']})** - {rec['sector']}\n"
                f"- **Current Price:** Rs {rec['current_price_inr']:,.2f}\n"
                f"- **Fundamentals:** P/E {rec['pe_ratio']:.1f} | Debt/Equity {rec['debt_to_equity']:.2f} | ROCE {rec['roce_pct']:.1f}% | Dividend Yield {rec['dividend_yield_pct']:.2f}%\n"
                f"- **Rolling News Sentiment:** {rec['sentiment_label']} ({rec['rolling_sentiment']:+.1f})\n"
                f"- **Rationale:** {rec['rationale']} [Source {i}]\n"
            )
        lines.append("\n*All figures are grounded in ingested Screener.in fundamentals and Indian financial RSS feeds in INR (Rs.).*")
        final_answer = "\n".join(lines)

    # Case B: Specific Ticker Query
    elif mentioned_symbols:
        target_sym = mentioned_symbols[0]
        st = db.query(Stock).filter(Stock.symbol == target_sym).first()
        recent_news = db.query(NewsArticle).filter(NewsArticle.stock_symbol == target_sym).all()
        
        lines = [
            f"### Ingested Analysis for {st.name} ({st.symbol})\n",
            f"- **Current Market Price:** Rs {st.current_price_inr:,.2f} (52W Range: Rs {st.low_52w:,.2f} - Rs {st.high_52w:,.2f})",
            f"- **Market Cap:** Rs {st.market_cap_cr:,.0f} Cr",
            f"- **Valuation & Quality:** P/E Ratio {st.pe_ratio:.1f} | Debt to Equity {st.debt_to_equity:.2f} | ROCE {st.roce_pct:.1f}% | Dividend Yield {st.dividend_yield_pct:.2f}%",
            f"- **Rolling Sentiment Index:** **{st.sentiment_label}** ({st.rolling_sentiment_score:+.1f} / 5.0)\n",
            f"#### Recent Ingested News & Impact:"
        ]
        
        for idx, item in enumerate(recent_news[:3], 1):
            lines.append(f"{idx}. **{item.title}** ({item.source}) - Tag: *{item.key_event_tag}*, Sentiment: *{item.llm_sentiment}* [Source {idx}]")
            lines.append(f"   > \"{item.raw_text[:200]}...\"")
            
        final_answer = "\n".join(lines)

    # Case C: General RAG QA grounded in retrieved chunks
    elif top_chunks:
        lines = [f"Here is the grounded analysis retrieved from your vector store:\n"]
        for idx, chunk in enumerate(top_chunks, 1):
            lines.append(f"**[{chunk['stock_symbol']}] {chunk['title']}** ({chunk['source']}):")
            lines.append(f"> {chunk['chunk_text']} [Source {idx}]\n")
        lines.append("*All monetary claims are expressed in Indian Rupees (Rs. / ₹).*")
        final_answer = "\n".join(lines)

    else:
        final_answer = "I don't have that in the ingested data. Please follow stock tickers (e.g., RELIANCE, TCS, HDFCBANK) so I can ingest their latest Screener.in fundamentals and financial news RSS into the vector store."

    return {
        "answer": final_answer,
        "citations": citations,
        "recommendations": recommendations,
        "persona": persona_info
    }
