import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.db.database import Base
from app.db.models import Stock, InvestorPersona, User
from app.services.screener_engine import screen_and_rank_stocks

def test_screener_filters_high_debt_for_conservative_investor():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(bind=engine)
    Session = sessionmaker(bind=engine)
    db = Session()

    # User & Persona
    user = User(email="test@sentellent.com", full_name="Test Investor")
    db.add(user)
    db.commit()

    persona = InvestorPersona(
        user_id=user.id,
        risk_profile="Conservative",
        max_debt_to_equity=0.5,
        min_dividend_yield=1.0
    )
    db.add(persona)

    # Low Debt Stock
    s1 = Stock(
        symbol="TCS", name="Tata Consultancy Services", sector="IT",
        debt_to_equity=0.08, dividend_yield_pct=2.15, current_price_inr=3915.20,
        rolling_sentiment_score=3.5, sentiment_label="Bullish", roce_pct=58.4, roe_pct=51.2
    )
    # High Debt Stock
    s2 = Stock(
        symbol="DEBTY", name="High Debt Corp", sector="Industrial",
        debt_to_equity=2.45, dividend_yield_pct=0.50, current_price_inr=150.00,
        rolling_sentiment_score=1.0, sentiment_label="Neutral", roce_pct=8.0, roe_pct=6.0
    )
    db.add_all([s1, s2])
    db.commit()

    ranked = screen_and_rank_stocks(persona, db)
    symbols = [r["symbol"] for r in ranked]
    
    assert "TCS" in symbols, "Low debt dividend stock should pass conservative filter"
    assert "DEBTY" not in symbols, "High debt stock must be screened out for conservative investor"
