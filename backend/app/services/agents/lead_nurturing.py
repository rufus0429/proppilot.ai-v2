import logging
import json
from typing import Optional
from urllib.parse import quote

logger = logging.getLogger(__name__)


async def generate_whatsapp_message(
    name: Optional[str] = None,
    location: Optional[str] = None,
    property_type: Optional[str] = None,
    bedrooms: Optional[int] = None,
    budget_min: Optional[float] = None,
    budget_max: Optional[float] = None,
    score: int = 0,
    priority: str = "cold",
    intent: Optional[str] = None,
) -> dict:
    name = name or "there"
    location_str = f" in {location}" if location else ""
    ptype_str = f" {property_type}" if property_type else ""
    bhk_str = f" {bedrooms} BHK" if bedrooms else ""
    budget_str = ""
    if budget_min and budget_max:
        budget_str = f"₹{int(budget_min)}L - ₹{int(budget_max)}L"
    elif budget_min:
        budget_str = f"₹{int(budget_min)}L"

    message = (
        f"Hi {name}! 👋\n\n"
        f"Thank you for your interest{bhk_str}{ptype_str}{location_str}."
    )

    if budget_str:
        message += f"\n\nBased on your budget of {budget_str}, we found some great matching properties."

    if priority == "hot":
        message += (
            f"\n\nWe have premium options that we're excited to show you! "
            f"Would you like to schedule a site visit this weekend?"
        )
    else:
        message += (
            f"\n\nOur team is curating the best options for you. "
            f"We'll share personalized recommendations shortly."
        )

    message += (
        f"\n\nReply here or call us anytime to discuss further. 🏡"
    )

    phone = ""
    wa_url = ""

    return {
        "message": message,
        "whatsapp_url": wa_url,
        "phone": phone,
    }


def build_whatsapp_url(phone: str, message: str) -> str:
    if not phone:
        return ""
    digits = "".join(c for c in phone if c.isdigit())
    if digits.startswith("+"):
        digits = digits[1:]
    encoded = quote(message)
    return f"https://wa.me/{digits}?text={encoded}"


def build_followup_response(
    name: Optional[str] = None,
    phone: Optional[str] = None,
    location: Optional[str] = None,
    property_type: Optional[str] = None,
    bedrooms: Optional[int] = None,
    budget_min: Optional[float] = None,
    budget_max: Optional[float] = None,
    score: int = 0,
    priority: str = "cold",
    intent: Optional[str] = None,
) -> dict:
    message = _generate_message_text(
        name=name,
        location=location,
        property_type=property_type,
        bedrooms=bedrooms,
        budget_min=budget_min,
        budget_max=budget_max,
        score=score,
        priority=priority,
        intent=intent,
    )

    wa_url = build_whatsapp_url(phone or "", message) if phone else ""

    return {
        "message": message,
        "whatsapp_url": wa_url,
        "phone": phone or "",
    }


def _generate_message_text(
    name: Optional[str] = None,
    location: Optional[str] = None,
    property_type: Optional[str] = None,
    bedrooms: Optional[int] = None,
    budget_min: Optional[float] = None,
    budget_max: Optional[float] = None,
    score: int = 0,
    priority: str = "cold",
    intent: Optional[str] = None,
) -> str:
    name = name or "there"
    location_str = f" in {location}" if location else ""
    ptype_str = f" {property_type}" if property_type else ""
    bhk_str = f" {bedrooms} BHK" if bedrooms else ""

    budget_str = ""
    if budget_min and budget_max:
        budget_str = f"₹{int(budget_min)}L - ₹{int(budget_max)}L"
    elif budget_min:
        budget_str = f"₹{int(budget_min)}L"

    lines = [f"Hi {name}! 👋", ""]
    lines.append(f"Thank you for your interest{bhk_str}{ptype_str}{location_str}.")

    if budget_str:
        lines.append(f"")
        lines.append(f"Based on your budget of {budget_str}, we have found properties that match your requirements.")

    if priority == "hot":
        lines.append(f"")
        lines.append(f"We have some premium options we'd love to show you!")
        lines.append(f"Would you like to schedule a site visit this weekend?")
    elif priority == "warm":
        lines.append(f"")
        lines.append(f"Our team is curating the best matches for you.")
        lines.append(f"We'll share personalized recommendations shortly.")
    else:
        lines.append(f"")
        lines.append(f"We are exploring options that fit your preferences.")
        lines.append(f"You'll hear from us soon with curated recommendations.")

    lines.append(f"")
    lines.append(f"Feel free to reply here or call us anytime. 🏡")

    return "\n".join(lines)
