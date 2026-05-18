# acmap

> Browser-based acoustic mapping tool — visualize sound-level surveys
> and simulate point-source propagation (ISO 9613-2) with Maekawa
> diffraction on real OpenStreetMap building geometry.

[![License: Apache 2.0](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![ISO 9613-2](https://img.shields.io/badge/Method-ISO%209613--2-informational)](https://www.iso.org/standard/20649.html)
[![Live demo](https://img.shields.io/badge/demo-stline.it%2Fopen--lab-orange)](https://stline.it/open-lab/mappa-acustica)

A single-file, dependency-light demonstrative tool that runs entirely
in the browser. No backend, no installation, no telemetry — open
`index.html` and you have a working acoustic mapping environment.

**Status**: proto v0.3. Demonstrative, not certified for legal use.
See [Limitations](#limitations) before considering anything beyond
education and exploration.

---

## What it does

### Measure mode

Load your sound-level surveys as a CSV (columns: `lat, lon, leq`).
The tool renders the points on a Leaflet map with:

- Color-coded markers per sound level (green < 50, lime < 60,
  amber < 70, red ≥ 70 dB(A))
- Kernel-density heatmap overlay
- Inverse-distance-weighting (IDW) interpolated isolines (optional)
- Aggregate statistics (mean, range, percent above legal limit)
- DPCM 14/11/1997 acoustic class limit comparison (Italian classes I–VI)

Exports: GeoJSON, cleaned CSV.

### Predict mode

Place a point source by clicking on the map. The tool:

1. Fetches building geometry from OpenStreetMap (Overpass API) in
   the surrounding area
2. Computes Leq at each receiver of a configurable grid, per
   third-octave band (63 Hz – 8 kHz), applying:
   - Geometric divergence: `A_div = 20·log₁₀(d) + 11` — ISO 9613-2 §7.1
   - Atmospheric absorption — ISO 9613-1 (T, RH dependent)
   - Ground effect — ISO 9613-2 §7.3.2, generic G-factor method
   - **Maekawa diffraction** over the first building intercepted on
     the source→receiver path — ISO 9613-2 §7.4
3. Sums band levels with A-weighting and produces a propagation map
   with `d3-contour` isolines

Source spectra preloaded: flat broadband, road traffic (NMPB-style),
rail, industrial, low-frequency (HVAC-style). Atmosphere editable
(T, RH).

### Data transparency

Buildings without OSM `height` or `building:levels` tags are flagged
visually (dashed border) and statistically (panel counter). When more
than 70% of buildings rely on the configurable default height, a
warning banner appears — the calculation reflects the default, not
reality.

Click any building to open a side drawer with:
- Used height + source (`height` tag / `building:levels × 3m` / default)
- Relevant OSM tags
- Direct link to the building's OSM page

---

## Quick start

The tool is a **single HTML file** plus a few vendored libraries.
No build step required.

### Run locally

```bash
# Clone
git clone https://github.com/stefanofante/acmap.git
cd acmap

# Serve via local HTTP (required for Overpass API to work — CORS blocks file://)
python3 -m http.server 8000
# or:    npx http-server -p 8000
# or:    Caddy: caddy file-server --listen :8000

# Open in browser
open http://localhost:8000
```

**Why a local server and not just double-click?** Modern browsers
block `fetch()` to external APIs from `file://` origins for CORS
reasons. Overpass API (used to fetch building geometry) refuses
those requests. A local HTTP server fixes this with no code change.

### Embed in your own page

Copy `index.html` (and its vendored `vendor/` folder) into your
static site. The tool is a single, self-contained component with
no global state pollution outside an IIFE.

---

## Limitations

This is a **demonstrative tool**, deliberately limited in scope to
remain understandable, fast, and honest. Limitations to be aware of
before drawing conclusions:

### Physics

- **Point source only.** No line sources (roads), no area sources
  (industrial plants), no source directivity.
- **Single diffraction.** Only the first building intercepted on the
  source→receiver path is considered. Multi-building diffraction in
  cascade (common in dense urban canyons) is not modeled — the tool
  underestimates attenuation behind rows of buildings.
- **Diffraction over only.** No lateral diffraction around building
  edges. Real diffraction has both paths; we model only the vertical.
- **No reflections.** Sound reflecting off building façades to amplify
  street-canyon levels is not modeled.
- **No meteorological profiles.** No wind gradient, no temperature
  gradient. Standard atmosphere assumed.
- **Simplified ground.** Generic broadband G-factor method (§7.3.2),
  not the more accurate frequency-dependent region method (§7.3.1).
- **No CNOSSOS-EU / NMPB-Routes-2008.** These European/French methods
  for harmonized traffic noise mapping are not implemented.

### Data

- **OSM building heights are often missing.** Even in major Italian
  cities, the `height` tag is rare. The tool falls back to
  `building:levels × 3m` if available, then to a user-configurable
  default (default 9m). Visualized accordingly (dashed borders for
  estimated). Validate before trusting numbers in any specific area.
- **No address/CAD validation.** Geometry comes as-is from OSM. For
  legal use you need surveyed CAD data, not crowdsourced footprints.
- **No version pinning of OSM data.** Each fetch hits live Overpass.
  If buildings get added/removed/edited in OSM, your result will
  change without notice.

### Validation

Built-in validation table compares output against a simple
literature test case (point source Lw=100 dB(A) broadband flat,
soft ground, standard atmosphere). **Not ISO-certified validation.**
A proper benchmark suite against standardized test cases (CSTB,
IFSTTAR, or annexed examples) is pending.

### Bottom line

**Do not use this tool for legal acoustic assessments, environmental
impact studies, building permit applications, or any decision where
inaccuracy carries consequences.** For those, use:

- A certified commercial tool: CadnaA, SoundPLAN, Predictor-LimA
- A maintained open-source tool with full CNOSSOS-EU support:
  [NoiseModelling](https://noise-planet.org/noisemodelling.html)
  (Java/H2GIS)
- A registered "Tecnico Competente in Acustica" (Italy: ENTECA) for
  legal compliance work

---

## Architecture

```
acmap/
├── index.html              # Self-contained tool (HTML + CSS + JS)
├── vendor/                 # Bundled third-party libraries
│   ├── leaflet/
│   │   ├── leaflet.css
│   │   └── leaflet.js
│   ├── leaflet-heat.js
│   ├── papaparse.min.js
│   └── d3-contour.min.js
├── examples/
│   ├── treviso-sample.csv  # Synthetic sample dataset (47 points)
│   └── README.md
├── docs/
│   ├── physics.md          # ISO 9613-2 + Maekawa derivation
│   ├── api.md              # JS function reference
│   └── screenshots/
├── LICENSE                 # Apache-2.0
├── NOTICE                  # Third-party attributions
├── CHANGELOG.md
├── CONTRIBUTING.md
└── README.md
```

All physics is in `index.html` inside a single IIFE. The intent is
**maximum portability**: drop the folder anywhere, open via local
server, it runs.

When the codebase grows beyond this file (e.g., a Confronto mode or
multi-source), the physics code will be extracted into a separate
ES module under `src/physics/` and the tool refactored to import it.

---

## Roadmap

| Version | Status | Features |
|---|---|---|
| v0.1 | shipped | Static wireframe, no real physics |
| v0.2 | shipped | Real ISO 9613-2, atmospheric absorption, ground |
| v0.3 | **current** | OSM buildings, Maekawa diffraction, data transparency |
| v0.4 | planned | Robustness: Overpass fallback, embedded fallback dataset |
| v0.5 | planned | Comparison mode (measured vs predicted, RMSE/bias) |
| v0.6 | planned | 3D snapshot view for export/screenshots |

The roadmap is opportunistic, not commitments. Maintained as a hobby
project parallel to commercial work on
[Acustica Pro](https://stline.it).

---

## Contributing

Contributions are welcome. Read [CONTRIBUTING.md](CONTRIBUTING.md)
for guidelines. By submitting a contribution, you agree it is
licensed under Apache-2.0.

Areas where help is particularly welcome:

- **Validation** against documented test cases (ISO 9613-2 Annex,
  CSTB benchmarks, real measurement campaigns)
- **Performance** on mobile / low-end devices
- **Internationalization** — currently the UI mixes Italian and
  English; clean i18n would help
- **Multi-diffraction** (ISO 9613-2 §7.4 multi-screen formula)
- **Building height** improvement: OSM tag mining, alternative
  height datasets (3D Building Model from public sources)

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
  — companion tool for noise-barrier attenuation calculation,
  sharing the same physics engine
- [stline.it/open-lab](https://stline.it/open-lab) — full list of
  ST-LINE Open Lab projects (firmware, embedded, tooling, demos)

---

## License

Licensed under the Apache License, Version 2.0. See [LICENSE](LICENSE)
for details, [NOTICE](NOTICE) for third-party attributions.
