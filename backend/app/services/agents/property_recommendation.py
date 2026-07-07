import json
import logging
import google.generativeai as genai
from app.core.config.settings import settings
from app.prompts.property_recommendation import PROPERTY_RECOMMENDATION_PROMPT

logger = logging.getLogger(__name__)

genai.configure(api_key=settings.google_api_key)

try:
    model = genai.GenerativeModel(
        settings.gemini_model,
        generation_config={"temperature": 0.3, "top_p": 0.95},
    )
except Exception as e:
    logger.warning(f"Failed to initialize Gemini model: {e}")
    model = None


def _property_match_score(prop: dict, budget_min=None, budget_max=None, location=None, property_type=None, intent=None) -> float:
    score = 0.0
    price = prop.get("price", 0)

    if budget_min is not None and budget_max is not None:
        if budget_min <= price <= budget_max:
            score += 30
        elif budget_min * 0.8 <= price <= budget_max * 1.2:
            score += 15
        elif price < budget_min * 0.8:
            score += 5
        else:
            score += 2
    elif budget_min is not None:
        if price <= budget_min * 1.2:
            score += 20
        else:
            score += 5
    elif budget_max is not None:
        if price >= budget_max * 0.8:
            score += 20
        else:
            score += 5
    else:
        score += 10

    if location:
        loc_lower = location.lower()
        prop_loc = (prop.get("location") or "").lower()
        if loc_lower in prop_loc or prop_loc in loc_lower:
            score += 30
        else:
            score += 5
    else:
        score += 15

    if property_type:
        pt = (property_type or "").lower()
        ppt = (prop.get("property_type") or "").lower()
        if pt == ppt:
            score += 25
        elif (pt == "apartment" and ppt in ("flat", "tower")) or (ppt == "apartment" and pt in ("flat", "tower")):
            score += 20
        else:
            score += 5
    else:
        score += 10

    if intent and intent.lower() == "investing":
        if prop.get("bedrooms", 2) >= 2:
            score += 10
    elif intent and intent.lower() == "buying":
        score += 5

    return max(0, min(100, score))


def _recommend_fallback(
    budget_min=None, budget_max=None, location=None, property_type=None, intent=None, properties_data=None
) -> list:
    if not properties_data:
        return []

    scored = []
    for prop in properties_data:
        match_score = _property_match_score(prop, budget_min, budget_max, location, property_type, intent)
        if match_score >= 20:
            scored.append({
                "property_id": prop["id"],
                "property_name": prop["name"],
                "match_score": match_score,
                "reasons": [
                    f"Price ₹{prop['price']:.0f}L matches budget",
                    f"Location: {prop.get('location', 'N/A')}",
                    f"Type: {prop.get('property_type', 'N/A')}",
                ],
            })

    scored.sort(key=lambda x: x["match_score"], reverse=True)
    return scored[:5]


async def recommend_properties(
    budget_min: float = None,
    budget_max: float = None,
    location: str = None,
    property_type: str = None,
    timeline: str = None,
    intent: str = None,
    properties_data: list = None,
) -> list:
    if not properties_data:
        return []

    if model:
        try:
            props_str = json.dumps(properties_data, indent=2, default=str)
            prompt = PROPERTY_RECOMMENDATION_PROMPT.format(
                budget_min=budget_min or "N/A",
                budget_max=budget_max or "N/A",
                location=location or "N/A",
                property_type=property_type or "N/A",
                timeline=timeline or "N/A",
                intent=intent or "N/A",
                properties=props_str,
            )
            response = await model.generate_content_async(prompt)
            text = response.text.strip()

            if text.startswith("```json"):
                text = text[7:]
            if text.startswith("```"):
                text = text[3:]
            if text.endswith("```"):
                text = text[:-3]

            result = json.loads(text.strip())
            if isinstance(result, list):
                for r in result:
                    r["match_score"] = max(0, min(100, int(r.get("match_score", 0))))
                return result
            return []
        except Exception as e:
            logger.warning(f"Gemini API failed for property recommendation: {e}. Using fallback.")

    return _recommend_fallback(
        budget_min=budget_min,
        budget_max=budget_max,
        location=location,
        property_type=property_type,
        intent=intent,
        properties_data=properties_data,
    )
