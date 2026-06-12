"""Phase 3a — Schritt 3: Bildpaar prüfen.

Erzeugt ein Side-by-Side (2x hochskaliert) mit markierten MaStR-Anlagenpositionen
auf dem Nachher-Bild, um zu beurteilen, ob die Bauspuren sichtbar sind.
"""

import json
import math
import os
import sys

from PIL import Image, ImageDraw, ImageFont

sys.stdout.reconfigure(encoding="utf-8")

HERE = os.path.dirname(__file__)
OUT = os.path.join(HERE, "output")
UNITS_PATH = os.path.join(HERE, "..", "..", "public", "wind_units.json")

PARK_SLUG = "bad-schmiedeberg"
CENTER_LAT, CENTER_LON = 51.8334, 12.8746
HALF_KM = 2.6
YEARS = (2023, 2024, 2025)
SCALE = 2

dlat = HALF_KM / 111.32
dlon = HALF_KM / (111.32 * math.cos(math.radians(CENTER_LAT)))
WEST, EAST = CENTER_LON - dlon, CENTER_LON + dlon
SOUTH, NORTH = CENTER_LAT - dlat, CENTER_LAT + dlat

with open(UNITS_PATH, encoding="utf-8") as f:
    u = json.load(f)["units"]
turbines = [
    (u["lon"][i], u["lat"][i])
    for i in range(len(u["lat"]))
    if WEST <= u["lon"][i] <= EAST and SOUTH <= u["lat"][i] <= NORTH
    and u["status"][i] == 0 and u["year"][i] >= 2024
]
print(f"{len(turbines)} Anlagen (>= 2024) im Ausschnitt")

imgs = []
for year in YEARS:
    img = Image.open(os.path.join(OUT, f"park_{PARK_SLUG}_{year}.png")).convert("RGB")
    img = img.resize((img.width * SCALE, img.height * SCALE), Image.LANCZOS)
    d = ImageDraw.Draw(img)
    if year != YEARS[0]:
        for lon, lat in turbines:
            x = (lon - WEST) / (EAST - WEST) * img.width
            y = (NORTH - lat) / (NORTH - SOUTH) * img.height
            r = 14
            d.ellipse([x - r, y - r, x + r, y + r], outline=(255, 80, 0), width=3)
    d.text((10, 8), str(year), fill=(255, 255, 255), stroke_width=2, stroke_fill=(0, 0, 0),
           font=ImageFont.load_default(28))
    imgs.append(img)

gap = 8
combo = Image.new("RGB", ((imgs[0].width + gap) * len(imgs) - gap, imgs[0].height), (255, 255, 255))
for i, img in enumerate(imgs):
    combo.paste(img, (i * (imgs[0].width + gap), 0))
combo_path = os.path.join(OUT, f"park_{PARK_SLUG}_compare.png")
combo.save(combo_path)
print(f"-> {combo_path} {combo.size}")
