import datetime

try:
    from sqlalchemy import Column, Integer, String, Float, DateTime, Text, Boolean, ForeignKey, UniqueConstraint
    from sqlalchemy.orm import relationship
    from app.db.database import Base

    class User(Base):
        __tablename__ = "users"
        id = Column(Integer, primary_key=True, index=True)
        email = Column(String, unique=True, index=True, nullable=False)
        full_name = Column(String, nullable=True)
        is_active = Column(Boolean, default=True)
        created_at = Column(DateTime, default=datetime.datetime.utcnow)

        watchlist = relationship("UserWatchlist", back_populates="user", cascade="all, delete-orphan")
        persona = relationship("InvestorPersona", back_populates="user", uselist=False)

    class Stock(Base):
        __tablename__ = "stocks"
        symbol = Column(String, primary_key=True, index=True)
        nse_id = Column(String, nullable=True)
        bse_id = Column(String, nullable=True)
        name = Column(String, nullable=False)
        sector = Column(String, nullable=True)
        market_cap_cr = Column(Float, default=0.0)
        pe_ratio = Column(Float, default=0.0)
        debt_to_equity = Column(Float, default=0.0)
        roce_pct = Column(Float, default=0.0)
        roe_pct = Column(Float, default=0.0)
        dividend_yield_pct = Column(Float, default=0.0)
        sales_growth_pct = Column(Float, default=0.0)
        profit_growth_pct = Column(Float, default=0.0)
        high_52w = Column(Float, default=0.0)
        low_52w = Column(Float, default=0.0)
        current_price_inr = Column(Float, default=0.0)
        rolling_sentiment_score = Column(Float, default=0.0)
        sentiment_label = Column(String, default="Neutral")
        last_ingested_at = Column(DateTime, nullable=True)

    class UserWatchlist(Base):
        __tablename__ = "user_watchlists"
        id = Column(Integer, primary_key=True, index=True)
        user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
        stock_symbol = Column(String, ForeignKey("stocks.symbol"), nullable=False)
        followed_at = Column(DateTime, default=datetime.datetime.utcnow)

        __table_args__ = (UniqueConstraint('user_id', 'stock_symbol', name='_user_stock_uc'),)
        user = relationship("User", back_populates="watchlist")
        stock = relationship("Stock")

    class NewsArticle(Base):
        __tablename__ = "news_articles"
        id = Column(Integer, primary_key=True, index=True)
        hash_id = Column(String, unique=True, index=True, nullable=False)
        stock_symbol = Column(String, ForeignKey("stocks.symbol"), nullable=False)
        title = Column(String, nullable=False)
        url = Column(String, nullable=False)
        source = Column(String, nullable=False)
        published_at = Column(DateTime, default=datetime.datetime.utcnow)
        raw_text = Column(Text, nullable=False)
        llm_sentiment = Column(String, default="Neutral")
        impact_score = Column(Float, default=0.0)
        key_event_tag = Column(String, nullable=True)

    class NewsChunkVector(Base):
        __tablename__ = "news_chunk_vectors"
        id = Column(Integer, primary_key=True, index=True)
        article_id = Column(Integer, ForeignKey("news_articles.id"), nullable=False)
        stock_symbol = Column(String, index=True, nullable=False)
        chunk_text = Column(Text, nullable=False)
        chunk_index = Column(Integer, default=0)
        vector_json = Column(Text, nullable=False)

    class InvestorPersona(Base):
        __tablename__ = "investor_personas"
        id = Column(Integer, primary_key=True, index=True)
        user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
        risk_profile = Column(String, default="Moderate")
        debt_preference = Column(String, default="Any")
        dividend_preference = Column(String, default="Any")
        growth_preference = Column(String, default="Any")
        max_debt_to_equity = Column(Float, default=1.5)
        min_dividend_yield = Column(Float, default=0.0)
        summary_rules = Column(Text, default="Default moderate investor seeking balanced growth.")
        persona_vector_json = Column(Text, nullable=True)
        updated_at = Column(DateTime, default=datetime.datetime.utcnow)

        user = relationship("User", back_populates="persona")

    class IngestionLock(Base):
        __tablename__ = "ingestion_locks"
        symbol = Column(String, primary_key=True)
        locked_at = Column(DateTime, default=datetime.datetime.utcnow)
        status = Column(String, default="RUNNING")

except ImportError:
    class User:
        id = None
        email = None
        full_name = None
        def __init__(self, email, full_name="User", id=None, is_active=True, created_at=None):
            self.id = id
            self.email = email
            self.full_name = full_name
            self.is_active = is_active
            self.created_at = created_at or datetime.datetime.now(datetime.timezone.utc).isoformat()

        def save(self, conn):
            cur = conn.cursor()
            cur.execute("INSERT OR REPLACE INTO users (email, full_name, is_active, created_at) VALUES (?, ?, ?, ?)",
                        (self.email, self.full_name, 1 if self.is_active else 0, str(self.created_at)))
            self.id = cur.lastrowid

    class Stock:
        symbol = None
        name = None
        def __init__(self, symbol, name, sector="Equities", nse_id=None, bse_id=None,
                     market_cap_cr=0.0, pe_ratio=0.0, debt_to_equity=0.0, roce_pct=0.0,
                     roe_pct=0.0, dividend_yield_pct=0.0, sales_growth_pct=0.0,
                     profit_growth_pct=0.0, high_52w=0.0, low_52w=0.0, current_price_inr=0.0,
                     rolling_sentiment_score=0.0, sentiment_label="Neutral", last_ingested_at=None):
            self.symbol = symbol
            self.name = name
            self.sector = sector
            self.nse_id = nse_id or symbol
            self.bse_id = bse_id or "500000"
            self.market_cap_cr = market_cap_cr
            self.pe_ratio = pe_ratio
            self.debt_to_equity = debt_to_equity
            self.roce_pct = roce_pct
            self.roe_pct = roe_pct
            self.dividend_yield_pct = dividend_yield_pct
            self.sales_growth_pct = sales_growth_pct
            self.profit_growth_pct = profit_growth_pct
            self.high_52w = high_52w
            self.low_52w = low_52w
            self.current_price_inr = current_price_inr
            self.rolling_sentiment_score = rolling_sentiment_score
            self.sentiment_label = sentiment_label
            self.last_ingested_at = last_ingested_at or datetime.datetime.now(datetime.timezone.utc).isoformat()

        def save(self, conn):
            cur = conn.cursor()
            cur.execute("""INSERT OR REPLACE INTO stocks
                (symbol, nse_id, bse_id, name, sector, market_cap_cr, pe_ratio, debt_to_equity,
                 roce_pct, roe_pct, dividend_yield_pct, sales_growth_pct, profit_growth_pct,
                 high_52w, low_52w, current_price_inr, rolling_sentiment_score, sentiment_label, last_ingested_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                (self.symbol, self.nse_id, self.bse_id, self.name, self.sector,
                 self.market_cap_cr, self.pe_ratio, self.debt_to_equity, self.roce_pct,
                 self.roe_pct, self.dividend_yield_pct, self.sales_growth_pct, self.profit_growth_pct,
                 self.high_52w, self.low_52w, self.current_price_inr, self.rolling_sentiment_score,
                 self.sentiment_label, str(self.last_ingested_at)))

    class UserWatchlist:
        id = None
        user_id = None
        stock_symbol = None
        def __init__(self, user_id, stock_symbol, id=None, followed_at=None):
            self.id = id
            self.user_id = user_id
            self.stock_symbol = stock_symbol
            self.followed_at = followed_at or datetime.datetime.now(datetime.timezone.utc).isoformat()

        def save(self, conn):
            cur = conn.cursor()
            cur.execute("INSERT OR IGNORE INTO user_watchlists (user_id, stock_symbol, followed_at) VALUES (?, ?, ?)",
                        (self.user_id, self.stock_symbol, str(self.followed_at)))
            self.id = cur.lastrowid

    class NewsArticle:
        id = None
        hash_id = None
        stock_symbol = None
        def __init__(self, hash_id, stock_symbol, title, url, source, raw_text,
                     id=None, published_at=None, llm_sentiment="Neutral", impact_score=0.0, key_event_tag="General"):
            self.id = id
            self.hash_id = hash_id
            self.stock_symbol = stock_symbol
            self.title = title
            self.url = url
            self.source = source
            self.raw_text = raw_text
            self.published_at = published_at or datetime.datetime.now(datetime.timezone.utc).isoformat()
            self.llm_sentiment = llm_sentiment
            self.impact_score = impact_score
            self.key_event_tag = key_event_tag

        def save(self, conn):
            cur = conn.cursor()
            cur.execute("""INSERT OR REPLACE INTO news_articles
                (hash_id, stock_symbol, title, url, source, published_at, raw_text, llm_sentiment, impact_score, key_event_tag)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                (self.hash_id, self.stock_symbol, self.title, self.url, self.source,
                 str(self.published_at), self.raw_text, self.llm_sentiment, self.impact_score, self.key_event_tag))
            self.id = cur.lastrowid

    class NewsChunkVector:
        id = None
        article_id = None
        stock_symbol = None
        def __init__(self, article_id, stock_symbol, chunk_text, vector_json, id=None, chunk_index=0):
            self.id = id
            self.article_id = article_id
            self.stock_symbol = stock_symbol
            self.chunk_text = chunk_text
            self.chunk_index = chunk_index
            self.vector_json = vector_json

        def save(self, conn):
            cur = conn.cursor()
            cur.execute("""INSERT INTO news_chunk_vectors
                (article_id, stock_symbol, chunk_text, chunk_index, vector_json)
                VALUES (?, ?, ?, ?, ?)""",
                (self.article_id, self.stock_symbol, self.chunk_text, self.chunk_index, str(self.vector_json)))
            self.id = cur.lastrowid

    class InvestorPersona:
        id = None
        user_id = None
        def __init__(self, user_id, risk_profile="Moderate", debt_preference="Any", dividend_preference="Any",
                     growth_preference="Any", max_debt_to_equity=1.5, min_dividend_yield=0.0,
                     summary_rules="Moderate investor profile.", persona_vector_json=None, id=None, updated_at=None):
            self.id = id
            self.user_id = user_id
            self.risk_profile = risk_profile
            self.debt_preference = debt_preference
            self.dividend_preference = dividend_preference
            self.growth_preference = growth_preference
            self.max_debt_to_equity = max_debt_to_equity
            self.min_dividend_yield = min_dividend_yield
            self.summary_rules = summary_rules
            self.persona_vector_json = persona_vector_json
            self.updated_at = updated_at or datetime.datetime.now(datetime.timezone.utc).isoformat()

        def save(self, conn):
            cur = conn.cursor()
            cur.execute("""INSERT OR REPLACE INTO investor_personas
                (user_id, risk_profile, debt_preference, dividend_preference, growth_preference,
                 max_debt_to_equity, min_dividend_yield, summary_rules, persona_vector_json, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                (self.user_id, self.risk_profile, self.debt_preference, self.dividend_preference, self.growth_preference,
                 self.max_debt_to_equity, self.min_dividend_yield, self.summary_rules, str(self.persona_vector_json), str(self.updated_at)))

    class IngestionLock:
        symbol = None
        def __init__(self, symbol, status="RUNNING", locked_at=None):
            self.symbol = symbol
            self.status = status
            self.locked_at = locked_at or datetime.datetime.now(datetime.timezone.utc).isoformat()

        def save(self, conn):
            cur = conn.cursor()
            cur.execute("INSERT OR REPLACE INTO ingestion_locks (symbol, locked_at, status) VALUES (?, ?, ?)",
                        (self.symbol, str(self.locked_at), self.status))
