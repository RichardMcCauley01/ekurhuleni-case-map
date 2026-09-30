#!/usr/bin/env python3
"""Precinct-level context: SAPS murder (and sexual-offence) counts per police station precinct + Census 2022 population.
Inputs (tools/raw/, downloaded 2026-09-30; not shipped in the site):
  SAPS quarterly crime statistics workbooks (https://www.saps.gov.za/services/crimestats.php):
    2025-2026_-_1st/2nd/3rd/4th_Quarter_WEB.xlsx  (Apr 2025 - Mar 2026 = financial year 2025/26)
    2026-2027_-_1st_Quarter_WEB.xlsm               (Apr - Jun 2026, latest quarter released)
  police_stations.gpkg / police_stations.csv from https://github.com/afrith/crime-stats
    (police-district boundaries from Stats SA, coverage-cleaned; Census 2022 population per police district from Stats SA SuperWeb)
Requires: openpyxl, shapely  (python3 -m venv .venv && .venv/bin/pip install openpyxl shapely)
Output: data/crime.json and js/crime.js (window.CRIME_DATA)."""
import json, os, sqlite3, sys, re
import openpyxl
from shapely import wkb
from shapely.geometry import Point, mapping
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RAW = os.path.join(ROOT, "tools", "raw")
sys.path.insert(0, os.path.join(ROOT, "tools"))
QFILES = [("2025-2026_-_1st_Quarter_WEB.xlsx", "Apr-Jun 2025"), ("2025-2026_-_2nd_Quarter_WEB.xlsx", "Jul-Sep 2025"),
          ("2025-2026_-_3rd_Quarter_WEB.xlsx", "Oct-Dec 2025"), ("2025-2026_-_4th_Quarter_WEB.xlsx", "Jan-Mar 2026")]
LATEST = ("2026-2027_-_1st_Quarter_WEB.xlsm", "Apr-Jun 2026")
CATS = ["Murder", "Sexual offences"]
EXTRA = {"Moroka"}   # Soweto case (outside Ekurhuleni)

def read_q(fn):
    """Return {(station, cat): (latest-quarter total, prior-year same-quarter total, label)} for Ekurhuleni District + EXTRA."""
    wb = openpyxl.load_workbook(os.path.join(RAW, fn), read_only=True, data_only=True)
    ws = wb["RAW Data"]; out = {}; hdr = None
    for i, r in enumerate(ws.iter_rows(values_only=True)):
        if i == 2:
            hdr = [str(x) if x is not None else "" for x in r]
            qcols = [j for j, h in enumerate(hdr) if " to " in h]
            last, prev = qcols[-1], qcols[-2]; label = hdr[last].replace("\n", "").replace("  ", " ")
            continue
        if i < 3 or r[7] not in CATS: continue
        if r[5] == "Ekurhuleni District" or r[4] in EXTRA:
            out[(r[4], r[7])] = (int(r[last] or 0), int(r[prev] or 0), label, r[5])
    return out

qdata = [read_q(f) for f, _ in QFILES]
latest = read_q(LATEST[0])
stations = sorted({k[0] for k in latest})

# boundaries + population
db = sqlite3.connect(os.path.join(RAW, "ps.gpkg"))
def gp(blob):
    env = (blob[3] >> 1) & 7; n = {0: 0, 1: 32, 2: 48, 3: 48, 4: 64}[env]
    return wkb.loads(bytes(blob[8 + n:]))
geo = {}
for name, pop, area, blob in db.execute("select name, population, area_km2, geom from police_stations "):
    geo[name] = dict(pop=pop, area=area, geom=gp(blob))
ALIAS = {"Kwa Thema": "Kwa Thema"}

rows = []
for st in stations:
    g = geo.get(ALIAS.get(st, st))
    rec = dict(station=st, district=latest[(st, "Murder")][3], population2022=g["pop"] if g else None, areaKm2=g["area"] if g else None)
    for c in CATS:
        key = c.lower().replace(" ", "_")
        fy = sum(q[(st, c)][0] for q in qdata)
        rec[key + "_fy2025_26"] = fy
        rec[key + "_quarters_fy2025_26"] = [q[(st, c)][0] for q in qdata]
        rec[key + "_q1_2026_27"] = latest[(st, c)][0]
        rec[key + "_q1_2025_26_in_latest_release"] = latest[(st, c)][1]
        if g and g["pop"]:
            rec[key + "_rate_per100k_fy2025_26"] = round(fy / g["pop"] * 100000, 1)
    rows.append(rec)

# precinct for each case pin (approximate pins -> approximate precinct)
exec(open(os.path.join(ROOT, "tools", "build_data.py")).read().split("# ---------------- EVENTS")[0])
case_prec = {}
for c in CASES:
    p = Point(c["found"]["lng"], c["found"]["lat"])
    hit = [n for n, g in geo.items() if g["geom"].contains(p)]
    near = []
    for n, g in geo.items():
        if n in hit: continue
        d = g["geom"].distance(p) * 100  # deg -> ~km at this latitude (rough)
        if d < 1.2: near.append(n)
    case_prec[c["id"]] = dict(precinct=hit[0] if hit else None, nearBorderWith=sorted(near))

# simplified polygons for the choropleth (Ekurhuleni District stations + Moroka)
feats = []
for st in stations:
    g = geo.get(st)
    if not g: continue
    simp = g["geom"].simplify(0.0006, preserve_topology=True)
    gj = mapping(simp)
    def rnd(o):
        if isinstance(o, (list, tuple)):
            if o and isinstance(o[0], (int, float)): return [round(o[0], 4), round(o[1], 4)]
            return [rnd(x) for x in o]
        return o
    gj = {"type": gj["type"], "coordinates": rnd(gj["coordinates"])}
    feats.append({"type": "Feature", "properties": {"station": st}, "geometry": gj})

meta = dict(
  fy="2025/26 (1 April 2025 - 31 March 2026)", fyMethod="Sum of the four SAPS quarterly releases for 2025/26 (each quarter taken from its own release). SAPS quarterly figures can be revised in later releases, so this may differ slightly from an annual report.",
  latestQuarter="April-June 2026 (SAPS 2026/27 Q1 release)", populationNote="Population: Stats SA Census 2022 per police district (as compiled in afrith/crime-stats). Rates use 2022 population with 2025/26 counts, so they are indicative only. Precincts with business districts, industry or transport hubs (e.g. Germiston, Primrose, Kempton Park) have many daytime visitors but few residents, so rates per resident can look high there.",
  scopeNote="Figures cover a whole police station precinct (all murders reported there), not the exact place where a body was found. The precinct is the one that contains each approximate map pin. Near a precinct border, the case may fall under the neighbouring station.",
  sources=[dict(title="SAPS crime statistics: quarterly releases 2025/26 Q1-Q4 and 2026/27 Q1 (station-level workbooks)", url="https://www.saps.gov.za/services/crimestats.php", outlet="South African Police Service", date="accessed 2026-09-30"),
           dict(title="afrith/crime-stats: police district boundaries (Stats SA) and Census 2022 population per police district", url="https://github.com/afrith/crime-stats", outlet="GitHub (Adrian Frith), from Stats SA data", date="accessed 2026-09-30")])
out = dict(meta=meta, stations=rows, casePrecincts=case_prec, geo={"type": "FeatureCollection", "features": feats})
json.dump(out, open(os.path.join(ROOT, "data", "crime.json"), "w"), ensure_ascii=False)
open(os.path.join(ROOT, "js", "crime.js"), "w").write("// Generated by tools/build_crime.py - SAPS precinct statistics (see data/crime.json meta).\nwindow.CRIME_DATA = " + json.dumps(out, ensure_ascii=False) + ";\n")
print(len(rows), "stations;", len(feats), "polygons")
for cid, v in case_prec.items():
    r = next((x for x in rows if x["station"] == v["precinct"]), None)
    print(cid, v, r and (r["murder_fy2025_26"], r["murder_q1_2026_27"], r.get("murder_rate_per100k_fy2025_26"), r["population2022"]))
