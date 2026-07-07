import json
import logging
from app.services.agents.qualification_fallback import extract_lead_info

logger = logging.getLogger(__name__)


async def qualify_lead(message: str) -> dict:
    result = extract_lead_info(message)
    logger.info(f"Qualification result: {result}")
    return result
