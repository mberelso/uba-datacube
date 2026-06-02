"""Phase 0 — Schritt 3 (optional): self-contained Vorschau-Seite bauen.

Liest die Ausgaben von process_ndvi.py und erzeugt eine einzelne HTML-Datei
(`output/preview_<region>.html`) im Look von umweltpuls.de. Pro Sommer-Jahr ein
Kartenbild; ein Jahres-Umschalter wechselt Karte UND Auswertung parallel.

Kein Server nötig — einfach per Doppelklick öffnen. Nur Vorschau/Mockup.

Lauf:  ../../.venv-sat/Scripts/python.exe generate_preview.py
"""

import base64
import json
import os
import sys
from datetime import datetime

import numpy as np

import config

sys.stdout.reconfigure(encoding="utf-8")

MONTHS_DE = ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun",
             "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"]


def load_json(name):
    with open(os.path.join(config.OUTPUT_DIR, name), encoding="utf-8") as f:
        return json.load(f)


def b64(name):
    with open(os.path.join(config.OUTPUT_DIR, name), "rb") as f:
        return base64.b64encode(f.read()).decode("ascii")


def seasonal(values):
    """Pro Kalendermonat: Mehrjahres-Mittel, Min, Max + aktuellstes Jahr."""
    by_month = {m: [] for m in range(1, 13)}
    for row in values:
        by_month[int(row["date"][5:7])].append(row["ndvi"])
    agg = lambda fn: [round(float(fn(by_month[m])), 3) if by_month[m] else None
                      for m in range(1, 13)]
    last_year = max(int(r["date"][:4]) for r in values)
    cur = [None] * 12
    for row in values:
        if int(row["date"][:4]) == last_year:
            cur[int(row["date"][5:7]) - 1] = row["ndvi"]
    return {"mean": agg(np.mean), "lo": agg(np.min), "hi": agg(np.max),
            "current": cur, "year": last_year}


def main():
    ts = load_json(f"ndvi_timeseries_{config.REGION_SLUG}_clean.json")["values"]
    periods = load_json(f"periods_{config.REGION_SLUG}.json")["periods"]
    for p in periods:
        p["img"] = b64(p["png"])

    payload = {
        "region": config.REGION_NAME,
        "timeline": ts,
        "seasonal": seasonal(ts),
        "periods": periods,
        "months": MONTHS_DE,
        "generated": datetime.now().strftime("%d.%m.%Y"),
    }
    html = HTML_TEMPLATE.replace("/*DATA*/", json.dumps(payload, ensure_ascii=False))
    out = os.path.join(config.OUTPUT_DIR, f"preview_{config.REGION_SLUG}.html")
    with open(out, "w", encoding="utf-8") as f:
        f.write(html)
    print(f"Vorschau → {out}")
    print("  Im Browser öffnen (Doppelklick).")


HTML_TEMPLATE = r"""<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Vegetationsgesundheit — Umweltpuls</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700;800&family=Geist+Mono:wght@400;500&display=swap" rel="stylesheet">
<style>
  :root{
    --navy:#1B2B3A; --forest:#4A6741; --green:#16a34a; --bg:#f9fafb;
    --ink:#0f172a; --slate:#64748b; --slate2:#94a3b8; --line:#e2e8f0;
    --line2:#f1f5f9; --warn:#d97706;
  }
  *{box-sizing:border-box}
  body{margin:0;font-family:'Geist',system-ui,sans-serif;background:var(--bg);
    color:var(--ink);-webkit-font-smoothing:antialiased}
  .nav{background:var(--navy);box-shadow:0 1px 3px rgba(0,0,0,.15);
    padding:12px 20px;display:flex;align-items:center;gap:10px}
  .nav .logo{font-weight:700;font-size:16px;color:#fff;letter-spacing:-.3px;
    display:flex;align-items:center;gap:8px}
  .nav .tag{margin-left:auto;font-size:12px;color:rgba(255,255,255,.4)}
  .wrap{max-width:1080px;margin:0 auto;padding:28px 20px 48px}
  .crumb{font-size:12.5px;color:var(--slate2);margin-bottom:6px}
  h1{font-size:27px;font-weight:700;letter-spacing:-.5px;margin:0 0 6px}
  .lede{color:var(--slate);font-size:15px;max-width:680px;margin:0}
  .scrub{display:flex;align-items:center;gap:14px;margin:22px 0 4px}
  .play{flex:none;width:42px;height:42px;border-radius:50%;border:none;
    background:var(--navy);color:#fff;font-size:16px;cursor:pointer;
    display:flex;align-items:center;justify-content:center;transition:background .15s}
  .play:hover{background:var(--forest)}
  .slidebox{flex:1}
  .slidetop{display:flex;justify-content:space-between;align-items:baseline;margin-bottom:4px}
  .curyear{font-size:22px;font-weight:700;color:var(--navy);letter-spacing:-.5px}
  .curmed{font-size:13px;color:var(--slate)}
  input[type=range]{-webkit-appearance:none;appearance:none;width:100%;height:6px;
    border-radius:6px;background:var(--line);outline:none;cursor:pointer}
  input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;appearance:none;
    width:20px;height:20px;border-radius:50%;background:var(--green);
    border:3px solid #fff;box-shadow:0 1px 4px rgba(15,23,42,.3);transition:transform .1s}
  input[type=range]::-webkit-slider-thumb:hover{transform:scale(1.15)}
  input[type=range]::-moz-range-thumb{width:20px;height:20px;border-radius:50%;
    background:var(--green);border:3px solid #fff;box-shadow:0 1px 4px rgba(15,23,42,.3)}
  .ticks{display:flex;justify-content:space-between;margin-top:6px}
  .ticks span{font-size:11.5px;color:var(--slate2);font-weight:500;transition:color .15s}
  .ticks span.on{color:var(--navy);font-weight:700}
  .hint{font-size:12.5px;color:var(--slate2);margin:8px 0 16px}
  .grid{display:grid;grid-template-columns:1.1fr .9fr;gap:18px}
  @media(max-width:840px){.grid{grid-template-columns:1fr}}
  .card{background:#fff;border:1px solid var(--line);border-radius:16px;
    padding:18px;box-shadow:0 1px 2px rgba(15,23,42,.04)}
  .card h2{font-size:12px;text-transform:uppercase;letter-spacing:.06em;
    color:var(--slate2);margin:0 0 13px;font-weight:600}
  .mapwrap{position:relative;border-radius:12px;overflow:hidden;
    background:#f1f5f9;aspect-ratio:2751/3380}
  .mapwrap img{position:absolute;inset:0;width:100%;height:100%;object-fit:contain}
  .maptag{position:absolute;left:10px;top:10px;background:rgba(27,43,58,.9);
    color:#fff;font:600 13px 'Geist';padding:5px 11px;border-radius:8px}
  .legend{display:flex;gap:8px;align-items:center;margin-top:13px;
    font-size:11px;color:var(--slate)}
  .legend .bar{height:9px;flex:1;border-radius:3px;
    background:linear-gradient(90deg,#8c6d3f,#d9ae4e,#c6d64e,#5aa83a,#165e1f)}
  .kpis{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:16px}
  .kpi{background:var(--bg);border:1px solid var(--line);border-radius:11px;padding:13px}
  .kpi .v{font-size:23px;font-weight:700;color:var(--navy)}
  .kpi .v small{font-size:14px;font-weight:600;color:var(--slate2)}
  .kpi .l{font-size:11.5px;color:var(--slate);margin-top:1px}
  .delta{font-size:13px;color:var(--slate);line-height:1.6}
  .delta b{color:var(--ink)}
  .up{color:var(--green);font-weight:600}.down{color:#dc2626;font-weight:600}
  svg{width:100%;height:auto;display:block}
  .chart-legend{display:flex;gap:15px;font-size:12px;color:var(--slate);
    margin-top:9px;flex-wrap:wrap}
  .chart-legend span{display:inline-flex;align-items:center;gap:6px}
  .dot{width:10px;height:10px;border-radius:50%}
  .full{grid-column:1/-1}
  .note{color:var(--slate);font-size:12.5px;margin-top:22px;line-height:1.65;
    border-top:1px solid var(--line);padding-top:15px}
</style>
</head>
<body>
  <div class="nav">
    <span class="logo">
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M10 1.5 18 6v8l-8 4.5L2 14V6z" stroke="rgba(255,255,255,.95)" stroke-width="1.3"/>
        <path d="M10 1.5 18 6l-8 4.5L2 6z" fill="#4A6741"/>
        <path d="M10 10.5V18.5M10 10.5 2 6M10 10.5 18 6" stroke="rgba(255,255,255,.95)" stroke-width="1.1"/>
      </svg>
      Umweltpuls
    </span>
    <span class="tag">Daten: Copernicus / Sentinel-2 · Vorschau</span>
  </div>

  <div class="wrap">
    <div class="crumb">Dashboard · Vegetationsgesundheit</div>
    <h1 id="title">🌳 Vegetationsgesundheit</h1>
    <p class="lede">Sommer-Vegetation (NDVI) aus Sentinel-2-Satellitendaten,
      wolkenbereinigt und auf die Landkreisfläche zugeschnitten. Jahr auswählen,
      um Karte und Auswertung zu vergleichen.</p>

    <div class="scrub">
      <button class="play" id="play" title="Jahre abspielen">▶</button>
      <div class="slidebox">
        <div class="slidetop">
          <span class="curyear" id="curyear"></span>
          <span class="curmed" id="curmed"></span>
        </div>
        <input type="range" id="slider" min="0" step="1">
        <div class="ticks" id="ticks"></div>
      </div>
    </div>
    <div class="hint" id="hint"></div>

    <div class="grid">
      <div class="card">
        <h2>Sommer-Komposit</h2>
        <div class="mapwrap"><img id="map" alt="NDVI-Karte"><span class="maptag" id="maptag"></span></div>
        <div class="legend"><span>gestresst</span><div class="bar"></div><span>gesund</span></div>
      </div>

      <div class="card">
        <h2 id="anyear">Auswertung</h2>
        <div class="kpis">
          <div class="kpi"><div class="v" id="k-median"></div><div class="l">Median-NDVI</div></div>
          <div class="kpi"><div class="v" id="k-veg"></div><div class="l">Vegetation &gt;0,4</div></div>
          <div class="kpi"><div class="v" id="k-gap"></div><div class="l">Wolkenlücke</div></div>
        </div>
        <div class="delta" id="delta"></div>
        <h2 style="margin-top:20px">Jahresverlauf vs. Mittel</h2>
        <svg id="seasonal" viewBox="0 0 480 250"></svg>
        <div class="chart-legend">
          <span><span class="dot" style="background:#16a34a"></span>Aktuelles Jahr</span>
          <span><span class="dot" style="background:#94a3b8"></span>Mittel</span>
          <span><span class="dot" style="background:#e2e8f0"></span>Spannweite</span>
        </div>
      </div>

      <div class="card full">
        <h2>Langzeit-Zeitreihe (monatlich) — gewähltes Jahr hervorgehoben</h2>
        <svg id="timeline" viewBox="0 0 1020 230"></svg>
      </div>
    </div>

    <div class="note" id="note"></div>
  </div>

<script>
const D = /*DATA*/;
const periods = D.periods;
let sel = periods.length - 1; // jüngstes Jahr vorausgewählt

document.getElementById('title').textContent = '🌳 Vegetationsgesundheit · ' + D.region;

// Slider + Jahres-Marken
const slider=document.getElementById('slider');
const ticksEl=document.getElementById('ticks');
slider.max=periods.length-1; slider.value=sel;
periods.forEach((p,i)=>{
  const s=document.createElement('span'); s.textContent=p.year;
  s.onclick=()=>{sel=i;slider.value=i;render();};
  ticksEl.appendChild(s);
});
slider.oninput=()=>{sel=+slider.value;render();};

// Play: automatisch durch die Jahre
let timer=null;
const playBtn=document.getElementById('play');
playBtn.onclick=()=>{
  if(timer){clearInterval(timer);timer=null;playBtn.textContent='▶';return;}
  playBtn.textContent='⏸';
  timer=setInterval(()=>{
    sel=(sel+1)%periods.length; slider.value=sel; render();
    if(sel===periods.length-1){clearInterval(timer);timer=null;playBtn.textContent='▶';}
  },1100);
};

document.getElementById('hint').textContent =
  periods.length + ' Sommer-Komposite (' + periods[0].year + '–' +
  periods[periods.length-1].year + ') · ziehen oder ▶ drücken · Stand ' + D.generated;

function fmt(v,d=2){return v==null?'—':v.toFixed(d).replace('.',',');}

function render(){
  const p=periods[sel];
  [...ticksEl.children].forEach((s,i)=>s.classList.toggle('on',i===sel));
  document.getElementById('curyear').textContent='Sommer '+p.year;
  document.getElementById('curmed').textContent='Median-NDVI '+fmt(p.median);
  document.getElementById('map').src='data:image/png;base64,'+p.img;
  document.getElementById('maptag').textContent='Sommer '+p.year;
  document.getElementById('anyear').textContent='Auswertung '+p.year;
  document.getElementById('k-median').textContent=fmt(p.median);
  document.getElementById('k-veg').innerHTML=Math.round(p.veg_pct)+'<small> %</small>';
  document.getElementById('k-gap').innerHTML=fmt(p.gap_pct,1)+'<small> %</small>';

  // Vergleich zum Mehrjahres-Mittel der übrigen Jahre
  const others=periods.filter((_,i)=>i!==sel).map(x=>x.median).filter(v=>v!=null);
  const mean=others.reduce((a,b)=>a+b,0)/others.length;
  const diff=p.median-mean, pct=(diff/mean*100);
  const cls=diff>=0?'up':'down', arr=diff>=0?'▲':'▼';
  document.getElementById('delta').innerHTML=
    'Median <b>'+fmt(p.median)+'</b> liegt <span class="'+cls+'">'+arr+' '+
    fmt(Math.abs(pct),1)+' %</span> '+(diff>=0?'über':'unter')+
    ' dem Mittel der anderen Jahre ('+fmt(mean)+').';

  drawSeasonal(p.year);
  drawTimeline(p.year);
}

function lineSegs(arr,x,y,color,w,dots){
  let out='',prev=null;
  arr.forEach((v,i)=>{
    if(v==null){prev=null;return;}
    if(prev!=null)out+=`<line x1="${x(prev)}" y1="${y(arr[prev])}" x2="${x(i)}" y2="${y(v)}" stroke="${color}" stroke-width="${w}" stroke-linecap="round"/>`;
    if(dots)out+=`<circle cx="${x(i)}" cy="${y(v)}" r="3" fill="${color}"/>`;
    prev=i;
  });
  return out;
}

function drawSeasonal(){
  const s=D.seasonal,W=480,H=250,pl=34,pr=10,pt=12,pb=26;
  const x=i=>pl+i*(W-pl-pr)/11, yMin=.2,yMax=1;
  const y=v=>pt+(yMax-v)/(yMax-yMin)*(H-pt-pb);
  let g='';
  for(let v=.2;v<=1.001;v+=.2){g+=`<line x1="${pl}" y1="${y(v)}" x2="${W-pr}" y2="${y(v)}" stroke="#f1f5f9"/>`;
    g+=`<text x="${pl-5}" y="${y(v)+3}" fill="#94a3b8" font-size="10" text-anchor="end">${v.toFixed(1).replace('.',',')}</text>`;}
  let up='',dn='';
  s.hi.forEach((h,i)=>{if(h!=null)up+=`${x(i)},${y(h)} `;});
  for(let i=11;i>=0;i--)if(s.lo[i]!=null)dn+=`${x(i)},${y(s.lo[i])} `;
  g+=`<polygon points="${up}${dn}" fill="#e2e8f0" opacity=".7"/>`;
  g+=lineSegs(s.mean,x,y,'#94a3b8',2);
  g+=lineSegs(s.current,x,y,'#16a34a',2.5,true);
  D.months.forEach((m,i)=>{g+=`<text x="${x(i)}" y="${H-7}" fill="#94a3b8" font-size="9" text-anchor="middle">${m}</text>`;});
  document.getElementById('seasonal').innerHTML=g;
}

function drawTimeline(selYear){
  const t=D.timeline,W=1020,H=230,pl=34,pr=10,pt=12,pb=30,n=t.length;
  const x=i=>pl+i*(W-pl-pr)/(n-1), yMin=.2,yMax=1;
  const y=v=>pt+(yMax-v)/(yMax-yMin)*(H-pt-pb);
  let g='';
  for(let v=.2;v<=1.001;v+=.2){g+=`<line x1="${pl}" y1="${y(v)}" x2="${W-pr}" y2="${y(v)}" stroke="#f1f5f9"/>`;
    g+=`<text x="${pl-5}" y="${y(v)+3}" fill="#94a3b8" font-size="10" text-anchor="end">${v.toFixed(1).replace('.',',')}</text>`;}
  // gewähltes Jahr hervorheben (Hintergrundband)
  const idx=t.map((r,i)=>r.date.slice(0,4)==selYear?i:-1).filter(i=>i>=0);
  if(idx.length){const x0=x(idx[0])-3,x1=x(idx[idx.length-1])+3;
    g+=`<rect x="${x0}" y="${pt}" width="${x1-x0}" height="${H-pt-pb}" fill="#16a34a" opacity=".09"/>`;}
  let pts='';t.forEach((r,i)=>pts+=`${x(i)},${y(r.ndvi)} `);
  g+=`<polyline points="${pts}" fill="none" stroke="#4A6741" stroke-width="1.8"/>`;
  let last=null;
  t.forEach((r,i)=>{const yr=r.date.slice(0,4);if(yr!==last){last=yr;
    g+=`<text x="${x(i)}" y="${H-9}" fill="#94a3b8" font-size="10" text-anchor="middle">${yr}</text>`;}});
  document.getElementById('timeline').innerHTML=g;
}

document.getElementById('note').innerHTML=
  'So <b>könnte</b> das Vegetations-Dashboard aussehen — Daten echt ('+D.region+
  '), Layout im Umweltpuls-Stil, aber nur Vorschau. Im fertigen Frontend würde die '+
  'Karte interaktiv (Leaflet), die Charts mit Recharts gerendert; der Jahres-Umschalter '+
  'bliebe erhalten. Die Wolkenlücke wird bewusst offen ausgewiesen statt kaschiert.';

render();
</script>
</body>
</html>
"""


if __name__ == "__main__":
    main()
