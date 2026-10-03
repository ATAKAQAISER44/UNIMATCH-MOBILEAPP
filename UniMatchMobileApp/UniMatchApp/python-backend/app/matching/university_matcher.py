"""
University name matching across QS, THE, ARWU and the attributes dataset.

Each ranking spells the same university differently, for example
"Massachusetts Institute of Technology (MIT)" (QS) vs "MIT" or
"Ataturk University" (QS) vs "Atatürk University" (THE). This module gives
every university ONE id (uni_id) and ONE display name, while the original
names in the raw/processed CSV files stay untouched.

How matching works:
1. Exact: names are cleaned (accents, "&", "(MIT)", "The", punctuation)
   and compared together with the country.
2. Fuzzy: still-unmatched names are compared only against universities in
   the SAME country. Very similar names are merged automatically; names
   that are only "probably" the same go to review_needed.csv, where a
   person writes yes/no in the "decision" column.

Output files (data/matching/):
- universities.csv        one row per university: uni_id, display_name, country
- university_aliases.csv  every original name per dataset -> uni_id
- review_needed.csv       doubtful pairs waiting for a yes/no decision
"""

import hashlib
import re
import unicodedata
from difflib import SequenceMatcher
from pathlib import Path

import pandas as pd

DATA_DIR = Path(__file__).resolve().parents[2] / "data"
MATCHING_DIR = DATA_DIR / "matching"
UNIVERSITIES_FILE = MATCHING_DIR / "universities.csv"
ALIASES_FILE = MATCHING_DIR / "university_aliases.csv"
REVIEW_FILE = MATCHING_DIR / "review_needed.csv"

# Name source priority for the display name: first dataset that has the
# university wins. QS comes first because the attributes data uses QS names.
DISPLAY_PRIORITY = ["qs", "qs_2027", "qs_2025", "qs_2024", "the", "arwu", "attr"]

# These files have rows whose country column is wrong or empty (for example
# "University of Delaware, New Zealand" in ARWU, "University of Malaga, Malta"
# in the attributes file), so their country is not used to block a name match.
UNTRUSTED_COUNTRY_DATASETS = {"arwu", "attr"}

AUTO_MATCH_SCORE = 0.93
REVIEW_MIN_SCORE = 0.80

_COUNTRY_ALIASES = {
    "united states of america": "united states",
    "usa": "united states",
    "us": "united states",
    "uk": "united kingdom",
    "china mainland": "china",
    "hong kong sar": "hong kong",
    "hong kong china": "hong kong",
    "macau sar": "macau",
    "macau china": "macau",
    "macao": "macau",
    "taiwan china": "taiwan",
    "iran islamic republic of": "iran",
    "russian federation": "russia",
    "korea south": "south korea",
    "republic of korea": "south korea",
    "brunei darussalam": "brunei",
    "palestinian territory occupied": "palestine",
    "syrian arab republic": "syria",
    "turkiye": "turkey",
    "czechia": "czech republic",
    "viet nam": "vietnam",
}

# Local-language words for "university" etc., used only by the fuzzy step.
_WORD_TRANSLATIONS = {
    "universitesi": "university",
    "universiti": "university",
    "universitas": "university",
    "universidad": "university",
    "universidade": "university",
    "universite": "university",
    "universita": "university",
    "universitat": "university",
    "universitaet": "university",
    "universitatsmedizin": "medical university",
    "hochschule": "university",
    "freie": "free",
    "libre": "free",
    "libera": "free",
    "catolica": "catholic",
    "cattolica": "catholic",
    "catholique": "catholic",
    "katholieke": "catholic",
    "pontificia": "pontifical",
    "nacional": "national",
    "nazionale": "national",
    "federale": "federal",
    "estadual": "state",
    "statale": "state",
    "tecnologica": "technological",
    "tecnica": "technical",
    "technologie": "technology",
    "tecnologia": "technology",
    "medica": "medical",
    "medicina": "medical",
    "universiteit": "university",
    "uniwersytet": "university",
    "univerzita": "university",
    "politecnico": "polytechnic",
    "politechnika": "polytechnic",
    "technische": "technical",
    "st": "saint",
    "ste": "sainte",
    "mt": "mount",
    "univ": "university",
    "inst": "institute",
}

_FUZZY_STOPWORDS = {
    "of", "the", "and", "for", "de", "di", "du", "der", "des", "la", "le", "del",
    "della", "delle", "dei", "degli", "da", "do", "dos", "das", "in", "at", "y", "e",
    "zu", "et", "studi", "studies",
}

# Words almost every university name has. They do not tell two universities
# apart, so the fuzzy step compares the remaining "distinctive" words instead
# ("Colorado State University" vs "Morgan State University" -> colorado vs morgan).
_GENERIC_WORDS = {"university", "institution", "us", "usa"}

# Words that say what KIND of university it is. They are left out of the
# distinctive words too, but both names must have the same ones:
# "University of Sydney" != "University of Technology Sydney",
# "University of New Mexico" != "New Mexico State University",
# "Boston University" != "Boston College".
_TYPE_WORDS = {
    "institute", "technology", "technological", "technical", "polytechnic",
    "science", "sciences", "scientific", "college", "school", "academy",
    "applied", "state", "national", "federal", "medical", "normal",
    "pedagogical", "agricultural", "agriculture", "catholic", "pontifical",
}

# Letters that NFKD does not split into "base letter + accent".
_SPECIAL_LETTERS = str.maketrans({
    "ı": "i", "İ": "I", "ø": "o", "Ø": "O", "ł": "l", "Ł": "L", "đ": "d", "Đ": "D",
    "ð": "d", "æ": "ae", "Æ": "AE", "œ": "oe", "ß": "ss", "þ": "th",
    "’": "'", "‘": "'", "–": "-", "—": "-",
})


def fold_accents(value: str) -> str:
    """Atatürk -> Ataturk, Université -> Universite, Yıldız -> Yildiz."""
    normalized = unicodedata.normalize("NFKD", value.translate(_SPECIAL_LETTERS))
    return "".join(ch for ch in normalized if not unicodedata.combining(ch))


def name_key(name) -> str:
    """Strict key: two names with the same key are the same university."""
    if name is None or (isinstance(name, float) and pd.isna(name)):
        return ""
    value = fold_accents(str(name)).lower()
    value = value.replace("&", " and ")
    value = re.sub(r"\(.*?\)", " ", value)  # (MIT), (UET), (NUML)
    value = re.sub(r"[^a-z0-9]+", " ", value)
    value = re.sub(r"^\s*the\s+", " ", value)
    return re.sub(r"\s+", " ", value).strip()


def country_key(country) -> str:
    if country is None or (isinstance(country, float) and pd.isna(country)):
        return ""
    value = fold_accents(str(country)).lower()
    value = re.sub(r"[^a-z ]+", " ", value)
    value = re.sub(r"\s+", " ", value).strip()
    return _COUNTRY_ALIASES.get(value, value)


def _ordered_tokens(name) -> list[str]:
    tokens = [_WORD_TRANSLATIONS.get(t, t) for t in name_key(name).split()]
    return [t for t in tokens if t not in _FUZZY_STOPWORDS]


def loose_tokens(name) -> list[str]:
    """Token list used by the fuzzy step (translated, stopwords removed, sorted)."""
    return sorted(_ordered_tokens(name))


def _ratio(a: str, b: str) -> float:
    return SequenceMatcher(None, a, b).ratio()


def _distinctive_tokens(name, country) -> list[str]:
    """
    Words that identify the university: generic words, the country name and an
    acronym of the name itself ("KIT" in "KIT, Karlsruhe Institute of Technology")
    are removed.
    """
    # Acronyms are built from the original word order, before translation
    # ("Università della Svizzera italiana" -> "usi").
    raw_tokens = [t for t in name_key(name).split() if t not in _FUZZY_STOPWORDS]
    country_words = set(country_key(country).split())
    result = []
    for t in _ordered_tokens(name):
        if t in _GENERIC_WORDS or t in _TYPE_WORDS or t in country_words:
            continue
        initials = "".join(o[0] for o in raw_tokens if o != t)
        if len(t) >= 3 and t in initials:
            continue  # acronym of the name
        result.append(t)
    return sorted(result)


def _tokens_covered(source: list[str], target: list[str]) -> bool:
    """True when every word in `source` has an (almost) equal word in `target`."""
    for s in source:
        if not any(s == t or (min(len(s), len(t)) >= 4 and _ratio(s, t) >= 0.85) for t in target):
            return False
    return True


def compare_names(name_a, name_b, country="") -> tuple[float, str]:
    """
    Returns (similarity 0..1, verdict). verdict is:
    - "auto"   : same university, merge automatically
    - "review" : probably the same, a person should confirm
    - "reject" : different universities
    """
    full_a, full_b = loose_tokens(name_a), loose_tokens(name_b)
    if not full_a or not full_b:
        return 0.0, "reject"

    score = _ratio(" ".join(full_a), " ".join(full_b))
    if full_a == full_b:
        return 1.0, "auto"

    # Different kind of institution (one is "State"/"Technology"/"College"...)
    if set(full_a) & _TYPE_WORDS != set(full_b) & _TYPE_WORDS:
        return score, "reject"

    dist_a = _distinctive_tokens(name_a, country)
    dist_b = _distinctive_tokens(name_b, country)

    if not dist_a and not dist_b:
        # Only generic words left (e.g. "State University"): rely on full name.
        return score, "auto" if score >= AUTO_MATCH_SCORE else "reject"
    if not dist_a or not dist_b:
        # One name has only one extra word, usually a city:
        # "National University of Sciences and Technology (Islamabad)"
        extra = dist_a or dist_b
        return score, "review" if len(extra) == 1 and score >= REVIEW_MIN_SCORE else "reject"

    a_in_b = _tokens_covered(dist_a, dist_b)
    b_in_a = _tokens_covered(dist_b, dist_a)

    if a_in_b and b_in_a:
        # Same identifying words, generic words may differ -> same university
        # unless the full names are clearly different.
        return max(score, AUTO_MATCH_SCORE), "auto" if score >= REVIEW_MIN_SCORE else "review"
    if a_in_b or b_in_a:
        # One name has extra words ("Radboud University" vs "Radboud University Nijmegen")
        return score, "review"
    return score, "reject"


def make_uni_id(display_name: str, country: str) -> str:
    raw = f"{name_key(display_name)}|{country_key(country)}"
    return "uni_" + hashlib.md5(raw.encode("utf-8")).hexdigest()[:10]


class _UnionFind:
    def __init__(self):
        self.parent: dict[int, int] = {}

    def find(self, x: int) -> int:
        self.parent.setdefault(x, x)
        while self.parent[x] != x:
            self.parent[x] = self.parent[self.parent[x]]
            x = self.parent[x]
        return x

    def union(self, a: int, b: int):
        ra, rb = self.find(a), self.find(b)
        if ra != rb:
            self.parent[rb] = ra


def _load_previous_decisions() -> dict[tuple, str]:
    if not REVIEW_FILE.exists():
        return {}
    df = pd.read_csv(REVIEW_FILE, dtype=str).fillna("")
    decisions = {}
    for _, row in df.iterrows():
        decision = row.get("decision", "").strip().lower()
        if decision in {"yes", "no"}:
            key = (row["dataset_a"], row["name_a"], row["dataset_b"], row["name_b"])
            decisions[key] = decision
    return decisions


def build_crosswalk(sources: list[dict]) -> dict:
    """
    sources: [{"dataset": "qs", "df": DataFrame, "name_col": ..., "country_col": ...}, ...]
    Writes the three files in data/matching/ and returns a small summary.
    """
    nodes = []  # one per unique (dataset, original name, country)
    seen = set()
    for source in sources:
        df = source["df"]
        for name, country in zip(df[source["name_col"]], df[source["country_col"]]):
            if pd.isna(name) or not str(name).strip():
                continue
            name = re.sub(r"\s+", " ", str(name)).strip()
            country = "" if pd.isna(country) else re.sub(r"\s+", " ", str(country)).strip()
            ident = (source["dataset"], name, country)
            if ident in seen:
                continue
            seen.add(ident)
            nodes.append({
                "dataset": source["dataset"],
                "name": name,
                "country": country,
                "key": name_key(name),
                "ckey": country_key(country),
            })

    uf = _UnionFind()
    method = {i: "exact" for i in range(len(nodes))}
    confidence = {i: 1.0 for i in range(len(nodes))}

    # Step 1: exact match on cleaned name + country
    by_key: dict[tuple, int] = {}
    for i, node in enumerate(nodes):
        uf.find(i)
        k = (node["key"], node["ckey"])
        if k in by_key:
            uf.union(by_key[k], i)
        else:
            by_key[k] = i

    # Step 1b: same cleaned name but different/missing country. Only safe when
    # the name belongs to one university everywhere (at most one per dataset),
    # e.g. ARWU/attributes rows whose country column is wrong or empty.
    by_name: dict[str, list[int]] = {}
    for i, node in enumerate(nodes):
        if node["key"]:
            by_name.setdefault(node["key"], []).append(i)
    for ids in by_name.values():
        roots = {uf.find(i) for i in ids}
        if len(roots) < 2:
            continue
        per_dataset: dict[str, set] = {}
        for i in ids:
            per_dataset.setdefault(nodes[i]["dataset"], set()).add(uf.find(i))
        # Datasets with reliable countries must agree.
        trusted_countries = {
            nodes[i]["ckey"]
            for i in ids
            if nodes[i]["ckey"] and nodes[i]["dataset"] not in UNTRUSTED_COUNTRY_DATASETS
        }
        if len(trusted_countries) <= 1 and all(len(r) == 1 for r in per_dataset.values()):
            for i in ids[1:]:
                if uf.find(i) != uf.find(ids[0]):
                    method[i] = "name_only"
                uf.union(ids[0], i)

    # Step 2: fuzzy match inside the same country
    decisions = _load_previous_decisions()
    review_rows = []
    reviewed_clusters = set()  # the same pair can show up once per QS year file
    datasets = [s["dataset"] for s in sources]

    def cluster_datasets() -> dict[int, set]:
        result: dict[int, set] = {}
        for i, node in enumerate(nodes):
            result.setdefault(uf.find(i), set()).add(node["dataset"])
        return result

    by_dataset_country: dict[tuple, list[int]] = {}
    for i, node in enumerate(nodes):
        by_dataset_country.setdefault((node["dataset"], node["ckey"]), []).append(i)

    for a_index, dataset_a in enumerate(datasets):
        for dataset_b in datasets[a_index + 1:]:
            members = cluster_datasets()
            for i, node in enumerate(nodes):
                if node["dataset"] != dataset_a or dataset_b in members[uf.find(i)]:
                    continue

                best_j, best_score, best_verdict = None, 0.0, "reject"
                verdict_rank = {"auto": 2, "review": 1, "reject": 0}
                for j in by_dataset_country.get((dataset_b, node["ckey"]), []):
                    if dataset_a in members[uf.find(j)]:
                        continue
                    score, verdict = compare_names(node["name"], nodes[j]["name"], node["country"])
                    if (verdict_rank[verdict], score) > (verdict_rank[best_verdict], best_score):
                        best_j, best_score, best_verdict = j, score, verdict

                if best_j is None or best_verdict == "reject":
                    continue

                other = nodes[best_j]
                decision = decisions.get((dataset_a, node["name"], dataset_b, other["name"]), "")

                if decision == "no":
                    continue
                if best_verdict == "auto" or decision == "yes":
                    uf.union(i, best_j)
                    members[uf.find(i)] = members.get(uf.find(i), set()) | {dataset_a, dataset_b}
                    for k in (i, best_j):
                        if method[k] == "exact":
                            method[k] = "manual" if decision == "yes" else "fuzzy"
                            confidence[k] = round(best_score, 3)
                    if decision != "yes":
                        continue
                else:
                    cluster_pair = frozenset((uf.find(i), uf.find(best_j)))
                    if cluster_pair in reviewed_clusters:
                        continue
                    reviewed_clusters.add(cluster_pair)

                review_rows.append({
                    "dataset_a": dataset_a,
                    "name_a": node["name"],
                    "dataset_b": dataset_b,
                    "name_b": other["name"],
                    "country": node["country"],
                    "similarity": round(best_score, 3),
                    "decision": decision,
                })

    # Build output tables
    clusters: dict[int, list[int]] = {}
    for i in range(len(nodes)):
        clusters.setdefault(uf.find(i), []).append(i)

    priority = {name: rank for rank, name in enumerate(DISPLAY_PRIORITY)}
    university_rows = []
    alias_rows = []

    for member_ids in clusters.values():
        display = min(member_ids, key=lambda k: (priority.get(nodes[k]["dataset"], 99), nodes[k]["name"]))
        display_node = nodes[display]
        uni_id = make_uni_id(display_node["name"], display_node["country"])

        university_rows.append({
            "uni_id": uni_id,
            "display_name": display_node["name"],
            "country": display_node["country"],
            "datasets": "|".join(sorted({nodes[k]["dataset"] for k in member_ids})),
        })
        for k in member_ids:
            alias_rows.append({
                "uni_id": uni_id,
                "dataset": nodes[k]["dataset"],
                "source_name": nodes[k]["name"],
                "source_country": nodes[k]["country"],
                "match_method": method[k],
                "confidence": confidence[k],
            })

    MATCHING_DIR.mkdir(parents=True, exist_ok=True)
    universities = pd.DataFrame(university_rows).sort_values(["country", "display_name"])
    aliases = pd.DataFrame(alias_rows).sort_values(["uni_id", "dataset"])
    review = pd.DataFrame(
        review_rows,
        columns=["dataset_a", "name_a", "dataset_b", "name_b", "country", "similarity", "decision"],
    ).sort_values(["decision", "similarity"], ascending=[True, False])

    universities.to_csv(UNIVERSITIES_FILE, index=False, encoding="utf-8")
    aliases.to_csv(ALIASES_FILE, index=False, encoding="utf-8")
    review.to_csv(REVIEW_FILE, index=False, encoding="utf-8-sig")

    return {
        "names": len(nodes),
        "universities": len(universities),
        "auto_fuzzy": int((aliases["match_method"] == "fuzzy").sum()),
        "manual": int((aliases["match_method"] == "manual").sum()),
        "review_pending": int((review["decision"] == "").sum()),
    }


# ---------------------------------------------------------------------------
# Lookup helpers used by the services
# ---------------------------------------------------------------------------

_alias_cache = None


def _alias_lookup() -> tuple[dict, dict]:
    """Returns ({(name_key, country_key): uni_id}, {name_key: uni_id or None})."""
    global _alias_cache
    if _alias_cache is not None:
        return _alias_cache

    full, by_name = {}, {}
    if ALIASES_FILE.exists() and UNIVERSITIES_FILE.exists():
        aliases = pd.read_csv(ALIASES_FILE, dtype=str).fillna("")
        for uni_id, name, country in zip(aliases["uni_id"], aliases["source_name"], aliases["source_country"]):
            k = name_key(name)
            full[(k, country_key(country))] = uni_id
            # A name shared by two different universities is ambiguous -> None
            by_name[k] = uni_id if by_name.get(k, uni_id) == uni_id else None

    _alias_cache = (full, by_name)
    return _alias_cache


_display_cache = None


def _display_lookup() -> dict:
    global _display_cache
    if _display_cache is not None:
        return _display_cache
    if not UNIVERSITIES_FILE.exists():
        return {}
    universities = pd.read_csv(UNIVERSITIES_FILE, dtype=str).fillna("")
    _display_cache = dict(zip(universities["uni_id"], universities["display_name"]))
    return _display_cache


def resolve_uni_id(name, country=None) -> str | None:
    full, by_name = _alias_lookup()
    k = name_key(name)
    if not k:
        return None
    return full.get((k, country_key(country))) or by_name.get(k)


def attach_uni_ids(df: pd.DataFrame, name_col: str, country_col: str | None = None) -> pd.DataFrame:
    """Adds `uni_id` and `display_name` columns. Existing columns are not changed."""
    df = df.copy()
    countries = df[country_col] if country_col and country_col in df.columns else [None] * len(df)
    df["uni_id"] = [resolve_uni_id(n, c) for n, c in zip(df[name_col], countries)]
    display = _display_lookup()
    df["display_name"] = [
        display.get(uid) or (str(n).strip() if not pd.isna(n) else "")
        for uid, n in zip(df["uni_id"], df[name_col])
    ]
    return df


def apply_display_names(df: pd.DataFrame, name_col: str, country_col: str | None = None) -> pd.DataFrame:
    """
    Makes every dataset show the same name for the same university.
    The original name is kept in `source_name`; `name_col` gets the display name.
    Rows that are not in the crosswalk keep their original name.
    """
    if name_col not in df.columns:
        return df
    df = attach_uni_ids(df, name_col, country_col)
    df["source_name"] = df[name_col]
    df[name_col] = df["display_name"].where(df["display_name"] != "", df[name_col])
    return df.drop(columns=["display_name"])


def clear_cache():
    global _alias_cache, _display_cache
    _alias_cache = None
    _display_cache = None
