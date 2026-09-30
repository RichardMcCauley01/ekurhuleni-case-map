# Ekurhuleni killings of women, 2026: case map (source-cited)

A static, offline-capable site with a map, timeline and case files covering the women whose bodies were found in the City of Ekurhuleni, Gauteng, from July 2026. It was compiled from public sources and is current as of **30 September 2026 (SAST)**. Police have **not** confirmed a serial killer. Every item is cited and tagged by source type: police statement / official statement / court / media report / expert opinion.

## Open it
- **Local server:** `python3 -m http.server 8766 --bind 127.0.0.1`, run in this folder, then open http://127.0.0.1:8766/
- **Offline:** open `index.html` directly (file://). All data is inlined in `js/*.js`. Background tiles come from Esri's keyless public basemaps, which also load from file:// (OpenStreetMap's tile server blocks file:// pages, so it is not the default). Without internet only the background tiles are missing.
- **URL options:**
  - `?case=<id>` focuses a case (e.g. `?case=kekana`).
  - `?mode=single|multi` opens a scenario view.
  - `?cw=0` skips the content warning.
  - `?base=dark|street|satellite` picks the background (also selectable in the map's layer panel, remembered per browser).

## What's in it
- **Map (Cases):**
  - Numbered pins at the approximate location (suburb or road level) where each body was found, in the order found.
  - Last-seen place only where one was reported.
  - Ekurhuleni boundary.
  - Fly-through (drag, wheel or arrow keys over the bottom bar or panel, or press ▶).
  - "Patterns & differences" panel.
- **Precinct layer:** SAPS murders per 100,000 residents per police precinct, FY 2025/26. This is precinct-wide context, not statistics for the exact site.
- **Scenario modes**, each marked *HYPOTHETICAL: police have NOT established this*:
  - *Single offender:* chronological legs with straight-line distance, OSRM drive and walk distance/time, and days between discoveries.
  - *More than one offender:* single-linkage clustering of the 8 task-team cases, using a straight-line threshold D (km) and a date-gap threshold T (days), both user-selectable (defaults 12 km / 30 days). The 3 arrest cases are shown as their own groups, as police treat them. Each group has a distance matrix and nearest-neighbour legs, plus a timing-window check that uses only reported times.
- **Timeline:** one lane per case plus an investigation lane. It has filters, a band showing the gaps between discoveries, and an interval chart.
- **Other pages:** Case files (summary table, cards, precinct crime table, where sources disagree), Media & Documents (links only), Sources, About & Method, and a plain Text version (also inlined in the HTML for SEO and no-JS readers).

## Build
```
python3 tools/build_data.py        # cases/events/media -> data/*.json + js/data.js
/workspace/.venv-xl/bin/python tools/build_crime.py   # SAPS xlsx + Stats SA boundaries -> data/crime.json, js/crime.js (needs openpyxl, shapely; raw files in tools/raw/, not published)
python3 tools/build_routes.py      # OSRM (routing.openstreetmap.de car/foot) -> data/routes.json, js/routes.js; rerun only if pins change
python3 tools/build_static.py      # SEO head + static text version + robots.txt from site.json
node tools/shoot.js                # screenshots/ (Playwright + Chrome)
node tools/og.js                   # og-image.png 1200x630
node tools/tiletest.js             # basemap check: file:// + http, each style, plus fallback with hosts blocked -> screenshots/basemap-*.png
```

## Data sources (details on the Sources page)
- **News and official releases:** the Presidency, SAPS/SAnews, BBC, Daily Maverick, IOL, eNCA, SABC, The South African, News24, CNN and others (32 cited items).
- **Crime statistics:** SAPS quarterly crime statistics for 2025/26 Q1–Q4 and 2026/27 Q1, per police station. The FY figure is the sum of the four quarterly releases.
- **Population and precinct boundaries:** Stats SA Census 2022 and police-district boundaries, via github.com/afrith/crime-stats.
- **Routing:** OSRM on routing.openstreetmap.de (FOSSGIS), OpenStreetMap data (ODbL). Routes are free-flow estimates between approximate pins.
- **Municipal boundary:** geoBoundaries ZAF ADM2 (CC BY 3.0 IGO).
- **Background map tiles:** Esri ArcGIS Online (server.arcgisonline.com, keyless):
  - Dark: World Dark Gray Canvas base + reference labels (default).
  - Street: World Street Map.
  - Satellite: World Imagery + Boundaries & Places labels.
  - Attribution is shown in the map corner. Esri, HERE, Garmin, Vantor, Earthstar Geographics, © OpenStreetMap contributors, and the GIS user community.
  - Automatic fallback after repeated tile errors: services.arcgisonline.com mirror → Esri street map darkened (dark only) → tile.openstreetmap.org (http/https pages only) → blank background with a note.

## Deploy (NOT run)
`bash tools/deploy_github_pages.sh [repo]` publishes to GitHub Pages (default repo `ekurhuleni-case-map`). It needs `gh auth login` first. It rebuilds the SEO head and sitemap with the Pages URL (`build_static.py --url`), and publishes only the site files: no screenshots, tools/raw or node_modules. Do not run it until the site has been reviewed.
