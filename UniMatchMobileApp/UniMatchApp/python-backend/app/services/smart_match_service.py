from app.config.ranking_config import DATASET_METRICS
from app.services.scoring_service import compute_weighted_score


def get_smart_match_weights(dataset: str, priority: str) -> dict:
    dataset = dataset.lower()
    priority = (priority or "balanced").strip().lower()

    metrics = DATASET_METRICS[dataset]
    weights = {metric: 1 for metric in metrics}

    if dataset == "qs":
        if priority == "career":
            weights.update({
                "Employer_Reputation_Score": 35,
                "Employment_Outcomes_Score": 35,
                "Academic_Reputation_Score": 20,
                "Faculty_Student_Score": 10,
            })
        elif priority == "research":
            weights.update({
                "Citations_per_Faculty_Score": 40,
                "International_Research_Network_Score": 30,
                "Academic_Reputation_Score": 20,
                "Sustainability_Score": 10,
            })
        elif priority == "international":
            weights.update({
                "International_Faculty_Score": 30,
                "International_Students_Score": 30,
                "International_Research_Network_Score": 25,
                "Academic_Reputation_Score": 15,
            })
        elif priority == "teaching":
            weights.update({
                "Faculty_Student_Score": 50,
                "Academic_Reputation_Score": 30,
                "Employer_Reputation_Score": 20,
            })

    elif dataset == "the":
        if priority == "career":
            weights.update({
                "scores_industry_income": 40,
                "scores_teaching": 25,
                "scores_research": 20,
                "scores_citations": 15,
            })
        elif priority == "research":
            weights.update({
                "scores_research": 45,
                "scores_citations": 35,
                "scores_international_outlook": 20,
            })
        elif priority == "international":
            weights.update({
                "scores_international_outlook": 55,
                "scores_research": 25,
                "scores_teaching": 20,
            })
        elif priority == "teaching":
            weights.update({
                "scores_teaching": 60,
                "scores_research": 20,
                "scores_citations": 20,
            })

    elif dataset == "arwu":
        if priority == "research":
            weights.update({
                "Award": 20,
                "Hi_Ci": 20,
                "NS": 20,
                "PUB": 25,
                "PCP": 15,
            })
        else:
            weights.update({
                "PUB": 30,
                "PCP": 25,
                "Alumni": 20,
                "Award": 15,
                "Hi_Ci": 10,
            })

    return weights


def map_smart_ranking_weights(dataset: str, ranking_weights: dict, priority: str) -> dict:
    dataset = dataset.lower()
    ranking_weights = ranking_weights or {}

    mapping_by_dataset = {
        "qs": {
            "career": {
                "Employer_Reputation_Score": 50,
                "Employment_Outcomes_Score": 50,
            },
            "teaching": {
                "Faculty_Student_Score": 70,
                "Academic_Reputation_Score": 30,
            },
            "research": {
                "Citations_per_Faculty_Score": 60,
                "International_Research_Network_Score": 40,
            },
            "international": {
                "International_Faculty_Score": 35,
                "International_Students_Score": 35,
                "International_Research_Network_Score": 30,
            },
            "sustainability": {
                "Sustainability_Score": 100,
            },
        },
        "the": {
            "career": {
                "scores_industry_income": 70,
                "scores_teaching": 30,
            },
            "teaching": {
                "scores_teaching": 100,
            },
            "research": {
                "scores_research": 50,
                "scores_citations": 50,
            },
            "international": {
                "scores_international_outlook": 100,
            },
            "sustainability": {
                "scores_research": 100,
            },
        },
        "arwu": {
            "career": {
                "PCP": 60,
                "PUB": 40,
            },
            "teaching": {
                "PCP": 100,
            },
            "research": {
                "PUB": 35,
                "NS": 35,
                "Hi_Ci": 30,
            },
            "international": {
                "Hi_Ci": 60,
                "Award": 40,
            },
            "sustainability": {
                "PUB": 100,
            },
        },
    }

    mapping = mapping_by_dataset[dataset]
    mapped = {}

    for group_key, group_weight in ranking_weights.items():
        if group_key not in mapping:
            continue

        try:
            group_weight = float(group_weight)
        except (TypeError, ValueError):
            group_weight = 0

        for metric_col, metric_share in mapping[group_key].items():
            mapped[metric_col] = mapped.get(metric_col, 0) + (
                group_weight * metric_share / 100
            )

    if not mapped:
        return get_smart_match_weights(dataset, priority)

    return mapped


def add_smart_attribute_scores(df, country_col, country, attribute_weights):
    df = df.copy()
    attribute_weights = attribute_weights or {}
    attribute_score_columns = []

    if "country_match" in attribute_weights and country_col:
        if country and country != "All":
            df["country_match_score"] = (
                df[country_col].astype(str).str.strip().str.lower()
                == str(country).strip().lower()
            ).astype(float)
        else:
            df["country_match_score"] = 0.5

        attribute_score_columns.append("country_match_score")

    for attr_key in attribute_weights.keys():
        if attr_key == "country_match":
            continue

        col_name = f"{attr_key}_score"

        if col_name not in df.columns:
            df[col_name] = 0.5

        attribute_score_columns.append(col_name)

    if not attribute_score_columns:
        df["attribute_score"] = 0
        return df

    internal_attribute_weights = {}

    for attr_key, weight in attribute_weights.items():
        if attr_key == "country_match":
            internal_attribute_weights["country_match_score"] = weight
        else:
            internal_attribute_weights[f"{attr_key}_score"] = weight

    df = compute_weighted_score(
        df,
        internal_attribute_weights,
        output_column="attribute_score",
    )

    return df


def combine_smart_scores(
    df,
    ranking_importance: float,
    attribute_importance: float,
):
    ranking_importance = max(float(ranking_importance), 0)
    attribute_importance = max(float(attribute_importance), 0)

    total_importance = ranking_importance + attribute_importance

    if total_importance <= 0:
        ranking_importance = 60
        attribute_importance = 40
        total_importance = 100

    ranking_importance = ranking_importance / total_importance
    attribute_importance = attribute_importance / total_importance

    df = df.copy()

    df["personalized_score"] = (
        ranking_importance * df["ranking_score"]
        + attribute_importance * df["attribute_score"]
    )

    return df


def add_smart_reasons(results, df):
    for index, result in enumerate(results):
        row = df.iloc[index]
        reasons = []

        if row.get("ranking_score", 0) >= 0.7:
            reasons.append("Strong ranking metric match")

        if row.get("country_match_score", 0) == 1:
            reasons.append("Matches preferred country")

        if row.get("attribute_score", 0) >= 0.6:
            reasons.append("Good university attribute match")

        result["smart_match_rank"] = result["current_rank"]
        result["smart_match_score"] = result["personalized_score"]
        result["ranking_score"] = round(float(row.get("ranking_score", 0)), 4)
        result["attribute_score"] = round(float(row.get("attribute_score", 0)), 4)
        result["final_score"] = result["personalized_score"]
        result["reasons"] = reasons

    return results