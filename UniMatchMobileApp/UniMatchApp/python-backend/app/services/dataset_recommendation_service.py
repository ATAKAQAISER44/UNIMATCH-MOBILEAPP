VALID_PRIORITIES = [
    "Career & Employability",
    "Research & Academia",
    "International Exposure & Diversity",
    "Teaching Quality & Student Support",
    "Balanced Preference",
]


def normalize_degree(degree: str) -> str:
    if not degree:
        return "Master"

    degree = degree.strip().lower()

    if degree in ["bs", "bachelor", "bachelors", "undergraduate"]:
        return "Bachelor"

    if degree in ["ms", "master", "masters", "postgraduate"]:
        return "Master"

    if degree in ["phd", "doctorate", "ms leading to phd"]:
        return "PhD"

    return "Master"


def clean_priorities(priorities: list[str]) -> list[str]:
    cleaned = []

    for priority in priorities:
        if not priority:
            continue

        priority = priority.strip()

        # affordability removed from priority logic
        if "affordable" in priority.lower() or "scholarship" in priority.lower():
            continue

        if priority in VALID_PRIORITIES and priority not in cleaned:
            cleaned.append(priority)

    if not cleaned:
        cleaned.append("Balanced Preference")

    return cleaned


def recommend_dataset(degree: str, priorities: list[str]) -> dict:
    normalized_degree = normalize_degree(degree)
    cleaned_priorities = clean_priorities(priorities)

    first_priority = cleaned_priorities[0]

    mapping = {
        "Career & Employability": {
            "Bachelor": "QS",
            "Master": "QS",
            "PhD": "THE",
        },
        "Research & Academia": {
            "Bachelor": "THE",
            "Master": "THE",
            "PhD": "ARWU",
        },
        "International Exposure & Diversity": {
            "Bachelor": "QS",
            "Master": "QS",
            "PhD": "THE",
        },
        "Teaching Quality & Student Support": {
            "Bachelor": "THE",
            "Master": "THE",
            "PhD": "THE",
        },
        "Balanced Preference": {
            "Bachelor": "THE",
            "Master": "THE",
            "PhD": "THE",
        },
    }

    recommended_dataset = mapping[first_priority][normalized_degree]

    return {
        "recommended_dataset": recommended_dataset,
        "degree": normalized_degree,
        "used_priority": first_priority,
        "all_priorities": cleaned_priorities,
        "justification": (
            f"{recommended_dataset} is recommended because your main priority is "
            f"{first_priority} and your intended degree level is {normalized_degree}."
        ),
    }