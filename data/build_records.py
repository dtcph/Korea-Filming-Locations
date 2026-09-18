"""Regenerate data/records.json from ../data.csv + ../data_kr.csv + ../geo/*.json.

The English CSV and the Korean CSV describe the exact same 286 physical
locations (identical ids, identical province/district/neighborhood presence
for every id) — they are two language labelings of one dataset, not two
different sets of places. This script merges them by id, so each output
record carries both an English and a Korean title (plus the Korean search
term and native-script location names), and a single geocoded position.

Run from anywhere with:  python3 data/build_records.py   (from the project root)
"""
import csv, json, os, re

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

provinces = json.load(open(f"{BASE}/geo/provinces-topo.json"))["objects"]["skorea_provinces_2018_geo"]["geometries"]
munis = json.load(open(f"{BASE}/geo/municipalities-topo.json"))["objects"]["skorea_municipalities_2018_geo"]["geometries"]

def norm(s):
    return re.sub(r"[^a-z0-9]", "", s.lower())

prov_by_name = {norm(g["properties"]["name_eng"]): g["properties"] for g in provinces}

# Known typos / OCR-ish issues in the source CSV's district column.
ALIASES = {
    norm("goseng-gun"): norm("goseong-gun"),
    norm("sancheon-gun"): norm("sancheong-gun"),
}

def find_muni(province_code, district):
    if not district:
        return None
    n = norm(district)
    n = ALIASES.get(n, n)
    candidates = [g["properties"] for g in munis if g["properties"]["code"].startswith(province_code)]
    # exact match
    for p in candidates:
        if norm(p["name_eng"]) == n:
            return p
    # compound (e.g. "Suwon-si Paldal-gu" -> "suwonsipaldalgu")
    parts = re.split(r"\s+", district.strip())
    if len(parts) > 1:
        combo = norm("".join(parts))
        for p in candidates:
            if norm(p["name_eng"]) == combo:
                return p
    # substring: municipality name is a prefix/substring of the district string
    best = None
    for p in candidates:
        pn = norm(p["name_eng"])
        if pn and (pn in n or n in pn):
            if best is None or len(pn) > len(norm(best["name_eng"])):
                best = p
    return best

# The municipality topology glues some compound names into one lowercase
# word (e.g. "Suwonsipaldalgu") or drops the parent city (bare "Buk-gu" for
# Pohang). These are the only such codes this dataset actually uses. (The
# Korean "name" field doesn't have this problem - Korean compounds fine
# without spaces - so only the English side needs a lookup.)
PRETTY_MUNI = {
    "31013": "Suwon-si Paldal-gu",
    "31191": "Yongin-si Cheoin-gu",
    "31192": "Yongin-si Giheung-gu",
    "31260": "Yangju-si",
    "37012": "Pohang-si Buk-gu",
    "31250": "Gwangju-si",
}

def classify(name):
    low = name.lower()
    if "studio" in low or "theme park" in low or "production" in low or "ticket office" in low:
        return "Studio & Theme Park"
    if "kbs" in low or "mbc" in low or "sbs" in low or "drama" in low:
        return "TV Drama"
    return "Film"

en_rows = list(csv.reader(open(f"{BASE}/data.csv", encoding="cp949")))[1:]
kr_rows = list(csv.reader(open(f"{BASE}/data_kr.csv", encoding="cp949")))[1:]
kr_by_id = {r[0].strip(): r for r in kr_rows}

records = []
unmatched_geo = 0
for r in en_rows:
    key, name_en, prov, dist, dong = [c.strip() for c in r]
    kr = kr_by_id.get(key)
    # kr columns: id, category1, category2, category3, searchTerm, name, province, district, neighborhood
    name_kr = kr[5].strip() if kr else None
    search_kr = kr[4].strip() if kr and kr[4].strip() else None
    neighborhood_kr = kr[8].strip() if kr and kr[8].strip() else None

    prov_props = prov_by_name.get(norm(prov)) if prov else None
    muni_props = find_muni(prov_props["code"], dist) if prov_props else None
    if prov and not muni_props:
        unmatched_geo += 1

    records.append({
        "id": key,
        "nameEn": name_en or None,
        "nameKr": name_kr or None,
        "searchKr": search_kr,
        "province": prov or None,
        "provinceKr": prov_props["name"] if prov_props else None,
        "provinceCode": prov_props["code"] if prov_props else None,
        "district": dist or None,
        "muniCode": muni_props["code"] if muni_props else None,
        "muniName": (PRETTY_MUNI.get(muni_props["code"], muni_props["name_eng"]) if muni_props else None),
        "muniNameKr": muni_props["name"] if muni_props else None,
        "neighborhood": dong or None,
        "neighborhoodKr": neighborhood_kr,
        "type": classify(name_en),
    })

print("total records:", len(records))
print("with province:", sum(1 for x in records if x["province"]))
print("with muni match:", sum(1 for x in records if x["muniCode"]))
print("with korean title:", sum(1 for x in records if x["nameKr"]))
print("unmatched geo (had district, no muni):", unmatched_geo)

by_type = {}
for r in records:
    by_type[r["type"]] = by_type.get(r["type"], 0) + 1
print("by type:", by_type)

with open(f"{BASE}/data/records.json", "w") as f:
    json.dump(records, f, ensure_ascii=False, indent=1)
