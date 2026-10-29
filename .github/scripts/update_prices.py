#!/usr/bin/env python3
"""Read the gold price Google Sheet (as CSV) and update the price-data JSON in index.html.

The sheet must be viewable by "anyone with the link" (or set SHEET_CSV_URL to a
"Publish to web" CSV link). Only the <script id="price-data"> line is changed.
The 10:05 daily run and manual runs always refresh the stamp; the other runs
leave index.html untouched unless a price changed.
"""
import csv
import io
import json
import os
import re
import sys
import urllib.request
from datetime import datetime, timedelta, timezone

SHEET_ID = "1R7EbTiq1RsIxYtwMZjmsKhojqj1brs4LSkbMLeUEyy4"
CSV_URL = os.environ.get("SHEET_CSV_URL") or (
    f"https://docs.google.com/spreadsheets/d/{SHEET_ID}/export?format=csv&gid=0"
)
DAILY_SCHEDULE = "5 3 * * *"
INDEX = "index.html"

# Column A label -> key in price-data (column C holds the price)
LABELS = {
    "1 ບາດ": "baht1",
    "2 ສະຫຼຶງ": "salung2",
    "1 ສະຫຼຶງ": "salung1",
    "5 ຫຸນ": "hun5",
    "3 ຫຸນ": "hun3",
    "2 ຫຸນ": "hun2",
    "1 ຫຸນ": "hun1",
    "ຄຳແທ່ງ 1 ກຣາມ": "bar_gram",
    "ລາຄາຂາຍຄຳແທ່ງ 1 ບາດ": "bar_sell",
    "ຊື້ເຂົ້າ ຮູບປະພັນ": "buy_jewelry",
    "ຊື້ເຂົ້າ ຄຳແທ່ງສູງສຸດ": "buy_bar_max",
}


def norm(s):
    return re.sub(r"\s+", "", s or "")


def fetch_rows():
    req = urllib.request.Request(CSV_URL, headers={"User-Agent": "litpasong-price-bot"})
    with urllib.request.urlopen(req, timeout=60) as r:
        text = r.read().decode("utf-8-sig")
    if text.lstrip().startswith("<"):
        sys.exit("Sheet returned HTML, not CSV: share it as 'Anyone with the link can view' or set SHEET_CSV_URL")
    return list(csv.reader(io.StringIO(text)))


def read_prices(rows):
    wanted = {norm(label): key for label, key in LABELS.items()}
    prices = {}
    for row in rows:
        if len(row) < 3:
            continue
        key = wanted.get(norm(row[0]))
        if key and key not in prices:
            digits = re.sub(r"[,\s]", "", row[2])
            if digits.isdigit() and int(digits) > 0:
                prices[key] = f"{int(digits):,}"
    missing = [label for label, key in LABELS.items() if key not in prices]
    if missing:
        sys.exit("Missing or non-numeric price for: " + ", ".join(missing))
    return prices


def main():
    prices = read_prices(fetch_rows())

    with open(INDEX, encoding="utf-8") as f:
        html = f.read()
    pattern = re.compile(r'(<script id="price-data" type="application/json">)(.*?)(</script>)')
    m = pattern.search(html)
    if not m:
        sys.exit("price-data script not found in index.html")
    old = json.loads(m.group(2))

    forced = (
        os.environ.get("GITHUB_EVENT_NAME") != "schedule"
        or os.environ.get("SCHEDULE") == DAILY_SCHEDULE
    )
    changed = {k: (old.get(k), v) for k, v in prices.items() if old.get(k) != v}
    if not changed and not forced:
        print("Prices unchanged; leaving index.html as is")
        return

    now = datetime.now(timezone(timedelta(hours=7)))  # Asia/Vientiane
    data = {"stamp": now.strftime("ອັບເດດ ວັນທີ %d/%m/%Y ເວລາ %H:%M ໂມງ"), **prices}
    new_json = json.dumps(data, ensure_ascii=False)
    html = html[: m.start(2)] + new_json + html[m.end(2):]
    with open(INDEX, "w", encoding="utf-8") as f:
        f.write(html)

    for k, (a, b) in changed.items():
        print(f"{k}: {a} -> {b}")
    print(data["stamp"])


if __name__ == "__main__":
    main()
