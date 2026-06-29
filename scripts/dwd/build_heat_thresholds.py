"""Hitze-Schwellen: DWD-Stationsmessungen (Tagesmaximum TXK) → Bundesland-JSON.

Lädt für alle DWD-KL-Tageswert-Stationen (historical) die Tagesmaxima, aggregiert
sie je Bundesland zum Tages-Maximum (max über alle Stationen des Landes) und
berechnet daraus robuste Kennzahlen:

  • Allzeit-Rekord je Bundesland (Wert, Datum, Station)
  • je Schwelle (30/35/40 °C): frühester Kalendertag je gemessen (+ Jahr/Datum),
    erstes Jahr überhaupt, Anzahl Jahre mit Überschreitung, Gesamtzahl Tage
  • erster Termin je Jahr (für spätere Detailansichten)

  public/heat_thresholds.json

Lauf:  .venv-sat/Scripts/python.exe scripts/dwd/build_heat_thresholds.py

Hinweis: Stations-Rohdaten werden in cache_kl/ gecacht (einmaliger großer
Download ~300 MB). Re-Lauf nutzt den Cache.
"""

import io
import re
import sys
import urllib.request
import zipfile
from datetime import date
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8")

HERE = Path(__file__).resolve().parent
CACHE = HERE / "cache_kl"
PUB = HERE.parents[1] / "public"

BASE = "https://opendata.dwd.de/climate_environment/CDC/observations_germany/climate/daily/kl/historical"
STATION_LIST = f"{BASE}/KL_Tageswerte_Beschreibung_Stationen.txt"
SOURCE = "Deutscher Wetterdienst (DWD), Climate Data Center — Stationsmessungen Tagesmaximum der Lufttemperatur (TXK), DL-DE/BY-2.0"

THRESHOLDS = [30, 35, 40]

# Bundesland-Klartext (DWD) → UBA-Code. Längste zuerst prüfen (Sachsen-Anhalt vor Sachsen).
BL_CODE = [
    ("Baden-Württemberg", "BW"), ("Mecklenburg-Vorpommern", "MV"),
    ("Nordrhein-Westfalen", "NW"), ("Rheinland-Pfalz", "RP"),
    ("Schleswig-Holstein", "SH"), ("Sachsen-Anhalt", "ST"),
    ("Niedersachsen", "NI"), ("Brandenburg", "BB"), ("Thüringen", "TH"),
    ("Saarland", "SL"), ("Sachsen", "SN"), ("Bayern", "BY"),
    ("Hessen", "HE"), ("Berlin", "BE"), ("Hamburg", "HH"),
    ("Bremen", "HB"),
]
BL_NAME = {
    "SH": "Schleswig-Holstein", "HH": "Hamburg", "NI": "Niedersachsen",
    "HB": "Bremen", "NW": "Nordrhein-Westfalen", "HE": "Hessen",
    "RP": "Rheinland-Pfalz", "BW": "Baden-Württemberg", "BY": "Bayern",
    "SL": "Saarland", "BE": "Berlin", "BB": "Brandenburg",
    "MV": "Mecklenburg-Vorpommern", "SN": "Sachsen", "ST": "Sachsen-Anhalt",
    "TH": "Thüringen",
}


def fetch(url):
    return urllib.request.urlopen(url, timeout=120).read()


def parse_stations():
    """{station_id: (name, bl_code)} aus der Beschreibungsdatei."""
    txt = fetch(STATION_LIST).decode("latin-1")
    out = {}
    for line in txt.splitlines()[2:]:
        if len(line) < 80:
            continue
        sid = line[:5].strip()
        rest = line[60:]  # nach geoLaenge: Stationsname + Bundesland + Abgabe
        bl = next((code for name, code in BL_CODE if name in rest), None)
        if not bl:
            continue
        name = rest[: rest.index(next(n for n, c in BL_CODE if c == bl))].strip()
        out[sid] = (name, bl)
    return out


def file_map():
    """{station_id: zip-Dateiname} aus dem Verzeichnislisting."""
    html = fetch(BASE + "/").decode("utf-8", "replace")
    fm = {}
    for full, sid in re.findall(r"(tageswerte_KL_(\d{5})_\d+_\d+_hist\.zip)", html):
        fm[sid] = full
    return fm


def station_daily_max(sid, fname):
    """{ 'YYYYMMDD': txk } für eine Station (mit lokalem Cache)."""
    cp = CACHE / fname
    if cp.exists() and cp.stat().st_size > 0:
        raw = cp.read_bytes()
    else:
        raw = fetch(f"{BASE}/{fname}")
        cp.write_bytes(raw)
    z = zipfile.ZipFile(io.BytesIO(raw))
    pname = next(n for n in z.namelist() if n.startswith("produkt"))
    lines = z.read(pname).decode("latin-1").splitlines()
    hdr = [h.strip() for h in lines[0].split(";")]
    di, ti = hdr.index("MESS_DATUM"), hdr.index("TXK")
    out = {}
    for line in lines[1:]:
        p = line.split(";")
        if len(p) <= ti:
            continue
        try:
            v = float(p[ti].strip())
        except ValueError:
            continue
        if v > -999:
            out[p[di].strip()] = v
    return out


def main():
    CACHE.mkdir(exist_ok=True)
    stations = parse_stations()
    fmap = file_map()
    sids = [s for s in stations if s in fmap]
    print(f"Stationen: {len(sids)} (mit Datei) von {len(stations)} gelistet")

    # Bundesland-Tagesmaximum: bl -> { 'YYYYMMDD': (txk, station_name) }
    bl_day = {c: {} for c in BL_NAME}
    for i, sid in enumerate(sids, 1):
        name, bl = stations[sid]
        try:
            dmax = station_daily_max(sid, fmap[sid])
        except Exception as e:
            print(f"  ! {sid} {name}: {e}")
            continue
        day = bl_day[bl]
        for d, v in dmax.items():
            cur = day.get(d)
            if cur is None or v > cur[0]:
                day[d] = (v, name)
        if i % 100 == 0:
            print(f"  {i}/{len(sids)} …")

    # Kennzahlen je Bundesland
    states = []
    nat_record = {"temp": -999}
    for bl, name in BL_NAME.items():
        day = bl_day[bl]
        if not day:
            continue
        # Allzeit-Rekord
        rec_date, (rec_t, rec_st) = max(day.items(), key=lambda kv: kv[1][0])
        record = {"temp": round(rec_t, 1), "date": f"{rec_date[:4]}-{rec_date[4:6]}-{rec_date[6:]}", "station": rec_st}
        if rec_t > nat_record["temp"]:
            nat_record = {"temp": round(rec_t, 1), "date": record["date"], "station": rec_st, "state": bl}

        stats = {}
        first_by_year = {}
        for T in THRESHOLDS:
            # erster Tag je Jahr, an dem BL-Max >= T
            fy = {}
            for d in sorted(k for k, v in day.items() if v[0] >= T):
                y = d[:4]
                if y not in fy:
                    fy[y] = d
            stats_T = {}
            if fy:
                years = sorted(fy)
                # frühester Kalendertag (MM-DD) über alle Jahre
                earliest_d = min(fy.values(), key=lambda d: d[4:])
                stats_T = {
                    "earliestMd": f"{earliest_d[4:6]}-{earliest_d[6:]}",
                    "earliestDate": f"{earliest_d[:4]}-{earliest_d[4:6]}-{earliest_d[6:]}",
                    "firstYear": int(years[0]),
                    "yearsReached": len(years),
                    "daysTotal": sum(1 for v in day.values() if v[0] >= T),
                }
            stats[str(T)] = stats_T
            first_by_year[str(T)] = {y: f"{d[4:6]}-{d[6:]}" for y, d in fy.items()}

        states.append({
            "code": bl, "name": name, "record": record,
            "stats": stats, "firstByYear": first_by_year,
        })

    states.sort(key=lambda s: -s["record"]["temp"])
    out = {
        "generated": date.today().isoformat(),
        "source": SOURCE,
        "thresholds": THRESHOLDS,
        "national": nat_record,
        "states": states,
    }
    p = PUB / "heat_thresholds.json"
    import json
    p.write_text(json.dumps(out, separators=(",", ":"), ensure_ascii=False), encoding="utf-8")
    print(f"\nGeschrieben: {p}  ({p.stat().st_size/1e6:.2f} MB)")
    print(f"National-Rekord: {nat_record['temp']} °C am {nat_record['date']} ({nat_record['state']}, {nat_record['station']})")
    print("Bundesland-Rekorde (Top 5):")
    for s in states[:5]:
        r = s["record"]
        print(f"  {s['name']}: {r['temp']} °C · {r['date']} · {r['station']}")


if __name__ == "__main__":
    main()
