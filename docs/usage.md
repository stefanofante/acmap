# Using acmap

This document covers practical use of the tool — beyond what's in the
README quick start.

---

## Workflows

### Workflow A: visualize a survey

Use case: you have measured sound levels at multiple points and want
to see them on a map.

1. Open the tool, you start in **Measure mode**
2. Prepare your CSV with columns `lat, lon, leq` (see
   [`examples/treviso-sample.csv`](../examples/treviso-sample.csv)
   for format)
3. Drag the CSV onto the drop zone (or click to open file picker)
4. The tool renders points, heatmap, and statistics automatically
5. Adjust visualization toggles:
   - **Points colored**: discrete markers per measurement
   - **Heatmap**: continuous kernel density
   - **Isolines IDW**: interpolated contour lines
6. Optional: select an Italian acoustic class (DPCM 14/11/1997) to
   see the "% above limit" statistic
7. Export GeoJSON or cleaned CSV from the bottom panel

### Workflow B: predict propagation from a point source

Use case: you have an existing or planned noise source and want to
see how its noise propagates through a real urban area.

1. Switch to **Predict mode** (tab in the hero)
2. Click on the map where the source is located
3. Wait 2–5 seconds — the tool fetches OSM buildings around your
   click point automatically
4. Adjust the source parameters in the sidebar:
   - **$L_W$**: sound power level (dB(A))
   - **$h_s$**: source height (m)
   - **Spectrum**: select the closest matching shape
5. Adjust grid parameters as needed:
   - **Extent**: full square side (m)
   - **Step**: grid spacing (m); smaller = more detail but slower
6. Adjust atmospheric and ground conditions:
   - **$T$, $RH$**: atmosphere
   - **$G$**: ground type (0 = hard, 1 = soft, 0.5 = mixed)
7. Recalculation is automatic on parameter change. Or click
   **Recalculate** for a manual re-run.

### Workflow C: explore buildings

Use case: examine the OSM data underlying your propagation result.

1. After placing a source (Predict mode), buildings load
   automatically
2. Hover over any building to see its height
3. Click any building to open the **detail drawer**:
   - Height used
   - Source: `height` tag / `building:levels × 3m` / default value
   - OSM tags (name, building type, address)
   - Direct link to OSM ([openstreetmap.org/way/...](https://openstreetmap.org))
4. The **Quality stats** panel shows total / OSM-real / estimated:
   - If more than 70% are estimated, a warning banner appears —
     take the result with caution

5. Toggle **height labels** + zoom in to ≥17 to see numeric height
   labels on rooftops

---

## CSV format

### Required columns

| Role | Accepted names (case-insensitive) |
|---|---|
| Latitude | `lat`, `latitude`, `latitudine` |
| Longitude | `lon`, `lng`, `longitude`, `longitudine` |
| Sound level | `leq`, `leq_dba`, `db`, `dba`, `level`, `livello` |

### Format details

- **Separator**: comma `,`, semicolon `;`, or tab — auto-detected
- **Decimal**: period `.` (not comma — non-US locales: pre-process)
- **Header row**: required
- **Encoding**: UTF-8

### Example

```csv
lat,lon,leq
45.660,12.240,62.4
45.661,12.241,58.7
45.659,12.239,71.2
```

### Common pitfalls

- **Excel exports often use semicolon and comma as decimal separator
  in European locales.** Save as "CSV UTF-8" and verify decimals
  before loading.
- **Coordinates in DMS or DM format will fail.** Pre-convert to
  decimal degrees.
- **Mixing valid and invalid rows silently drops invalid ones.**
  No error message — check the loaded point count matches your
  expectation.

---

## Acoustic class limits (DPCM 14/11/1997)

Italian municipal zoning law assigns each area a class. Day limits
in dB(A):

| Class | Description | Day | Night |
|---|---|---|---|
| I    | Protected areas (hospitals, schools, parks) | 50 | 40 |
| II   | Prevalently residential | 55 | 45 |
| III  | Mixed | 60 | 50 |
| IV   | Intense human activity (centers, mixed) | 65 | 55 |
| V    | Prevalently industrial | 70 | 60 |
| VI   | Exclusively industrial | 70 | 70 |

The tool uses the day limit for the "% above limit" statistic.
Night limits and other refinements (differential limits, sleep
disturbance criterion at receiver façades) are not modeled.

---

## Tips

### Performance

- Grid extent 300m / step 15m × 100 buildings → ~400 receivers ×
  ~80 ray casts each = fast on any laptop (under 500 ms)
- Grid 1000m / step 5m → ~40k receivers × ~200 buildings = noticeable
  (1–2 seconds). Acceptable.
- Mobile: keep extent ≤ 300m and step ≥ 15m

### Choosing G (ground factor)

- **Hard ground** (G = 0): asphalt, concrete, water surfaces. Sound
  reflects, no absorption. Counter-intuitive but **less attenuation**.
- **Soft ground** (G = 1): grass, soil, vegetation. Sound is
  partially absorbed by porous material. **More attenuation** at
  middle distances.
- **Mixed** (G = 0.5): typical urban with some greenery
- Sound propagating low and horizontally is most affected by G.
  Over a building's roof, ground effect is negligible.

### Choosing source spectrum

| If your source is... | Use spectrum |
|---|---|
| Generic, unknown | flat |
| Urban traffic (cars + light commercial) | traffic |
| Train / tram | rail |
| Factory, machinery | industrial |
| HVAC, blowers, low-frequency hum | lowfreq |

For accurate spectra: measure your source in third-octave bands
and use a software with arbitrary spectrum input (this tool only
supports preset shapes).

---

## When to use a real tool instead

Use **CadnaA, SoundPLAN, NoiseModelling** or similar when:

- You need certified output for legal or planning purposes
- Multiple sources interact (multiple roads, mixed source types)
- Line or area sources are involved (traffic, large plant, railway
  network)
- You need reflection contributions (street canyons)
- You need CNOSSOS-EU compliance (EU strategic noise mapping)
- You need detailed meteorological conditions (gradients, climate
  scenarios)
- You need temporal aggregation (day/evening/night Lden)
- You need facade-specific receivers (building noise impact)

`acmap` is for: exploring, learning, presenting, sanity-checking,
rough early-stage planning.

---

## Bug reports

If something's broken, see [CONTRIBUTING.md](../CONTRIBUTING.md)
for bug report guidelines.
