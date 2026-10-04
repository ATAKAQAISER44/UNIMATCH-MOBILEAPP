DATASET_FILES = {
    "qs": "data/processed/qs_normalized.csv",
    "the": "data/processed/the_normalized.csv",
    "arwu": "data/processed/arwu_normalized.csv",
}

COLUMN_MAP = {
    "qs": {
        "name": ["Institution_Name", "Institution Name", "University", "name", "Name"],
        "country": ["Location", "location", "Country", "country"],
        "rank": ["RANK_2025", "RANK 2025", "rank", "Rank"],
    },
    "the": {
        "name": ["name", "Name", "Institution_Name", "Institution Name"],
        "country": ["location", "Location", "country", "Country"],
        "rank": ["rank_order", "rank order", "rank", "Rank"],
    },
    "arwu": {
        "name": ["Institute", "institute", "University", "university", "name", "Name"],
        "country": ["Country", "country"],
        "rank": ["World_Rank", "World Rank", "world_rank", "rank", "Rank"],
    },
}

DATASET_METRICS = {
    "qs": [
        "Academic_Reputation_Score",
        "Employer_Reputation_Score",
        "Faculty_Student_Score",
        "Citations_per_Faculty_Score",
        "International_Faculty_Score",
        "International_Students_Score",
        "International_Research_Network_Score",
        "Employment_Outcomes_Score",
        "Sustainability_Score",
    ],
    "the": [
        "scores_teaching",
        "scores_research",
        "scores_citations",
        "scores_industry_income",
        "scores_international_outlook",
    ],
    "arwu": [
        "Alumni",
        "Award",
        "Hi_Ci",
        "NS",
        "PUB",
        "PCP",
    ],
}

DATASET_PUBLISHED = {
    "qs": "May 2025",
    "the": "2024",
    "arwu": "August 2025",
}