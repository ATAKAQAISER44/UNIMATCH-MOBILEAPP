"""
Check candidate university websites: reachable, and title/host fits the name.

    python scripts/verify_websites.py <folder>

<folder>/site_candidates.txt holds one "University name|domain" per line.
Writes <folder>/site_results.csv with a verdict per site: "verified" (title or
address matches the name), "weak ..." (academic domain reachable but the title
is not in Latin script / missing), "check" (look at the title by hand) or
"unreachable". Verified sites go into data/audit/website_research.csv.
"""
import concurrent.futures as cf
import csv
import html
import re
import ssl
import sys
import unicodedata
import urllib.request

S = sys.argv[1]
GENERIC = {"university", "universidad", "universidade", "universita", "universitat", "universite", "universitas", "universiti",
           "institute", "institut", "instituto", "technology", "technological", "technical", "college", "national", "science",
           "sciences", "state", "school", "medical", "medicine", "health", "federal", "campus", "main", "studies", "research",
           "higher", "education", "academy", "polytechnic", "the", "and", "of", "de", "di", "del", "do", "da", "la", "des", "du",
           "applied", "engineering", "agricultural", "agriculture", "international", "public", "pontifical", "catholic", "degli",
           "studi", "university's", "technische", "universitaet", "universitat", "hochschule", "economics", "free"}


def fold(text):
    return unicodedata.normalize("NFKD", text).encode("ascii", "ignore").decode().lower()


def tokens(name):
    words = re.findall(r"[a-z]+", fold(re.sub(r"\([^)]*\)", " ", name)))
    distinct = [w for w in words if len(w) >= 4 and w not in GENERIC]
    initials = "".join(w[0] for w in words if w not in {"of", "the", "and", "de", "di", "la", "du", "des", "del", "da", "do"})
    acronyms = [fold(a) for a in re.findall(r"\(([A-Za-z\-]{2,10})\)", name)]
    return distinct, initials, acronyms


CTX = ssl.create_default_context()
CTX.check_hostname = False
CTX.verify_mode = ssl.CERT_NONE


def fetch(domain):
    for scheme in ("https://", "http://"):
        try:
            req = urllib.request.Request(scheme + domain, headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/124"})
            with urllib.request.urlopen(req, timeout=20, context=CTX) as r:
                body = r.read(200000)
                charset = r.headers.get_content_charset() or "utf-8"
                text = body.decode(charset, "ignore")
                m = re.search(r"<title[^>]*>(.*?)</title>", text, re.I | re.S)
                title = html.unescape(m.group(1)).strip() if m else ""
                return r.status, r.geturl(), re.sub(r"\s+", " ", title)[:150]
        except Exception as e:  # noqa: BLE001
            err = type(e).__name__
            if hasattr(e, "code") and e.code in (401, 403, 405, 406, 429):  # site blocks bots but exists
                return e.code, scheme + domain, ""
    return None, "", err


def check(line):
    name, domain = line.split("|", 1)
    status, final, title = fetch(domain.strip())
    host = re.sub(r"^https?://", "", final).split("/")[0].lower()
    distinct, initials, acronyms = tokens(name)
    hay = fold(title) + " " + host
    match = any(t in hay for t in distinct) or any(a and a in host for a in acronyms) or (len(initials) >= 3 and initials in host)
    latin = sum(c.isascii() and c.isalpha() for c in title) >= max(3, len(title) * 0.5)
    academic = bool(re.search(r"\.(edu|ac|edu\.[a-z]{2}|ac\.[a-z]{2})$|\.edu\b|univ|uni-", host))
    if status is None:
        verdict = "unreachable"
    elif match:
        verdict = "verified"
    elif status in (401, 403, 405, 406, 429) or not title:
        verdict = "weak (no title)" if academic else "check"
    elif not latin and academic:
        verdict = "weak (non-latin title)"
    else:
        verdict = "check"
    return {"name": name, "domain": domain.strip(), "status": status, "final": final, "title": title, "verdict": verdict}


lines = [l for l in open(f"{S}/site_candidates.txt", encoding="utf-8").read().splitlines() if "|" in l]
with cf.ThreadPoolExecutor(32) as pool:
    results = list(pool.map(check, lines))
with open(f"{S}/site_results.csv", "w", newline="", encoding="utf-8") as f:
    w = csv.DictWriter(f, fieldnames=list(results[0]))
    w.writeheader()
    w.writerows(results)
from collections import Counter
print(Counter(r["verdict"] for r in results))
