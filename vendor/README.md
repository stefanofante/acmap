# Vendored libraries

This folder hosts third-party libraries used by `index.html`:

```
vendor/
├── leaflet/
│   ├── leaflet.css      # Leaflet 1.9.4
│   ├── leaflet.js
│   └── images/          # Marker icons used by Leaflet
├── leaflet-heat.js      # Leaflet.heat 0.2.0
├── papaparse.min.js     # PapaParse 5.4.1
└── d3-contour.min.js    # d3-contour 4.0.2
```

## Why vendored?

The tool is designed to run **offline** once downloaded, with no CDN
dependency. Vendoring guarantees:

- Reproducibility: pinned versions, no surprise breaks from upstream
- Air-gapped use: works without internet (except OpenStreetMap tiles
  and Overpass API in Predict mode)
- Privacy: no third-party CDN requests for code

## How to fetch them

The libraries are **not checked into git** (see `.gitignore`).
Download them with the helper script:

```bash
./scripts/fetch-vendor.sh
```

This pulls the pinned versions from unpkg.com and places them in
the correct subdirectories.

## Licenses

All vendored libraries use permissive licenses (BSD-2-Clause, MIT,
or ISC). See [`NOTICE`](../NOTICE) in the repository root for
attribution details.
