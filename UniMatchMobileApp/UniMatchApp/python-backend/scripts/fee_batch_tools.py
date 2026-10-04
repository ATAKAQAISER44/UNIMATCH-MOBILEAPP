"""Small helpers for writing fee research batches (used while researching)."""

import json
import subprocess
import sys
from pathlib import Path

from fee_format import USD_RATE

BACKEND = Path(__file__).resolve().parents[1]


def usd(currency, low, high=None):
    """Yearly amount(s) in a currency -> "$12,180" or "$1,000 – $2,500"."""
    rate = USD_RATE[currency]

    def fmt(x):
        value = x * rate
        if currency != "USD" and value >= 100:
            value = round(value, -1)
        return f"${int(round(value)):,}"

    if high is None or fmt(low) == fmt(high):
        return fmt(low)
    return f"{fmt(low)} – {fmt(high)}"


class Batch:
    def __init__(self, name):
        self.name = name
        self.rows = []

    def add(self, institutions, local, international, sources, notes):
        """institutions: one name or a list of names (duplicate rows of the same university)."""
        names = [institutions] if isinstance(institutions, str) else institutions
        for name in names:
            self.rows.append({
                "Institution_Name": name,
                "Tuition Fee (local)": local,
                "Tuition Fee (international)": international,
                "Sources": sources,
                "Notes": notes,
                "Batch": self.name,
            })

    def save_and_apply(self, scratch_dir):
        path = Path(scratch_dir) / f"batch_{self.name}.json"
        path.write_text(json.dumps(self.rows, ensure_ascii=False, indent=1), encoding="utf-8")
        for row in self.rows:
            print(f"  {row['Institution_Name'][:48]:49} {row['Tuition Fee (local)'] or '(empty)':20} {row['Tuition Fee (international)'] or '(empty)'}")
        run = lambda *args, cwd: subprocess.run([sys.executable, *args], cwd=cwd, check=True,
                                                 capture_output=True, text=True, encoding="utf-8").stdout
        print(run("scripts/add_research_batch.py", str(path), cwd=BACKEND).strip())
        out = run("fix_university_attributes.py", cwd=BACKEND / "scripts")
        for line in out.splitlines():
            if "WARNING" in line or "untrusted" in line or "researched so far" in line:
                print(" ", line)
        run("app/attributes/run_attribute_preprocessing.py", cwd=BACKEND)
