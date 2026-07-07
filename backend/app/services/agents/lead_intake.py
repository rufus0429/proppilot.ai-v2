import re
import logging
from typing import Optional, Dict, Any
from app.models import LeadSource

logger = logging.getLogger(__name__)


def normalize_phone(phone: str) -> str:
    cleaned = re.sub(r"[^\d+]", "", phone)
    if cleaned.startswith("+"):
        if cleaned.startswith("+91") and len(cleaned) == 13:
            return cleaned
        return cleaned
    if cleaned.startswith("91") and len(cleaned) == 12:
        return f"+{cleaned}"
    if cleaned.startswith("0") and len(cleaned) == 11:
        return f"+91{cleaned[1:]}"
    if len(cleaned) == 10:
        return f"+91{cleaned}"
    return phone


def normalize_email(email: Optional[str]) -> Optional[str]:
    if not email:
        return None
    return email.strip().lower()


def validate_inquiry_form(form_data: dict) -> tuple[bool, Optional[str]]:
    required = ["name", "phone", "property_type", "city"]
    for field in required:
        if not form_data.get(field):
            return False, f"{field} is required"

    phone = form_data.get("phone", "")
    cleaned = re.sub(r"[^\d]", "", phone)
    if len(cleaned) < 10:
        return False, "Phone number must have at least 10 digits"

    if form_data.get("email"):
        email = form_data["email"].strip()
        if not re.match(r"[^@]+@[^@]+\.[^@]+", email):
            return False, "Invalid email format"

    return True, None


DUP_FIELDS = ["phone", "email"]


async def check_duplicate(
    phone: str,
    email: Optional[str],
    lead_repo,
) -> tuple[bool, Optional[str]]:
    phone_normalized = normalize_phone(phone)
    existing = await lead_repo.find_by_phone_or_email(phone_normalized, email)
    if existing:
        return True, str(existing.id)
    return False, None


SOURCE_KEYWORDS: dict[str, LeadSource] = {
    "whatsapp": LeadSource.WHATSAPP,
    "facebook": LeadSource.FACEBOOK,
    "instagram": LeadSource.INSTAGRAM,
    "referral": LeadSource.REFERRAL,
    "landing": LeadSource.LANDING_PAGE,
    "manual": LeadSource.MANUAL,
    "website": LeadSource.WEBSITE,
}


def identify_source(form_data: dict) -> LeadSource:
    source_raw = form_data.get("source", "website")
    source_str = source_raw.lower().strip()

    if source_str in SOURCE_KEYWORDS:
        return SOURCE_KEYWORDS[source_str]

    for keyword, source in SOURCE_KEYWORDS.items():
        if keyword in source_str:
            return source

    return LeadSource.WEBSITE


def prepare_lead_data(form_data: dict) -> dict:
    phone = normalize_phone(form_data.get("phone", ""))
    email = normalize_email(form_data.get("email"))

    budget_min = form_data.get("budget_min")
    budget_max = form_data.get("budget_max")

    source = identify_source(form_data)

    intent_parts = []
    if form_data.get("property_type"):
        intent_parts.append(f"Looking for {form_data['property_type']}")
    if form_data.get("city"):
        intent_parts.append(f"in {form_data['city']}")
        if form_data.get("area"):
            intent_parts[-1] += f" ({form_data['area']})"
    if budget_min or budget_max:
        budget_str = f"Budget: ₹{budget_min or '?'}L - ₹{budget_max or '?'}L"
        intent_parts.append(budget_str)
    if form_data.get("bedrooms"):
        intent_parts.append(f"{form_data['bedrooms']} BHK")
    if form_data.get("timeline"):
        intent_parts.append(f"Timeline: {form_data['timeline']}")
    if form_data.get("notes"):
        intent_parts.append(f"Notes: {form_data['notes']}")

    intent = ". ".join(intent_parts) if intent_parts else form_data.get("notes", "")

    timeline_map = {
        "immediately": "immediate",
        "within_1_month": "1 month",
        "within_3_months": "3 months",
        "within_6_months": "6 months",
        "just_exploring": "exploring",
    }

    return {
        "name": form_data.get("name", "").strip(),
        "phone": phone,
        "email": email,
        "budget_min": budget_min,
        "budget_max": budget_max,
        "location": form_data.get("city", "").strip(),
        "preferred_area": form_data.get("area", "").strip() if form_data.get("area") else None,
        "property_type": form_data.get("property_type"),
        "bedrooms": form_data.get("bedrooms"),
        "timeline": timeline_map.get(form_data.get("timeline", ""), form_data.get("timeline", "")),
        "financing_required": form_data.get("financing_required", False),
        "intent": intent,
        "source": source.value,
        "inquiry_data": form_data,
    }
