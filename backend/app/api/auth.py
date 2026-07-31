import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from jose import jwt
from app.core.config import settings
from app.db.database import get_db
from app.db.models import User, InvestorPersona

router = APIRouter(prefix="/auth", tags=["Authentication"])

class LoginRequest(BaseModel):
    email: str
    full_name: str | None = "Investor User"

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: int
    email: str
    full_name: str
    is_test_user: bool

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.datetime.utcnow() + datetime.timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

@router.post("/login", response_model=TokenResponse)
def login_or_signup(req: LoginRequest, db: Session = Depends(get_db)):
    """
    OAuth / Quick Authentication endpoint.
    Supports evaluators & test users (harisankar@sentellent.com, naga@sentellent.com).
    Automatically initializes user record and default Investor Persona graph.
    """
    email_clean = req.email.strip().lower()
    user = db.query(User).filter(User.email == email_clean).first()
    
    if not user:
        user = User(email=email_clean, full_name=req.full_name or email_clean.split("@")[0].capitalize())
        db.add(user)
        db.commit()
        db.refresh(user)

        # Initialize Default Persona Graph
        persona = InvestorPersona(
            user_id=user.id,
            risk_profile="Moderate",
            debt_preference="Any",
            dividend_preference="Any",
            max_debt_to_equity=1.5,
            min_dividend_yield=0.0,
            summary_rules="Moderate investor seeking balanced growth across Indian equities."
        )
        db.add(persona)
        db.commit()

    token = create_access_token({"sub": user.email, "user_id": user.id})
    is_test = email_clean in settings.TEST_USERS

    return TokenResponse(
        access_token=token,
        user_id=user.id,
        email=user.email,
        full_name=user.full_name,
        is_test_user=is_test
    )

@router.get("/me")
def get_current_user_profile(email: str = "demo@sentellent.com", db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == email).first()
    if not user:
        # Auto-create demo fallback user
        user = User(email=email, full_name="Sentellent Evaluator")
        db.add(user)
        db.commit()
        db.refresh(user)
    return {
        "id": user.id,
        "email": user.email,
        "full_name": user.full_name,
        "test_users_configured": settings.TEST_USERS
    }
