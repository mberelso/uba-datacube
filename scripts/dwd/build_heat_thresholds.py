"""Hitze-Schwellen: DWD-Stationsmessungen (Tagesmaximum TXK) → Bundesland-JSON.

Lädt für alle DWD-KL-Tageswert-Stationen (historical + recent) die Tagesmaxima, aggregiert
sie je Bundesland zum Tages-Maximum (max über alle Stationen des Landes) und
berechnet daraus robuste Kennzahlen:

  • Allzeit-Rekord je Bundesland (Wert, Datum, Station)
  • je Schwelle (30/35/40 °C): frühester Kalendertag je gemessen (+ Jahr/Datum),
    erstes Jahr überhaupt, Anzahl Jahre mit Überschreitung, Gesamtzahl Tage
  • erster Termin je Jahr (für spätere Detailansichten)

  public/heat_thresholds.json
"""

import io
import json
import re
import sys
import time
import urllib.request
import zipfile
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import date
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8")

HERE = Path(__file__).resolve().parent
CACHE = HERE / "cache_kl"
PUB = HERE.parents[1] / "public"

KL = "https://opendata.dwd.de/climate_environment/CDC/observations_germany/climate/daily/kl"
BASE = f"{KL}/historical"
RECENT = f"{KL}/recent"
STATION_LIST = f"{BASE}/KL_Tageswerte_Beschreibung_Stationen.txt"
SOURCE = "Deutscher Wetterdienst (DWD), Climate Data Center — Stationsmessungen Tagesmaximum der Lufttemperatur (TXK), DL-DE/BY-2.0"

THRESHOLDS = [30, 35, 40]

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


def fetch(url, tries=3):
    for i in range(tries):
        try:
            req = urllib.request.Request(
                url,
                headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}
            )
            return urllib.request.urlopen(req, timeout=30).read()
        except Exception:
            if i == tries - 1:
                raise
            time.sleep(2 ** i)


def parse_stations():
    """{station_id: (name, bl_code, lat, lon)} aus der Beschreibungsdatei."""
    txt = fetch(STATION_LIST).decode("latin-1")
    out = {}
    for line in txt.splitlines()[2:]:
        if len(line) < 80:
            continue
        sid = line[:5].strip()
        head = line[:60].split()
        try:
            lat, lon = float(head[4]), float(head[5])
        except (IndexError, ValueError):
            lat = lon = None
        rest = line[60:]
        bl = next((code for name, code in BL_CODE if name in rest), None)
        if not bl:
            continue
        name = rest[: rest.index(next(n for n, c in BL_CODE if c == bl))].strip()
        out[sid] = (name, bl, lat, lon)
    return out


def file_map():
    """{station_id: zip-Dateiname} aus dem Verzeichnislisting."""
    html = fetch(BASE + "/").decode("utf-8", "replace")
    fm = {}
    for full, sid in re.findall(r"(tageswerte_KL_(\d{5})_\d+_\d+_hist\.zip)", html):
        fm[sid] = full
    return fm


def recent_file_map():
    """{station_id: zip-Dateiname} aus dem RECENT-Verzeichnislisting."""
    try:
        html = fetch(RECENT + "/").decode("utf-8", "replace")
        fm = {}
        for full, sid in re.findall(r"(tageswerte_KL_(\d{5})_akt\.zip)", html):
            fm[sid] = full
        return fm
    except Exception as e:
        print(f"  ! Hinweis: Recent-Directory Listing nicht geladen ({e})")
        return {}


def parse_txk(raw):
    """{ 'YYYYMMDD': txk } aus einem KL-Tageswerte-ZIP."""
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


def station_daily_max(sid, fname, rfname):
    out = {}
    if fname:
        cp = CACHE / fname
        if cp.exists() and cp.stat().st_size > 0:
            raw = cp.read_bytes()
        else:
            raw = fetch(f"{BASE}/{fname}")
            cp.write_bytes(raw)
        out.update(parse_txk(raw))

    if rfname:
        try:
            rraw = fetch(f"{RECENT}/{rfname}")
            for d, v in parse_txk(rraw).items():
                if d not in out or v > out[d]:
                    out[d] = v
        except Exception as e:
            print(f"  ! Hinweis: Station {sid} Recent-Fetch fehlgeschlagen ({e})")
    return out


def main():
    CACHE.mkdir(exist_ok=True)
    out_file = PUB / "heat_thresholds.json"

    # Quick Mode Check: Wenn public/heat_thresholds.json bereits existiert und
    # '--skip-if-exists' übergeben wurde, beende sofort erfolgreich.
    if "--skip-if-exists" in sys.argv and out_file.exists() and out_file.stat().st_size > 1000:
        print(f"✅ public/heat_thresholds.json existiert bereits ({out_file.stat().st_size / 1e6:.2f} MB). Überspringe DWD-Download.")
        return

    print("🔍 Lade DWD Stationen & Verzeichnislisten...")
    stations = parse_stations()
    fmap = file_map()
    rfmap = recent_file_map()

    sids = list(stations)
    print(f"Stationen: {len(sids)} ({sum(s in fmap for s in sids)} hist, {len(rfmap)} akt)")

    bl_day = {c: {} for c in BL_NAME}
    errors = []

    def process_station(sid):
        name, bl, lat, lon = stations[sid]
        try:
            dmax = station_daily_max(sid, fmap.get(sid), rfmap.get(sid))
            return sid, bl, name, lat, lon, dmax, None
        except Exception as e:
            return sid, bl, name, lat, lon, {}, str(e)

    completed = 0
    print("⚡ Verarbeite Stationen in parallelen Worker-Threads...")
    with ThreadPoolExecutor(max_workers=16) as executor:
        futures = {executor.submit(process_station, sid): sid for sid in sids}
        for future in as_completed(futures):
            completed += 1
            sid, bl, name, lat, lon, dmax, err = future.result()
            if err:
                errors.append((sid, err))
            day = bl_day[bl]
            for d, v in dmax.items():
                cur = day.get(d)
                if cur is None or v > cur[0]:
                    day[d] = (v, name, lat, lon)
            if completed % 200 == 0 or completed == len(sids):
                print(f"  {completed}/{len(sids)} Stationen verarbeitet...")

    if errors:
        print(f"⚠️ {len(errors)} Stationen fehlgeschlagen:")
        for sid, err in errors[:10]:
            print(f"   Station {sid}: {err}")
        if len(errors) > len(sids) * 0.1:
            sys.exit(f"❌ {len(errors)} Stationen (>10%) fehlgeschlagen — Abbruch, Datei wird nicht überschrieben.")

    states = []
    nat_record = {"temp": -999}
    for bl, name in BL_NAME.items():
        day = bl_day[bl]
        if not day:
            continue
        rec_date, (rec_t, rec_st, rec_lat, rec_lon) = max(day.items(), key=lambda kv: kv[1][0])
        record = {"temp": round(rec_t, 1), "date": f"{rec_date[:4]}-{rec_date[4:6]}-{rec_date[6:]}", "station": rec_st}
        if rec_lat is not None and rec_lon is not None:
            record["lat"], record["lon"] = round(rec_lat, 4), round(rec_lon, 4)
        if rec_t > nat_record["temp"]:
            nat_record = {"temp": round(rec_t, 1), "date": record["date"], "station": rec_st, "state": bl}

        stats = {}
        first_by_year = {}
        for T in THRESHOLDS:
            fy = {}
            for d in sorted(k for k, v in day.items() if v[0] >= T):
                y = d[:4]
                if y not in fy:
                    fy[y] = d
            stats_T = {}
            if fy:
                years = sorted(fy)
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
    last = max((d for day in bl_day.values() for d in day), default="")
    data_through = f"{last[:4]}-{last[4:6]}-{last[6:]}" if last else None
    out = {
        "generated": date.today().isoformat(),
        "dataThrough": data_through,
        "provisionalYear": int(last[:4]) if last else None,
        "source": SOURCE,
        "thresholds": THRESHOLDS,
        "national": nat_record,
        "states": states,
    }

    # Sanity check against existing out_file before writing
    if out_file.exists() and out_file.stat().st_size > 1000:
        try:
            old = json.loads(out_file.read_text(encoding="utf-8"))
            old_temp = old.get("national", {}).get("temp", 0)
            new_temp = nat_record.get("temp", 0)
            if new_temp < old_temp - 0.5:
                sys.exit(f"❌ Sanity check failed: Nationaler Rekord gesunken ({old_temp} °C -> {new_temp} °C)")
        except Exception as e:
            if "Sanity check" in str(e):
                raise

    out_file.write_text(json.dumps(out, separators=(",", ":"), ensure_ascii=False), encoding="utf-8")
    print(f"\n✅ Geschrieben: {out_file} ({out_file.stat().st_size / 1e6:.2f} MB)")
    print(f"Datenstand bis: {data_through}")


if __name__ == "__main__":
    main()
