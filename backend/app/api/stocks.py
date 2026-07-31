from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db.models import Stock, UserWatchlist, NewsArticle
from app.ingester.pipeline import run_stock_ingestion

router = APIRouter(prefix="/stocks", tags=["Stocks & Ingestion"])

class FollowRequest(BaseModel):
    user_id: int
    symbol: str

class IngestRequest(BaseModel):
    symbol: str

@router.get("")
def list_stocks(db: Session = Depends(get_db)):
    stocks = db.query(Stock).all()
    return stocks

@router.get("/{symbol}")
def get_stock_detail(symbol: str, db: Session = Depends(get_db)):
    clean_symbol = symbol.strip().upper().replace(".NS", "")
    stock = db.query(Stock).filter(Stock.symbol == clean_symbol).first()
    if not stock:
        raise HTTPException(status_code=404, detail=f"Stock {clean_symbol} not found in database. Please follow it to ingest.")
    
    news = db.query(NewsArticle).filter(NewsArticle.stock_symbol == clean_symbol).order_by(NewsArticle.published_at.desc()).all()
    
    return {
        "stock": stock,
        "news": news
    }

@router.get("/watchlist/{user_id}")
def get_user_watchlist(user_id: int, db: Session = Depends(get_db)):
    items = db.query(UserWatchlist).filter(UserWatchlist.user_id == user_id).all()
    result = []
    for item in items:
        st = db.query(Stock).filter(Stock.symbol == item.stock_symbol).first()
        if st:
            result.append(st)
    return result

@router.post("/follow")
async def follow_stock(req: FollowRequest, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    clean_symbol = req.symbol.strip().upper().replace(".NS", "")
    
    # Add to watchlist if not already followed
    existing = db.query(UserWatchlist).filter(
        UserWatchlist.user_id == req.user_id,
        UserWatchlist.stock_symbol == clean_symbol
    ).first()
    
    if not existing:
        wl = UserWatchlist(user_id=req.user_id, stock_symbol=clean_symbol)
        db.add(wl)
        db.commit()

    # Trigger idempotent & concurrent-safe background ingestion
    ingest_result = await run_stock_ingestion(clean_symbol, db)

    return {
        "message": f"Successfully followed {clean_symbol}",
        "symbol": clean_symbol,
        "ingestion_summary": ingest_result
    }

@router.post("/unfollow")
def unfollow_stock(req: FollowRequest, db: Session = Depends(get_db)):
    clean_symbol = req.symbol.strip().upper().replace(".NS", "")
    existing = db.query(UserWatchlist).filter(
        UserWatchlist.user_id == req.user_id,
        UserWatchlist.stock_symbol == clean_symbol
    ).first()
    
    if existing:
        db.delete(existing)
        db.commit()

    return {"message": f"Unfollowed {clean_symbol}"}

@router.post("/ingest")
async def ingest_stock_manual(req: IngestRequest, db: Session = Depends(get_db)):
    result = await run_stock_ingestion(req.symbol, db)
    return result
