def generate_journey_fallback(
    name=None,
    budget_min=None,
    budget_max=None,
    property_type=None,
    location=None,
    timeline=None,
    score=0,
    priority="cold",
    intent=None,
) -> list:
    name = name or "Customer"
    location_str = f" in {location}" if location else ""
    property_str = f" {property_type}" if property_type else ""
    budget_str = ""
    if budget_min and budget_max:
        budget_str = f" (₹{budget_min}L-₹{budget_max}L)"
    elif budget_min:
        budget_str = f" (₹{budget_min}L)"

    is_urgent = priority == "hot"
    is_cold = priority == "cold"

    steps = []

    steps.append({
        "channel": "whatsapp",
        "message": f"Hi {name}! 👋 Thank you for your interest in properties{location_str}. We have some excellent options matching your requirements{property_str}{budget_str}. Please let us know if you'd like to schedule a site visit!",
        "delay_days": 0,
        "delay_hours": 0,
    })

    if is_urgent:
        steps.append({
            "channel": "call",
            "message": f"CALL TASK: Call {name} at their registered number. They are a HOT lead looking for{property_str}{location_str}{budget_str}. Discuss property options and schedule an immediate site visit.",
            "delay_days": 0,
            "delay_hours": 6,
        })
        step_delay = 1
    else:
        step_delay = 2

    steps.append({
        "channel": "whatsapp",
        "message": f"Hello {name}, here are some property highlights we think you'll love{location_str}! 🏠\n\n• Premium developments in prime locations\n• Modern amenities including clubhouse, pool, and gym\n• Flexible payment plans available\n\nWould you like to receive the detailed brochure?",
        "delay_days": step_delay,
        "delay_hours": 0,
    })

    steps.append({
        "channel": "email",
        "message": f"Subject: Exclusive Property Recommendations for {name}\n\nDear {name},\n\nThank you for reaching out to PropPilot AI. Based on your requirements{location_str}{property_str}{budget_str}, we have curated a list of the best matching properties for you.\n\nKey Highlights:\n• Premium gated community projects\n• Contemporary designs with Vastu compliance\n• 100% transparent pricing with no hidden charges\n• Easy home loan assistance available\n\nPlease find attached our latest brochure. We are happy to schedule a personal site visit at your convenience.\n\nBest regards,\nSales Team\nPropPilot AI",
        "delay_days": step_delay + 2,
        "delay_hours": 0,
    })

    if not is_urgent:
        steps.append({
            "channel": "sms",
            "message": f"Hi {name}, just checking in! Have you had a chance to review the property options we shared? We have some exciting new launches{location_str}. Reply or call us to know more! 🏡",
            "delay_days": step_delay + 5,
            "delay_hours": 0,
        })

    if is_cold:
        steps.append({
            "channel": "email",
            "message": f"Subject: Quick Update on New Property Launches\n\nDear {name},\n\nWe hope this message finds you well. We wanted to share some exciting new property launches that might interest you.\n\nOur team is available to answer any questions you may have about the real estate market{location_str}.\n\nWarm regards,\nSales Team\nPropPilot AI",
            "delay_days": step_delay + 8,
            "delay_hours": 0,
        })

    if is_urgent:
        urgent_steps = 5
    elif is_cold:
        urgent_steps = 7
    else:
        urgent_steps = 6

    steps.append({
        "channel": "internal_task",
        "message": f"TASK: Send personalized follow-up to {name}. Priority: {priority.upper()}. Requirements:{property_str}{location_str}{budget_str}. Check if customer has replied to previous messages. If not, make a direct call.",
        "delay_days": step_delay + 4,
        "delay_hours": 0,
    })

    return steps[:urgent_steps]
