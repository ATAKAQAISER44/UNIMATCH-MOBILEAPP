"""
Turns the many ways tuition fees were written into one format:
    "$12,180"            one yearly amount in US dollars
    "$1,000 – $2,500"    a yearly range in US dollars
    "$0"                 free

normalize_fee(value, country) returns (formatted_value, status). status is
"ok", "converted" (another currency changed to USD), "empty", or
"needs research" when the value cannot be trusted as written (no currency
given, per-semester/monthly amounts, text such as "Subsidized"). Values that
need research are returned as "" so a wrong number is never shown.
"""

import re

# Fixed conversion table (approximate 2025 averages), so every conversion is
# reproducible and can be quoted.
USD_RATE = {
    "USD": 1.0, "EUR": 1.13, "GBP": 1.32, "CHF": 1.20, "CAD": 0.72, "AUD": 0.65, "NZD": 0.59,
    "JPY": 0.0068, "CNY": 0.139, "RMB": 0.139, "HKD": 0.128, "SGD": 0.76, "KRW": 0.00071,
    "INR": 0.0115, "PKR": 0.0036, "SEK": 0.10, "NOK": 0.096, "DKK": 0.152, "MYR": 0.23,
    "TRY": 0.026, "SAR": 0.267, "AED": 0.272, "QAR": 0.275, "EGP": 0.020, "ZAR": 0.055,
    "BRL": 0.18, "MXN": 0.054, "RUB": 0.012, "THB": 0.030, "IDR": 0.000062, "TWD": 0.031,
    "ILS": 0.28, "PLN": 0.27, "CZK": 0.045, "HUF": 0.0028,
    "CLP": 0.00105, "COP": 0.00024, "ARS": 0.00085, "MOP": 0.124, "KZT": 0.0020, "VND": 0.000039, "ISK": 0.0073, "NGN": 0.00065, "UAH": 0.024,
}
SYMBOLS = {"€": "EUR", "£": "GBP", "¥": "JPY", "₹": "INR", "₩": "KRW"}
# Countries whose own currency is the US dollar: a bare number there is USD.
USD_COUNTRIES = {"united states", "united states of america", "ecuador", "el salvador", "panama", "puerto rico"}
FREE_WORDS = re.compile(r"\bfree\b|no tuition|tuition[- ]free", re.I)
PERIOD_WORDS = re.compile(r"semester|per term|per month|monthly|/month|/sem|per credit|per unit|quarter", re.I)


def _currency(text):
    for symbol, code in SYMBOLS.items():
        if symbol in text:
            return code
    codes = re.findall(r"\b([A-Z]{3})\b", text.upper())
    for code in codes:
        if code in USD_RATE and code != "USD":
            return code
    if "$" in text or "USD" in text.upper():
        return "USD"
    return None


def _amounts(text):
    # Drop notes in brackets ("(UniPage)", "[3]", "(varies by program)") before reading numbers
    text = re.sub(r"\([^)]*\)|\[[^\]]*\]", " ", text)
    numbers = []
    for raw in re.findall(r"\d[\d,]*(?:\.\d+)?\s*[kK]?\b", text):
        thousands = raw.strip().lower().endswith("k")
        value = float(raw.lower().rstrip("k ").replace(",", ""))
        numbers.append(value * 1000 if thousands else value)
    return numbers


def _fmt(amount, converted=False):
    # Dollar amounts stay exactly as written; converted ones are rounded to $10.
    if converted and amount >= 100:
        amount = round(amount, -1)
    return f"${int(round(amount)):,}"


def normalize_fee(value, country=""):
    text = str(value or "").replace("\xa0", " ").strip()
    if not text:
        return "", "empty"
    numbers = _amounts(text)

    if not numbers:
        return ("$0", "ok") if FREE_WORDS.search(text) else ("", "needs research")
    if PERIOD_WORDS.search(text):
        return "", "needs research"

    currency = _currency(text)
    if currency is None:
        if all(n == 0 for n in numbers):
            return "$0", "ok"
        if country.strip().lower() in USD_COUNTRIES:
            currency = "USD"
        else:
            return "", "needs research"

    low, high = min(numbers) * USD_RATE[currency], max(numbers) * USD_RATE[currency]
    converted = currency != "USD"
    status = "converted" if converted else "ok"
    if high == 0:
        return "$0", status
    if _fmt(low, converted) == _fmt(high, converted):
        return _fmt(low, converted), status
    return f"{_fmt(low, converted)} – {_fmt(high, converted)}", status
