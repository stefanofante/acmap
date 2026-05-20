# acmap

> Browser-based acoustic mapping tool — visualize sound-level surveys
> and simulate point-source propagation (ISO 9613-2) with Maekawa
> diffraction on real OpenStreetMap building geometry.
>
> Strumento browser di mappatura acustica — visualizza rilievi
> fonometrici e simula la propagazione da sorgente puntuale (ISO
> 9613-2) con diffrazione Maekawa su edifici reali OpenStreetMap.

[![Status](https://img.shields.io/badge/status-v0.5--working-orange.svg)](#roadmap)
[![License: Apache 2.0](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![ISO 9613-2](https://img.shields.io/badge/Method-ISO%209613--2-informational)](https://www.iso.org/standard/20649.html)
[![Live demo](https://img.shields.io/badge/demo-stline.it%2Fopen--lab-orange)](https://stline.it/open-lab/mappa-acustica)

A single-file, dependency-light demonstrative tool that runs entirely
in the browser. No backend, no installation, no telemetry — open
`index.html` and you have a working acoustic mapping environment.

**Status**: working proto v0.5. Demonstrative, not certified for legal
use. See [Limitations](#limitations) before considering anything beyond
education and exploration.

---

## Features

- ✅ **Measure mode** — load a CSV survey (`lat, lon, leq`):
  color-coded markers, kernel-density heatmap, optional IDW
  interpolated isolines, aggregate statistics, DPCM 14/11/1997
  acoustic class limits (Italian classes I–VI), and a **spherical
  propagation halo** on every measure point (visual `A_div`
  reference) with an on-map halo legend note
- ✅ **Predict mode** — place a point source, ISO 9613-2 propagation
  per third-octave band (63 Hz – 8 kHz) with **Maekawa diffraction**
  over the first OpenStreetMap building intercepted on the
  source→receiver path; OSM building geometry auto-fetched via the
  Overpass API
- ✅ **Building data transparency** — estimated-height buildings
  flagged (dashed border + counter); >70% estimated triggers a
  warning banner; click any building for a drawer with used height,
  height source (`height` tag / `building:levels × 3m` / default),
  OSM tags and a link to the building's OSM page; permanent height
  labels at high zoom
- ✅ **IT / EN UI toggle** — full runtime language switch (complete
  string dictionary; labels, tooltips, alerts, validation table,
  drawer, docs and disclaimer all re-render)
- ✅ **Unified loading popup** — one consistent overlay for CSV /
  Overpass / propagation operations
- ✅ **Screenshot PNG export** — composite map + legend + results,
  `html2canvas` lazy-loaded on first use
- ✅ **Exports** — GeoJSON and cleaned CSV (measure mode)
- ✅ **Light + dark theme** — `html[data-theme]`, persisted, with
  theme-aware re-render of buildings / halo / heatmap
- ✅ **Fully client-side** — your data never leaves the page

---

## Quick start

Open `index.html` in a modern browser. **No build, no server.**

```bash
git clone https://github.com/stefanofante/acmap.git
cd acmap
# then just open index.html — or serve it:
python3 -m http.server 8000   # http://localhost:8000
```

First load needs an internet connection: the CDN libraries
(Leaflet, leaflet-heat, PapaParse, d3-contour, html2canvas), the
OpenStreetMap tiles, and the Overpass API are all fetched online.

**Caveat:** some browsers block `fetch()` from `file://` origins.
The Overpass building download (Predict mode) may therefore require
serving `index.html` from a local HTTP server rather than opening it
by double-click. Measure mode works from `file://`.

---

## Limitations

This is a **demonstrative tool**, deliberately limited in scope to
remain understandable, fast, and honest. Be aware of these limits
before drawing conclusions.

### Physics

- **Point source only.** No line sources (roads), no area sources,
  no source directivity.
- **Single diffraction.** Only the first building intercepted on the
  source→receiver path is considered. Multi-building diffraction in
  cascade (common in dense urban canyons) is not modeled — the tool
  underestimates attenuation behind rows of buildings.
- **Diffraction over only.** No lateral diffraction around building
  edges; only the vertical (over-the-top) path is modeled.
- **No reflections.** Sound reflecting off façades to amplify
  street-canyon levels is not modeled.
- **No meteorological profiles.** No wind/temperature gradient;
  standard atmosphere assumed.
- **Simplified ground.** Generic broadband G-factor method (§7.3.2),
  not the frequency-dependent region method (§7.3.1).
- **No CNOSSOS-EU / NMPB-Routes-2008.**

### Data

- **OSM building heights are often missing.** Even in major Italian
  cities the `height` tag is rare. The tool falls back to
  `building:levels × 3m`, then to a user-configurable default
  (9m). Estimated heights are shown with dashed borders. Validate
  before trusting numbers for a specific area.
- **No address/CAD validation.** Geometry is OSM as-is. Legal use
  needs surveyed CAD data, not crowdsourced footprints.
- **No version pinning of OSM data.** Each fetch hits live Overpass;
  results change as OSM changes.

### Validation

The built-in validation table compares output against a simple
literature test case (point source Lw=100 dB(A) flat broadband,
soft ground, standard atmosphere). **Not ISO-certified validation.**

### Bottom line

**Do not use this tool for legal acoustic assessments, environmental
impact studies, building-permit applications, or any decision where
inaccuracy carries consequences.** For those use a certified tool
(CadnaA, SoundPLAN, Predictor-LimA), a maintained open-source tool
with full CNOSSOS-EU support
([NoiseModelling](https://noise-planet.org/noisemodelling.html)),
or a registered "Tecnico Competente in Acustica" (Italy: ENTECA).

---

## Tech stack

- [Leaflet](https://leafletjs.com/) 1.9.4 — map rendering
- [leaflet-heat](https://github.com/Leaflet/Leaflet.heat) 0.2.0 —
  kernel-density heatmap
- [PapaParse](https://www.papaparse.com/) 5.4.1 — CSV parsing
- [d3-contour](https://github.com/d3/d3-contour) 4.0.2 —
  propagation isolines
- [html2canvas](https://html2canvas.hertzen.com/) 1.4.1 — composite
  screenshot (lazy-loaded on first use)
- [OpenStreetMap](https://www.openstreetmap.org/) tiles +
  [Overpass API](https://overpass-api.de/) — building geometry
- Vanilla JavaScript (ES2020+), single HTML file, no build step
- Acoustic model: **ISO 9613-2:1996** (§7.1 divergence, §7.3.2
  ground, §7.4 screening) + ISO 9613-1 atmospheric absorption +
  **Maekawa (1968)** diffraction

The physics, OSM-fetch and screenshot code is extracted verbatim
from the shared ST-LINE site modules; the standalone tool is a
single self-contained file that drops anywhere and runs.

---

## Roadmap

| Version | Status | Features |
|---|---|---|
| v0.1 | shipped | Static wireframe, no real physics |
| v0.2 | shipped | Real ISO 9613-2, atmospheric absorption, ground |
| v0.3 | shipped | OSM buildings, Maekawa diffraction, data transparency |
| v0.4 | shipped | EN i18n toggle, spherical halo, screenshot export, unified loading popup, fluid layout |
| v0.5 | **current** | Results explainer + per-stat sublabels (measure-mode survey clarity), OSM building tooltip offset |
| v0.6 | planned | Robustness: Overpass mirror fallback, embedded offline dataset |
| v0.7 | planned | Comparison mode (measured vs predicted, RMSE/bias) |

The roadmap is opportunistic, not a set of commitments. Maintained
as a hobby project parallel to commercial work on
[Acustica Pro](https://stline.it/prodotti/acustica-pro).

---

## Contributing

Contributions are welcome. Read [CONTRIBUTING.md](CONTRIBUTING.md).
By submitting a contribution you agree it is licensed under
Apache-2.0. Help is particularly welcome on validation against
documented test cases, mobile performance, and multi-diffraction.

---

## Author and affiliation

Maintained by [Stefano Fante](https://github.com/stefanofante),
founder of [ST-LINE S.r.l.](https://stline.it) (Treviso, Italy).
ST-LINE is an electronic-design firm with a complementary practice
in environmental acoustics; this tool is part of its
[Open Lab](https://stline.it/open-lab) initiative — open-source
artifacts the firm uses internally, published in public.

This tool is part of the development road toward
[Acustica Pro](https://stline.it/prodotti/acustica-pro), ST-LINE's
upcoming professional software for environmental acoustics analysis.

---

## See also

- [`noise-barrier-calc`](https://github.com/stefanofante/noise-barrier-calc)
  — companion tool for noise-barrier attenuation, sharing the same
  physics engine
- [stline.it/open-lab](https://stline.it/open-lab) — full list of
  ST-LINE Open Lab projects

---

## License

Licensed under the Apache License, Version 2.0. See [LICENSE](LICENSE)
for details, [NOTICE](NOTICE) for third-party attributions.
