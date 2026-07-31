import os
import sqlite3

try:
    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker, declarative_base
    from app.core.config import settings

    connect_args = {"check_same_thread": False} if "sqlite" in settings.DATABASE_URL else {}
    engine = create_engine(settings.DATABASE_URL, connect_args=connect_args, pool_pre_ping=True)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    Base = declarative_base()

    def get_db():
        db = SessionLocal()
        try:
            yield db
        finally:
            db.close()
except ImportError:
    class MockMetadata:
        def create_all(self, *args, **kwargs):
            pass

    class MockBase:
        metadata = MockMetadata()

    Base = MockBase()
    engine = None

    class ModelQuery:
        def __init__(self, conn, model):
            self.conn = conn
            self.model = model

        def filter(self, *args):
            return self

        def first(self):
            all_items = self.all()
            return all_items[0] if all_items else None

        def all(self):
            from app.db.models import User, Stock, UserWatchlist, NewsArticle, NewsChunkVector, InvestorPersona, IngestionLock
            cur = self.conn.cursor()
            table_name = {
                User: "users",
                Stock: "stocks",
                UserWatchlist: "user_watchlists",
                NewsArticle: "news_articles",
                NewsChunkVector: "news_chunk_vectors",
                InvestorPersona: "investor_personas",
                IngestionLock: "ingestion_locks"
            }.get(self.model, "stocks")
            
            cur.execute(f"SELECT * FROM {table_name}")
            rows = cur.fetchall()
            results = []
            for r in rows:
                if self.model == Stock:
                    obj = Stock(symbol=r['symbol'], name=r['name'], sector=r['sector'],
                                debt_to_equity=r['debt_to_equity'], dividend_yield_pct=r['dividend_yield_pct'],
                                current_price_inr=r['current_price_inr'], rolling_sentiment_score=r['rolling_sentiment_score'],
                                sentiment_label=r['sentiment_label'], roce_pct=r['roce_pct'], roe_pct=r['roe_pct'],
                                pe_ratio=r['pe_ratio'], market_cap_cr=r['market_cap_cr'])
                    results.append(obj)
                elif self.model == User:
                    obj = User(email=r['email'], full_name=r['full_name'], id=r['id'])
                    results.append(obj)
                elif self.model == InvestorPersona:
                    obj = InvestorPersona(user_id=r['user_id'], risk_profile=r['risk_profile'],
                                          max_debt_to_equity=r['max_debt_to_equity'], min_dividend_yield=r['min_dividend_yield'])
                    results.append(obj)
            return results

        def order_by(self, *args):
            return self

    class StandardSqliteSession:
        def __init__(self, db_path="sql_app.db"):
            self.conn = sqlite3.connect(db_path)
            self.conn.row_factory = sqlite3.Row
            self._init_tables()

        def _init_tables(self):
            cur = self.conn.cursor()
            cur.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT UNIQUE NOT NULL,
                full_name TEXT,
                is_active INTEGER DEFAULT 1,
                created_at TEXT
            )""")
            cur.execute("""
            CREATE TABLE IF NOT EXISTS stocks (
                symbol TEXT PRIMARY KEY,
                nse_id TEXT, bse_id TEXT, name TEXT NOT NULL, sector TEXT,
                market_cap_cr REAL DEFAULT 0.0, pe_ratio REAL DEFAULT 0.0,
                debt_to_equity REAL DEFAULT 0.0, roce_pct REAL DEFAULT 0.0,
                roe_pct REAL DEFAULT 0.0, dividend_yield_pct REAL DEFAULT 0.0,
                sales_growth_pct REAL DEFAULT 0.0, profit_growth_pct REAL DEFAULT 0.0,
                high_52w REAL DEFAULT 0.0, low_52w REAL DEFAULT 0.0,
                current_price_inr REAL DEFAULT 0.0, rolling_sentiment_score REAL DEFAULT 0.0,
                sentiment_label TEXT DEFAULT 'Neutral', last_ingested_at TEXT
            )""")
            cur.execute("""
            CREATE TABLE IF NOT EXISTS user_watchlists (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER, stock_symbol TEXT, followed_at TEXT,
                UNIQUE(user_id, stock_symbol)
            )""")
            cur.execute("""
            CREATE TABLE IF NOT EXISTS news_articles (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                hash_id TEXT UNIQUE NOT NULL, stock_symbol TEXT NOT NULL,
                title TEXT NOT NULL, url TEXT NOT NULL, source TEXT NOT NULL,
                published_at TEXT, raw_text TEXT NOT NULL, llm_sentiment TEXT DEFAULT 'Neutral',
                impact_score REAL DEFAULT 0.0, key_event_tag TEXT
            )""")
            cur.execute("""
            CREATE TABLE IF NOT EXISTS news_chunk_vectors (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                article_id INTEGER, stock_symbol TEXT, chunk_text TEXT,
                chunk_index INTEGER DEFAULT 0, vector_json TEXT
            )""")
            cur.execute("""
            CREATE TABLE IF NOT EXISTS investor_personas (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER UNIQUE NOT NULL, risk_profile TEXT DEFAULT 'Moderate',
                debt_preference TEXT DEFAULT 'Any', dividend_preference TEXT DEFAULT 'Any',
                growth_preference TEXT DEFAULT 'Any', max_debt_to_equity REAL DEFAULT 1.5,
                min_dividend_yield REAL DEFAULT 0.0, summary_rules TEXT,
                persona_vector_json TEXT, updated_at TEXT
            )""")
            cur.execute("""
            CREATE TABLE IF NOT EXISTS ingestion_locks (
                symbol TEXT PRIMARY KEY, locked_at TEXT, status TEXT DEFAULT 'RUNNING'
            )""")
            self.conn.commit()

        def query(self, model):
            return ModelQuery(self.conn, model)

        def add(self, item):
            item.save(self.conn)

        def add_all(self, items):
            for item in items:
                item.save(self.conn)

        def commit(self):
            self.conn.commit()

        def flush(self):
            pass

        def close(self):
            self.conn.close()

    def SessionLocal():
        return StandardSqliteSession()

    def get_db():
        db = SessionLocal()
        try:
            yield db
        finally:
            db.close()
