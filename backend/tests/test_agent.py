import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.db.database import Base
from app.db.models import User, InvestorPersona
from app.agent.graph import run_agent_workflow

def test_anti_hallucination_fallback():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(bind=engine)
    Session = sessionmaker(bind=engine)
    db = Session()

    user = User(email="evaluator@sentellent.com", full_name="Evaluator")
    db.add(user)
    db.commit()

    persona = InvestorPersona(user_id=user.id, risk_profile="Moderate")
    db.add(persona)
    db.commit()

    result = run_agent_workflow(user.id, "What is the sentiment on UNKNOWNXYZ stock?", db)
    assert "I don't have that in the ingested data" in result["answer"], "Agent must reject un-ingested questions without hallucinating numbers"
