import json
import logging
import datetime
from app.db.models import InvestorPersona
from app.services.vector_store import text_to_embedding

logger = logging.getLogger(__name__)

def extract_and_update_persona(user_id: int, user_message: str, db) -> dict:
    """
    Parses user conversation input to detect investor persona updates
    (e.g., risk appetite, debt aversion, dividend preference, sector bias)
    and updates the persistent DB memory graph for the user.
    """
    msg_lower = user_message.lower()
    persona = db.query(InvestorPersona).filter(InvestorPersona.user_id == user_id).first()
    
    if not persona:
        persona = InvestorPersona(
            user_id=user_id,
            risk_profile="Moderate",
            debt_preference="Any",
            dividend_preference="Any",
            max_debt_to_equity=1.5,
            min_dividend_yield=0.0,
            summary_rules="Moderate investor seeking balanced growth across Indian equities.",
            updated_at=datetime.datetime.utcnow()
        )
        db.add(persona)
        db.commit()

    updated = False
    rules = []

    if "conservative" in msg_lower:
        persona.risk_profile = "Conservative"
        persona.max_debt_to_equity = 0.5
        rules.append("Risk Profile: Conservative (Strict Debt Cap <= 0.5)")
        updated = True
    elif "aggressive" in msg_lower or "high risk" in msg_lower:
        persona.risk_profile = "Aggressive"
        persona.max_debt_to_equity = 2.0
        rules.append("Risk Profile: Aggressive / High Growth")
        updated = True

    if "dividend" in msg_lower or "yield" in msg_lower:
        persona.dividend_preference = "High Dividend"
        persona.min_dividend_yield = 1.5
        rules.append("Dividend Focus: Prefers income-generating dividend stocks (Yield >= 1.5%)")
        updated = True

    if "avoid high-debt" in msg_lower or "avoid debt" in msg_lower or "no debt" in msg_lower:
        persona.debt_preference = "Low Debt Only"
        persona.max_debt_to_equity = 0.3
        rules.append("Debt Policy: Avoid high-debt companies (Debt/Equity <= 0.3)")
        updated = True

    if "tech" in msg_lower or "it sector" in msg_lower:
        rules.append("Sector Preference: Information Technology / Software Services")
        updated = True

    if updated:
        rule_str = f"Investor Persona: {persona.risk_profile} investor. " + " ".join(rules)
        persona.summary_rules = rule_str
        persona.persona_vector_json = json.dumps(text_to_embedding(rule_str))
        persona.updated_at = datetime.datetime.utcnow()
        db.commit()

    return {
        "updated": updated,
        "risk_profile": persona.risk_profile,
        "max_debt_to_equity": persona.max_debt_to_equity,
        "min_dividend_yield": persona.min_dividend_yield,
        "summary_rules": persona.summary_rules
    }
