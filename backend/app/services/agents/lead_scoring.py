import json
import logging
import google.generativeai as genai
from app.core.config.settings import settings
from app.prompts.lead_scoring import LEAD_SCORING_PROMPT
from app.services.agents.scoring_fallback import score_lead_fallback

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


async def score_lead(
    name: str = None,
    budget_min: float = None,
    budget_max: float = None,
    location: str = None,
    property_type: str = None,
    timeline: str = None,
    financing_required: bool = False,
    intent: str = None,
    source: str = None,
) -> dict:
    if model:
        try:
            prompt = LEAD_SCORING_PROMPT.format(
                name=name or "Unknown",
                budget_min=budget_min or "N/A",
                budget_max=budget_max or "N/A",
                location=location or "N/A",
                property_type=property_type or "N/A",
                timeline=timeline or "N/A",
                financing_required=financing_required,
                intent=intent or "N/A",
                source=source or "N/A",
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
            result["score"] = max(0, min(100, int(result.get("score", 0))))
            return result
        except Exception as e:
            logger.warning(f"Gemini API failed for lead scoring: {e}. Using fallback.")

    return score_lead_fallback(
        budget_min=budget_min,
        budget_max=budget_max,
        location=location,
        property_type=property_type,
        timeline=timeline,
        financing_required=financing_required,
        intent=intent,
        source=source,
    )
