# UniMatch Python Backend

## University name matching

QS, THE, ARWU and the attributes file spell the same university differently
("Technische Universität Berlin" vs "Technical University of Berlin").
`app/matching/university_matcher.py` gives each university one id (`uni_id`)
and one display name, so every page shows the same name and attributes are
joined to the right university. Original CSV files are never changed; the
name a ranking originally used is kept in the `source_name` column.

Files in `data/matching/`:

| File | What it holds |
|---|---|
| `universities.csv` | one row per university: `uni_id`, `display_name`, `country` |
| `university_aliases.csv` | every original name in every dataset, and its `uni_id` |
| `review_needed.csv` | pairs that are *probably* the same university |

Rebuild after changing any ranking/attribute CSV:

```bash
python scripts/build_university_crosswalk.py
```

### Reviewing doubtful pairs

1. Open `data/matching/review_needed.csv` in Excel.
2. In the `decision` column write `yes` (same university) or `no` (different).
   Leaving it empty is safe: the pair is simply not merged.
3. Save as CSV and run the script again. Decisions are kept on every re-run.
