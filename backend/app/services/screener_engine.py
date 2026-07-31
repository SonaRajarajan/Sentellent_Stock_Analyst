import logging
from typing import List, Dict, Any
from app.db.models import Stock, InvestorPersona, NewsArticle

logger = logging.getLogger(__name__)

def screen_and_rank_stocks(persona: InvestorPersona, db, limit: int = 5) -> List[Dict[str, Any]]:
    """
    Algorithmic stock screener & persona ranker.
    Screens stocks against persona constraints (debt ceiling, dividend yield floor, risk profile)
    and scores top candidates using multi-factor financial logic.
    Avoids expensive brute-force per-stock LLM calls.
    """
    all_stocks = db.query(Stock).all()
    if not all_stocks:
        return []

    # Persona constraint parameters
    max_debt = persona.max_debt_to_equity if persona and persona.max_debt_to_equity else 1.5
    min_div = persona.min_dividend_yield if persona and persona.min_dividend_yield else 0.0
    risk = (persona.risk_profile or "Moderate").lower()

    if "conservative" in risk:
        max_debt = min(max_debt, 0.5)  # Enforce strict debt cap for conservative investors
        min_div = max(min_div, 1.0)    # Favor income-generating dividend stocks

    screened_candidates = []
    
    for s in all_stocks:
        # Hard Rule Screening (Exclusion criteria)
        if s.debt_to_equity > max_debt and "bank" not in (s.sector or "").lower():
            logger.info(f"Screening out {s.symbol}: Debt/Equity {s.debt_to_equity} exceeds threshold {max_debt}")
            continue
            
        if s.dividend_yield_pct < min_div:
            logger.info(f"Screening out {s.symbol}: Dividend yield {s.dividend_yield_pct}% below target {min_div}%")
            continue

        # Multi-factor Composite Scoring Algorithm (0 - 100)
        sentiment_component = ((s.rolling_sentiment_score + 5.0) / 10.0) * 25.0
        quality_component = min(25.0, (s.roce_pct + s.roe_pct) * 0.35)
        div_component = min(20.0, s.dividend_yield_pct * 4.0)
        growth_component = min(20.0, (s.sales_growth_pct + s.profit_growth_pct) * 0.25)
        debt_bonus = max(0.0, (1.0 - s.debt_to_equity) * 10.0) if "bank" not in (s.sector or "").lower() else 5.0

        composite_score = round(sentiment_component + quality_component + div_component + growth_component + debt_bonus, 1)

        # Fetch latest cited news article for ground truth backing
        latest_news = db.query(NewsArticle).filter(NewsArticle.stock_symbol == s.symbol).first()
        citation = {
            "title": getattr(latest_news, 'title', f"Fundamentals of {s.name}"),
            "source": getattr(latest_news, 'source', "Screener.in"),
            "url": getattr(latest_news, 'url', f"https://www.screener.in/company/{s.symbol}/"),
            "key_event": getattr(latest_news, 'key_event_tag', "Financial Fundamentals")
        }

        # Build 1-line rationales grounded in exact numbers (in INR)
        rationale = (
            f"Trading at Rs {s.current_price_inr:,.2f} with P/E of {s.pe_ratio:.1f}, low Debt/Equity of {s.debt_to_equity:.2f}, "
            f"ROCE of {s.roce_pct:.1f}%, Dividend Yield of {s.dividend_yield_pct:.2f}%, and {s.sentiment_label.lower()} sentiment score ({s.rolling_sentiment_score:+.1f})."
        )

        screened_candidates.append({
            "symbol": s.symbol,
            "name": s.name,
            "sector": s.sector,
            "current_price_inr": s.current_price_inr,
            "pe_ratio": s.pe_ratio,
            "debt_to_equity": s.debt_to_equity,
            "roce_pct": s.roce_pct,
            "dividend_yield_pct": s.dividend_yield_pct,
            "rolling_sentiment": s.rolling_sentiment_score,
            "sentiment_label": s.sentiment_label,
            "composite_score": composite_score,
            "rationale": rationale,
            "citation": citation
        })

    screened_candidates.sort(key=lambda x: x["composite_score"], reverse=True)
    return screened_candidates[:limit]
