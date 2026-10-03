# app/services/data_cache.py
"""
In-memory cache for the static CSV datasets (QS / THE / ARWU / attributes).

Why: every API request used to call pandas.read_csv() and redo the same
preparation work. The CSV files only change when you re-run preprocessing,
so we load each file once and reuse it.

Cache invalidation: every entry is keyed by the file's last-modified time.
If you replace or re-generate a CSV, the next request sees the new mtime and
reloads it automatically - no server restart needed.

Callers always receive a COPY of the cached DataFrame, so code that adds or
changes columns can never corrupt the cached version.
"""

import threading
from pathlib import Path

_lock = threading.Lock()
_cache: dict = {}


def file_version(path) -> float:
    """Last-modified time of a file, or 0.0 if it does not exist."""
    try:
        return Path(path).stat().st_mtime
    except OSError:
        return 0.0


def get_cached(key, version, builder):
    """
    Return the cached value for `key` if it was built for the same `version`,
    otherwise call `builder()` once, store the result and return it.
    The cached object itself is returned - callers must copy DataFrames.
    """
    with _lock:
        entry = _cache.get(key)
        if entry is not None and entry[0] == version:
            return entry[1]

    value = builder()

    with _lock:
        _cache[key] = (version, value)

    return value


def clear_cache():
    with _lock:
        _cache.clear()
