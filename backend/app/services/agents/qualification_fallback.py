import re
from typing import Optional


def extract_lead_info(message: str) -> dict:
    result = {
        "name": None,
        "budget_min": None,
        "budget_max": None,
        "location": None,
        "property_type": None,
        "timeline": None,
        "financing_required": False,
        "intent": None,
    }

    if not message:
        return result

    msg_lower = message.lower()

    name_patterns = [
        r"(?:i am|i'm|this is|my name is)\s+([A-Za-z\s]+?)(?:,|\.|and|looking|want|need)",
        r"(?:name is)\s+([A-Za-z\s]+?)(?:,|\.|and|looking|want|need)",
    ]
    for pattern in name_patterns:
        match = re.search(pattern, message, re.IGNORECASE)
        if match:
            result["name"] = match.group(1).strip()
            break

    budget_patterns = [
        r"budget\s+(?:of\s+)?[₹rs.]*\s*(\d+(?:\.\d+)?)\s*(crore|crores|cr|lakh|lakhs|lac|lacs)",
        r"(\d+(?:\.\d+)?)\s*(crore|crores|cr|lakh|lakhs|lac|lacs)",
    ]
    for pattern in budget_patterns:
        matches = re.findall(pattern, msg_lower)
        if matches:
            for match in matches:
                if isinstance(match, tuple) and len(match) == 2:
                    amount, unit = match
                    amount = float(amount)
                    unit = unit.strip().lower()
                    if unit in ("crore", "crores", "cr"):
                        amount *= 100
                    elif unit in ("lakh", "lakhs", "lac", "lacs"):
                        pass
                    if result["budget_min"] is None or amount < result["budget_min"]:
                        result["budget_min"] = amount
                    if result["budget_max"] is None or amount > result["budget_max"]:
                        result["budget_max"] = amount

    if result["budget_min"] is not None and result["budget_max"] is None:
        result["budget_max"] = result["budget_min"]
        result["budget_min"] = result["budget_min"] * 0.7

    cities = ["mumbai", "hyderabad", "bangalore", "bengaluru", "pune", "delhi", "chennai", "kolkata", "ahmedabad", "gurgaon", "noida", "goa", "jaipur"]
    for city in cities:
        if city in msg_lower:
            city_map = {"bengaluru": "bangalore"}
            result["location"] = city_map.get(city, city)
            break

    bhk_match = re.search(r"(\d+)\s*(?:bhk|bedroom|bed|rk)", msg_lower)
    if bhk_match:
        bhk = int(bhk_match.group(1))
        if bhk >= 4:
            result["property_type"] = "villa"
        elif bhk >= 2:
            result["property_type"] = "apartment"
        else:
            result["property_type"] = "apartment"
    elif re.search(r"(villa|bungalow|independent\s*house)", msg_lower):
        result["property_type"] = "villa"
    elif re.search(r"(apartment|flat|tower)", msg_lower):
        result["property_type"] = "apartment"
    elif re.search(r"(plot|land)", msg_lower):
        result["property_type"] = "plot"
    elif re.search(r"(commercial|office|shop)", msg_lower):
        result["property_type"] = "commercial"

    if re.search(r"(immediate|asap|urgent|as soon|right away)", msg_lower):
        result["timeline"] = "immediate"
    elif re.search(r"(\d+\s*(?:month|week|day))", msg_lower):
        match = re.search(r"(\d+)\s*(month)", msg_lower)
        if match:
            months = int(match.group(1))
            if months <= 1:
                result["timeline"] = "immediate"
            elif months <= 3:
                result["timeline"] = "1-3 months"
            elif months <= 6:
                result["timeline"] = "3-6 months"
            else:
                result["timeline"] = "6+ months"
        else:
            result["timeline"] = "1-3 months"
    elif re.search(r"(next year|later|no rush|6 month)", msg_lower):
        result["timeline"] = "6+ months"
    else:
        result["timeline"] = "immediate"

    if re.search(r"(loan|finance|emi|mortgage)", msg_lower):
        result["financing_required"] = True

    if re.search(r"(invest|investment|rental|roi)", msg_lower):
        result["intent"] = "investing"
    elif re.search(r"(rent|rental)", msg_lower):
        result["intent"] = "renting"
    elif re.search(r"(buy|purchase|own)", msg_lower):
        result["intent"] = "buying"
    else:
        result["intent"] = "buying"

    return result
