# Changelog

All notable changes to acmap are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and the project adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Planned
- Overpass API fallback chain (multiple mirrors) for robustness
- Embedded sample buildings dataset (Treviso) as offline fallback
- Comparison mode (measured vs predicted, RMSE / bias / residual map)
- 3D snapshot view for export

---

## [0.3.0] — 2026-05-18

### Added
- Building height **gradient colouring** (light = low, dark = tall),
  light/dark theme aware
- **Dashed border** for buildings with estimated height (no `height`
  nor `building:levels` OSM tag)
- **Permanent height labels** at high zoom (≥17), with `*` suffix
  for estimated
- **Click-to-drawer** on any building — opens panel with used height,
  source (`height` / `levels × 3m` / default), OSM tags, link to OSM
- **Quality stats panel**: total / with-OSM-height / estimated +
  warning banner if more than 70% buildings are estimated

### Changed
- Default grid extent reduced from 500m to 300m (more urban-realistic)
- Default ground G factor changed from 1.0 (soft) to 0.5 (mixed),
  more representative of mixed urban surfaces
- Building rendering moved from flat grey to gradient with per-building
  fill colour

### Fixed
- Building label layer not cleared when toggling visibility (memory leak)
- Theme toggle didn't trigger building re-render (colour stuck on
  previous theme)

---

## [0.2.0] — 2026-05-18

### Added
- **Buildings from OpenStreetMap** via Overpass API auto-fetch on
  source placement
- **Maekawa diffraction** (ISO 9613-2 §7.4) per third-octave band
  for the first building intercepted on the source→receiver path
- Pre-loaded source spectra: flat, road traffic, rail, industrial,
  low-frequency (HVAC-style)
- Atmospheric parameters editable (T, RH)
- Ground G-factor editable

### Changed
- Predict mode now considers obstacles; previous version was
  free-field only

---

## [0.1.0] — 2026-05-17

Initial demonstrative proto.

### Added
- **Measure mode**: CSV upload (`lat, lon, leq`), Leaflet map, colored
  points, heatmap kernel density, IDW isolines
- **Predict mode**: point source placement, ISO 9613-2 propagation:
  - Geometric divergence (`A_div = 20·log₁₀(d) + 11`)
  - Atmospheric absorption (ISO 9613-1, T+RH dependent)
  - Ground effect (ISO 9613-2 §7.3.2, generic G-factor method)
  - A-weighting per band
- Third-octave-band computation (63 Hz – 8 kHz)
- DPCM 14/11/1997 acoustic class limits (Italian I–VI)
- Export: GeoJSON, CSV
- Light + dark theme via CSS variables
- Built-in validation table with literature ranges

### Notes
- Single HTML file, no build step
- Vendored libraries via CDN (later moved to local in v0.3)
- Italian + English mix in UI (proper i18n pending)

---

[Unreleased]: https://github.com/stefanofante/acmap/compare/v0.3.0...HEAD
[0.3.0]: https://github.com/stefanofante/acmap/releases/tag/v0.3.0
[0.2.0]: https://github.com/stefanofante/acmap/releases/tag/v0.2.0
[0.1.0]: https://github.com/stefanofante/acmap/releases/tag/v0.1.0
