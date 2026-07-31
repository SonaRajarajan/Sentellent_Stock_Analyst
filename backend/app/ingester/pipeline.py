import json
import logging
import datetime
from sqlalchemy.orm import Session
from app.db.models import Stock, NewsArticle, NewsChunkVector, IngestionLock
from app.ingester.screener import fetch_screener_fundamentals
from app.ingester.news_rss import fetch_stock_news, chunk_text
from app.services.vector_store import text_to_embedding

logger = logging.getLogger(__name__)

async def run_stock_ingestion(symbol: str, db: Session) -> dict:
    """
    Idempotent and concurrent-safe ingestion pipeline for an Indian stock ticker.
    1. Acquires ingestion lock to prevent race conditions.
    2. Fetches & updates screener fundamentals.
    3. Fetches Indian news RSS articles, deduplicates via sha256 hash_id.
    4. Chunks, embeds, and stores new article vectors.
    5. Updates stock rolling sentiment score.
    """
    clean_symbol = symbol.strip().upper().replace(".NS", "")
    
    # 1. Concurrency Check via Ingestion Lock
    lock = db.query(IngestionLock).filter(IngestionLock.symbol == clean_symbol).first()
    if lock and lock.status == "RUNNING":
        # Check lock staleness (if older than 2 minutes, reset lock)
        if datetime.datetime.utcnow() - lock.locked_at < datetime.timedelta(minutes=2):
            logger.info(f"Ingestion for {clean_symbol} is already running concurrently. Skipping to avoid race conditions.")
            return {"status": "skipped", "reason": f"Concurrent ingestion active for {clean_symbol}"}
        else:
            lock.locked_at = datetime.datetime.utcnow()
            db.commit()
    elif not lock:
        lock = IngestionLock(symbol=clean_symbol, status="RUNNING", locked_at=datetime.datetime.utcnow())
        db.add(lock)
        db.commit()
    else:
        lock.status = "RUNNING"
        lock.locked_at = datetime.datetime.utcnow()
        db.commit()

    try:
        # 2. Fetch & Save Screener Fundamentals
        fund = await fetch_screener_fundamentals(clean_symbol)
        stock = db.query(Stock).filter(Stock.symbol == clean_symbol).first()
        if not stock:
            stock = Stock(
                symbol=clean_symbol,
                nse_id=fund.get("nse_id", clean_symbol),
                bse_id=fund.get("bse_id", "500000"),
                name=fund.get("name", f"{clean_symbol} Ltd"),
                sector=fund.get("sector", "Equities"),
                market_cap_cr=fund.get("market_cap_cr", 0.0),
                pe_ratio=fund.get("pe_ratio", 0.0),
                debt_to_equity=fund.get("debt_to_equity", 0.0),
                roce_pct=fund.get("roce_pct", 0.0),
                roe_pct=fund.get("roe_pct", 0.0),
                dividend_yield_pct=fund.get("dividend_yield_pct", 0.0),
                sales_growth_pct=fund.get("sales_growth_pct", 0.0),
                profit_growth_pct=fund.get("profit_growth_pct", 0.0),
                high_52w=fund.get("high_52w", 0.0),
                low_52w=fund.get("low_52w", 0.0),
                current_price_inr=fund.get("current_price_inr", 0.0),
                rolling_sentiment_score=0.0,
                last_ingested_at=datetime.datetime.utcnow()
            )
            db.add(stock)
        else:
            stock.nse_id = fund.get("nse_id", stock.nse_id)
            stock.bse_id = fund.get("bse_id", stock.bse_id)
            stock.name = fund.get("name", stock.name)
            stock.sector = fund.get("sector", stock.sector)
            stock.market_cap_cr = fund.get("market_cap_cr", stock.market_cap_cr)
            stock.pe_ratio = fund.get("pe_ratio", stock.pe_ratio)
            stock.debt_to_equity = fund.get("debt_to_equity", stock.debt_to_equity)
            stock.roce_pct = fund.get("roce_pct", stock.roce_pct)
            stock.roe_pct = fund.get("roe_pct", stock.roe_pct)
            stock.dividend_yield_pct = fund.get("dividend_yield_pct", stock.dividend_yield_pct)
            stock.sales_growth_pct = fund.get("sales_growth_pct", stock.sales_growth_pct)
            stock.profit_growth_pct = fund.get("profit_growth_pct", stock.profit_growth_pct)
            stock.high_52w = fund.get("high_52w", stock.high_52w)
            stock.low_52w = fund.get("low_52w", stock.low_52w)
            stock.current_price_inr = fund.get("current_price_inr", stock.current_price_inr)
            stock.last_ingested_at = datetime.datetime.utcnow()
        
        db.commit()

        # 3. Fetch News Articles & Deduplicate (Idempotency)
        news_items = await fetch_stock_news(clean_symbol)
        new_articles_count = 0
        new_chunks_count = 0
        total_impact = 0.0
        article_count = 0

        for item in news_items:
            existing = db.query(NewsArticle).filter(NewsArticle.hash_id == item["hash_id"]).first()
            if not existing:
                article = NewsArticle(
                    hash_id=item["hash_id"],
                    stock_symbol=clean_symbol,
                    title=item["title"],
                    url=item["url"],
                    source=item["source"],
                    published_at=item["published_at"],
                    raw_text=item["raw_text"],
                    llm_sentiment=item["llm_sentiment"],
                    impact_score=item["impact_score"],
                    key_event_tag=item["key_event_tag"]
                )
                db.add(article)
                db.flush() # get article.id
                new_articles_count += 1
                
                # Chunk & Vector Embed
                chunks = chunk_text(item["raw_text"])
                for idx, chunk in enumerate(chunks):
                    vec = text_to_embedding(f"{item['title']} {chunk}")
                    chunk_vector = NewsChunkVector(
                        article_id=article.id,
                        stock_symbol=clean_symbol,
                        chunk_text=chunk,
                        chunk_index=idx,
                        vector_json=json.dumps(vec)
                    )
                    db.add(chunk_vector)
                    new_chunks_count += 1
                    
            total_impact += item["impact_score"]
            article_count += 1

        db.commit()

        # 4. Calculate Rolling Stock Sentiment
        all_articles = db.query(NewsArticle).filter(NewsArticle.stock_symbol == clean_symbol).all()
        if all_articles:
            avg_impact = sum(a.impact_score for a in all_articles) / len(all_articles)
            stock.rolling_sentiment_score = round(max(-5.0, min(5.0, avg_impact)), 2)
            if stock.rolling_sentiment_score > 1.0:
                stock.sentiment_label = "Bullish"
            elif stock.rolling_sentiment_score < -1.0:
                stock.sentiment_label = "Bearish"
            else:
                stock.sentiment_label = "Neutral"
            db.commit()

        # Unlock
        lock.status = "COMPLETED"
        db.commit()

        return {
            "status": "success",
            "symbol": clean_symbol,
            "new_articles_ingested": new_articles_count,
            "new_chunks_indexed": new_chunks_count,
            "rolling_sentiment": stock.rolling_sentiment_score,
            "sentiment_label": stock.sentiment_label
        }

    except Exception as e:
        logger.error(f"Error during ingestion pipeline for {clean_symbol}: {e}", exc_info=True)
        lock.status = "FAILED"
        db.commit()
        raise e
