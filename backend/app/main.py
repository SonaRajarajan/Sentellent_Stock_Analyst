import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.db.database import engine, Base, SessionLocal
from app.db.models import User, Stock, InvestorPersona
from app.api import auth, stocks, agent
from app.ingester.pipeline import run_stock_ingestion

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create tables automatically
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# Enable CORS for Next.js frontend & cloud deployments
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Routers
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(stocks.router, prefix=settings.API_V1_STR)
app.include_router(agent.router, prefix=settings.API_V1_STR)

@app.on_event("startup")
async def seed_initial_universe():
    """
    Seeds initial Indian equity universe (RELIANCE, TCS, HDFCBANK, INFY, TATAMOTORS, ITC)
    and seeds default demo & test user accounts on startup.
    """
    db = SessionLocal()
    try:
        # Seed test users
        for email in settings.TEST_USERS:
            user = db.query(User).filter(User.email == email).first()
            if not user:
                user = User(email=email, full_name=email.split("@")[0].capitalize())
                db.add(user)
                db.commit()
                db.refresh(user)

                persona = InvestorPersona(
                    user_id=user.id,
                    risk_profile="Moderate",
                    max_debt_to_equity=1.5,
                    min_dividend_yield=0.0,
                    summary_rules="Moderate investor seeking balanced growth across Indian equities."
                )
                db.add(persona)
                db.commit()

        # Seed & Ingest core tickers on first launch
        core_tickers = ["RELIANCE", "TCS", "HDFCBANK", "INFY", "TATAMOTORS", "ITC", "COALINDIA", "NTPC"]
        for symbol in core_tickers:
            existing_stock = db.query(Stock).filter(Stock.symbol == symbol).first()
            if not existing_stock:
                logger.info(f"Auto-ingesting core ticker {symbol} into vector store...")
                await run_stock_ingestion(symbol, db)
    except Exception as e:
        logger.error(f"Startup seeding error: {e}")
    finally:
        db.close()

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "test_users": settings.TEST_USERS
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
