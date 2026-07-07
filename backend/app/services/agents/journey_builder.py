import json
import logging
import google.generativeai as genai
from app.core.config.settings import settings
from app.prompts.journey_builder import JOURNEY_BUILDER_PROMPT
from app.services.agents.journey_fallback import generate_journey_fallback

logger = logging.getLogger(__name__)

genai.configure(api_key=settings.google_api_key)

try:
    model = genai.GenerativeModel(
        settings.gemini_model,
        generation_config={"temperature": 0.7, "top_p": 0.95},
    )
except Exception as e:
    logger.warning(f"Failed to initialize Gemini model: {e}")
    model = None


async def generate_journey(
    name: str = None,
    budget_min: float = None,
    budget_max: float = None,
    property_type: str = None,
    location: str = None,
    timeline: str = None,
    score: int = 0,
    priority: str = "cold",
    intent: str = None,
) -> list:
    if model:
        try:
            prompt = JOURNEY_BUILDER_PROMPT.format(
                name=name or "Customer",
                budget_min=budget_min or "N/A",
                budget_max=budget_max or "N/A",
                property_type=property_type or "N/A",
                location=location or "N/A",
                timeline=timeline or "N/A",
                score=score,
                priority=priority,
                intent=intent or "N/A",
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
                return result
        except Exception as e:
            logger.warning(f"Gemini API failed for journey builder: {e}. Using fallback.")

    return generate_journey_fallback(
        name=name,
        budget_min=budget_min,
        budget_max=budget_max,
        property_type=property_type,
        location=location,
        timeline=timeline,
        score=score,
        priority=priority,
        intent=intent,
    )
