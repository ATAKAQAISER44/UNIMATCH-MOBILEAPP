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

    normalized = degree.strip().lower().replace("’", "'")
    compact = "".join(ch for ch in normalized if ch.isalnum())

    if ("leading" in normalized and "phd" in normalized) or compact == "integratedmsphd":
        return "PhD"

    if (
        normalized in {"b", "ba", "bs", "bsc", "bed", "beng", "bcom", "honours", "honors"}
        or "bachelor" in normalized
        or "undergraduate" in normalized
    ):
        return "Bachelor"

    if (
        normalized in {"m", "ma", "ms", "msc", "mba", "mphil"}
        or "master" in normalized
        or "postgraduate" in normalized
        or normalized == "graduate"
    ):
        return "Master"

    if (
        "phd" in normalized
        or "doctor" in normalized
        or normalized in {"dphil", "dba"}
    ):
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