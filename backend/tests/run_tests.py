import unittest
import sys
import os

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.ingester.news_rss import generate_article_hash, tag_article_sentiment, chunk_text
from app.services.vector_store import text_to_embedding, cosine_similarity, rank_vector_matches
from app.agent.memory import extract_and_update_persona
from app.services.screener_engine import screen_and_rank_stocks
from app.db.database import Base, engine, SessionLocal
from app.db.models import Stock, InvestorPersona, User, NewsArticle

class TestStockAnalystBackend(unittest.TestCase):

    def setUp(self):
        Base.metadata.create_all(bind=engine)
        self.db = SessionLocal()

    def tearDown(self):
        self.db.close()

    def test_article_hashing_and_idempotency(self):
        url = "https://economictimes.indiatimes.com/news/123"
        title = "TCS Reports Strong Q3 Revenue Growth"
        hash1 = generate_article_hash(url, title)
        hash2 = generate_article_hash(url, title)
        self.assertEqual(hash1, hash2, "Hashes must be strictly deterministic")
        self.assertEqual(len(hash1), 64)

    def test_sentiment_tagger_logic(self):
        title = "Reliance Industries Net Profit Rises 15% led by Jio expansion"
        text = "Company announces dividend beat and revenue growth"
        sentiment, impact, event_tag = tag_article_sentiment(title, text)
        self.assertEqual(sentiment, "Positive")
        self.assertGreater(impact, 0.0)

    def test_vector_embedding_and_cosine_similarity(self):
        vec1 = text_to_embedding("conservative dividend stocks low debt")
        vec2 = text_to_embedding("conservative low debt company paying dividend")
        vec3 = text_to_embedding("speculative crypto high risk biotech")
        
        sim_high = cosine_similarity(vec1, vec2)
        sim_low = cosine_similarity(vec1, vec3)
        self.assertGreater(sim_high, sim_low, "Similar financial text must yield higher cosine similarity")

    def test_conservative_screening_engine(self):
        user = User(email="test_conservative@sentellent.com", full_name="Conservative Investor")
        self.db.add(user)
        self.db.commit()

        persona = InvestorPersona(
            user_id=user.id,
            risk_profile="Conservative",
            max_debt_to_equity=0.5,
            min_dividend_yield=1.0
        )
        self.db.add(persona)

        # Low Debt Stock
        s1 = Stock(
            symbol="TCS_TEST", name="Tata Consultancy Services", sector="IT",
            debt_to_equity=0.08, dividend_yield_pct=2.15, current_price_inr=3915.20,
            rolling_sentiment_score=3.5, sentiment_label="Bullish", roce_pct=58.4, roe_pct=51.2
        )
        # High Debt Stock
        s2 = Stock(
            symbol="DEBT_TEST", name="High Debt Corp", sector="Industrial",
            debt_to_equity=2.45, dividend_yield_pct=0.50, current_price_inr=150.00,
            rolling_sentiment_score=1.0, sentiment_label="Neutral", roce_pct=8.0, roe_pct=6.0
        )
        self.db.add_all([s1, s2])
        self.db.commit()

        ranked = screen_and_rank_stocks(persona, self.db)
        symbols = [r["symbol"] for r in ranked]
        
        self.assertIn("TCS_TEST", symbols)
        self.assertNotIn("DEBT_TEST", symbols, "High-debt stock must be screened out for conservative persona")

if __name__ == '__main__':
    unittest.main()
