def score_lead_fallback(
    budget_min=None,
    budget_max=None,
    location=None,
    property_type=None,
    timeline=None,
    financing_required=False,
    intent=None,
    source=None,
) -> dict:
    score = 0
    reasons = []

    if budget_min is not None and budget_max is not None:
        avg_budget = (budget_min + budget_max) / 2
        if avg_budget >= 100:
            score += 20
            reasons.append(f"Budget ₹{avg_budget:.0f}L (>= ₹1Cr): +20")
        elif avg_budget >= 50:
            score += 15
            reasons.append(f"Budget ₹{avg_budget:.0f}L (₹50L-₹1Cr): +15")
        else:
            score += 5
            reasons.append(f"Budget ₹{avg_budget:.0f}L (< ₹50L): +5")
    else:
        score += 5
        reasons.append("No budget specified: +5")

    timeline_map = {
        "immediate": 25,
        "1-3 months": 20,
        "3-6 months": 10,
        "6+ months": 5,
        None: 5,
    }
    timeline_score = timeline_map.get(timeline, 5)
    score += timeline_score
    reasons.append(f"Timeline '{timeline or 'unknown'}': +{timeline_score}")

    if location:
        score += 10
        reasons.append(f"Specific location '{location}': +10")
    else:
        score += 0
        reasons.append("No location: +0")

    if property_type:
        score += 10
        reasons.append(f"Specific property type '{property_type}': +10")
    else:
        score += 0
        reasons.append("No property type: +0")

    if intent == "buying":
        score += 15
        reasons.append("Buying intent: +15")
    elif intent == "investing":
        score += 10
        reasons.append("Investing intent: +10")
    elif intent == "renting":
        score += 5
        reasons.append("Renting intent: +5")
    else:
        score += 5
        reasons.append("Unknown intent: +5")

    source_scores = {"website": 10, "referral": 10, "whatsapp": 5, "facebook": 5, "instagram": 5, "magicbricks": 5, "housing": 5}
    source_score = source_scores.get(source, 5)
    score += source_score
    reasons.append(f"Source '{source or 'unknown'}': +{source_score}")

    if financing_required:
        score -= 5
        reasons.append("Financing required: -5")

    score = max(0, min(100, score))

    if score >= 70:
        priority = "hot"
    elif score >= 40:
        priority = "warm"
    else:
        priority = "cold"

    return {
        "score": score,
        "priority": priority,
        "explanation": ". ".join(reasons) + f". Total score: {score}/100 -> {priority.upper()}",
    }
