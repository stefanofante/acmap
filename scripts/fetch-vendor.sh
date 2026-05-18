#!/usr/bin/env bash
# Download vendored libraries to vendor/
# Required versions are pinned to ensure reproducibility.

set -e

cd "$(dirname "$0")"

LEAFLET_VERSION="1.9.4"
LEAFLET_HEAT_VERSION="0.2.0"
PAPAPARSE_VERSION="5.4.1"
D3_CONTOUR_VERSION="4.0.2"

echo "Downloading Leaflet ${LEAFLET_VERSION}..."
mkdir -p vendor/leaflet
curl -fsSL -o vendor/leaflet/leaflet.css \
  "https://unpkg.com/leaflet@${LEAFLET_VERSION}/dist/leaflet.css"
curl -fsSL -o vendor/leaflet/leaflet.js \
  "https://unpkg.com/leaflet@${LEAFLET_VERSION}/dist/leaflet.js"

# Leaflet also needs its images (markers, etc.)
mkdir -p vendor/leaflet/images
for img in marker-icon.png marker-icon-2x.png marker-shadow.png \
           layers.png layers-2x.png; do
  curl -fsSL -o "vendor/leaflet/images/${img}" \
    "https://unpkg.com/leaflet@${LEAFLET_VERSION}/dist/images/${img}"
done

echo "Downloading Leaflet.heat ${LEAFLET_HEAT_VERSION}..."
curl -fsSL -o vendor/leaflet-heat.js \
  "https://unpkg.com/leaflet.heat@${LEAFLET_HEAT_VERSION}/dist/leaflet-heat.js"

echo "Downloading PapaParse ${PAPAPARSE_VERSION}..."
curl -fsSL -o vendor/papaparse.min.js \
  "https://unpkg.com/papaparse@${PAPAPARSE_VERSION}/papaparse.min.js"

echo "Downloading d3-contour ${D3_CONTOUR_VERSION}..."
curl -fsSL -o vendor/d3-contour.min.js \
  "https://unpkg.com/d3-contour@${D3_CONTOUR_VERSION}/dist/d3-contour.min.js"

echo ""
echo "Done. All libraries are in vendor/."
echo "Total size:"
du -sh vendor/
