from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db.models import InvestorPersona
from app.agent.graph import run_agent_workflow

router = APIRouter(prefix="/agent", tags=["Agentic RAG Assistant"])

class ChatQueryRequest(BaseModel):
    user_id: int
    message: str

@router.post("/chat")
def chat_with_agent(req: ChatQueryRequest, db: Session = Depends(get_db)):
    """
    Main Agentic AI Chat Endpoint.
    1. Updates persona graph from message content.
    2. Performs vector RAG retrieval across ingested financial news & screener fundamentals.
    3. Runs persona-based stock screening & scoring.
    4. Formulates cited, grounded answer in INR (Rs.).
    """
    if not req.message.strip():
        raise HTTPException(status_code=400, detail="Chat message cannot be empty.")

    result = run_agent_workflow(req.user_id, req.message, db)
    return result

@router.get("/persona/{user_id}")
def get_investor_persona(user_id: int, db: Session = Depends(get_db)):
    persona = db.query(InvestorPersona).filter(InvestorPersona.user_id == user_id).first()
    if not persona:
        return {
            "user_id": user_id,
            "risk_profile": "Moderate",
            "max_debt_to_equity": 1.5,
            "min_dividend_yield": 0.0,
            "summary_rules": "Default moderate investor profile."
        }
    return {
        "user_id": persona.user_id,
        "risk_profile": persona.risk_profile,
        "debt_preference": persona.debt_preference,
        "dividend_preference": persona.dividend_preference,
        "max_debt_to_equity": persona.max_debt_to_equity,
        "min_dividend_yield": persona.min_dividend_yield,
        "summary_rules": persona.summary_rules,
        "updated_at": persona.updated_at
    }
