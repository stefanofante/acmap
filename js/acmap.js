/* =====================================================================
 * acmap.js — ST-LINE Open Lab · Acoustic Map
 *
 * Browser-based acoustic mapping tool. Runs entirely client-side.
 * This file contains the full application logic; UI markup lives in
 * index.html and CDN libraries (Leaflet, leaflet-heat, PapaParse,
 * d3-contour, html2canvas) are loaded from <script> tags.
 *
 * Top-level sections (in order):
 *   1. STRINGS              — UI string dictionary (English only)
 *   2. PHYSICS              — ISO 9613-1/-2 §7 + Maekawa diffraction
 *   3. OSM BUILDINGS        — Overpass API fetch + parsing
 *   4. SCREENSHOT           — html2canvas composite map export
 *   5. i18n APPLY           — paints static labels into the DOM
 *   6. THEME                — light/dark, persisted in localStorage
 *   7. initAcousticMap()    — map setup, Measure mode, Predict mode,
 *                             validation table, event wiring
 *   8. boot()               — DOM-ready entry point
 *
 * License: Apache-2.0 — see LICENSE file at repo root.
 * ===================================================================== */

(function () {
  'use strict';

  // =====================================================================
  // 1. STRINGS — English UI dictionary.
  //    Format tokens like %n/%r/%t are substituted via the fmt() helper.
  // =====================================================================
  var STRINGS = {
    en: {
      colsNotFound: 'Columns not found. Required: lat, lon, leq.\nFound: ',
      noData: 'No data.',
      placeSourceFirst: 'Place the source first by clicking on the map.',
      sourceTip: 'Source',
      dlBuildings: 'Downloading buildings from OpenStreetMap…',
      calcProp: 'Computing propagation…',
      calcInProgress: 'Computing…',
      bldLoaded: '%n buildings loaded around the source (%r m radius).',
      bldErr: '⚠ Building download error: %m. Calculation will proceed without obstacles.',
      bldNone: 'No buildings loaded.',
      ptsLoaded: '%n points loaded',
      estimatedShort: 'estimated',
      diffraction: 'diffraction',
      recvShadow: '%n receivers in acoustic shadow',
      diffDisabled: 'Diffraction disabled',
      recvMs: '%n receivers · %t ms',
      statusSource: 'Source Lw=%lw dB · %sp',
      statusGrid: 'Grid %e m · step %s m · %n receivers',
      statusISO: 'ISO 9613-2 · T=%T°C RH=%RH%',
      drawerH: 'Height',
      drawerSource: 'Source',
      drawerLevels: 'Levels',
      srcHeightTag: 'OSM <code>height</code> tag',
      srcLevels: '<code>building:levels</code> × 3m',
      srcDefault: 'default value (%hm)',
      qWarnHigh: '⚠ %p% of buildings have an estimated height. The Maekawa calculation here does not reflect real data but the default. For reliability, work in areas with mapped building:levels or use a verified CAD dataset.',
      qWarnMid: '%p% of buildings with estimated height. Indicative calculation.',
      inRange: '✓ in range',
      zoomHint: 'Hold Ctrl + scroll to zoom',
      sphericalHaloNote: 'Theoretical spherical spreading (A_div). Visual reference only — does not account for obstacles, terrain, or atmospheric absorption.',
      spinnerLabel: 'Propagation computation',
      screenshot: 'Screenshot',
      screenshotInProgress: 'Capturing...',
      screenshotError: 'Capture failed. Try again.',
      htmlLang: 'en',
      bcOpenLab: 'Open Lab',
      bcCurrent: 'Acoustic map',
      bcTools: 'Tools',
      themeDark: '☾ dark',
      themeLight: '☀ light',
      heroEyebrow: 'OPEN LAB · ACOUSTICS',
      heroH1Pre: 'Acoustic ',
      heroH1Em: 'map',
      heroSub: 'Demonstrative tool to visualise sound-level surveys and simulate propagation from point sources with the ISO 9613-2 method, including diffraction on real buildings (geometry from OpenStreetMap). Fully in the browser — your data never leaves this page.',
      tagMaekawa: 'Maekawa diffraction',
      tagOSM: 'OSM buildings',
      tagTransp: '★ Data transparency',
      fabHint: 'Click on the map to place the source →',
      drawerClose: 'Close',
      bldDrawerTitle: 'Building detail',
      modeMeasure: '★ Measure',
      modePredict: '⚡ Predict',
      mT1: '1 · Load measurements',
      dzStrong: 'Drop a CSV',
      dzCols: 'columns: ',
      loadSample: '↓ Load sample dataset (Treviso, 47 points)',
      mT2: '2 · Visualisation',
      lblShowPoints: 'Coloured measurement points',
      lblShowHeatmap: 'Kernel-density heatmap',
      lblShowIsolines: 'Interpolated isolines (IDW)',
      mT3: '3 · Regulatory limit',
      lblDpcm: 'DPCM 14/11/97 — Class',
      optNorm0: 'No limit',
      optNorm1: 'I · Protected areas (50/40)',
      optNorm2: 'II · Mainly residential (55/45)',
      optNorm3: 'III · Mixed (60/50)',
      optNorm4: 'IV · Intense human activity (65/55)',
      optNorm5: 'V · Mainly industrial (70/60)',
      optNorm6: 'VI · Exclusively industrial (70/70)',
      mStats: 'Statistics',
      lblStatPoints: 'Points',
      lblStatMean: 'Mean Leq',
      lblStatOver: 'Above limit',
      resultsExplainerTitle: 'What the results represent',
      resultsExplainerText: 'The statistics describe the <strong>loaded sound-level survey</strong> (CSV with lat, lon, Leq), not the propagation. <strong>POINTS</strong> is the number of survey receivers. <strong>MEAN LEQ</strong> is the <em>arithmetic mean</em> of the measured levels. <strong>MIN · MAX</strong> are the individual extremes. <strong>ABOVE LIMIT</strong> is the percentage of points exceeding the selected regulatory limit. The computed propagation (Predict mode, with optional building diffraction) is reported in the map status bar.',
      subStatPoints: 'loaded survey receivers',
      subStatMean: 'arithmetic mean of measured points',
      subStatRange: 'individual survey extremes',
      subStatOver: 'points above the regulatory limit',
      mExport: 'Export',
      btnGeojson: '↓ GeoJSON',
      btnCsvClean: '↓ Cleaned CSV',
      pSrc: 'Point source',
      pSrcDesc: 'Click on the map to place the source. Buildings around it are downloaded from OpenStreetMap.',
      lblSpectrum: 'Typical spectrum',
      optSpFlat: 'Flat broadband',
      optSpTraffic: 'Road (NMPB-Routes)',
      optSpRail: 'Railway',
      optSpIndustrial: 'Typical industrial',
      optSpLowfreq: 'Low frequency (HVAC)',
      pBld: 'Buildings (OpenStreetMap)',
      qLTotal: 'Total',
      qLReal: 'Real OSM height',
      qLEst: 'Estimated height*',
      qLMean: 'Mean · max',
      lblShowBuildings: 'Show buildings',
      lblShowBldLabels: 'Height labels (high zoom)',
      lblEnableDiff: 'Compute diffraction',
      lblDefaultH: 'Default height (m)',
      estNoteA: '* Estimated = no ',
      estNoteB: ' nor ',
      estNoteC: ' tag in OSM',
      pRecv: 'Receiver · grid',
      lblExtent: 'Extent (m)',
      lblStep: 'Step (m)',
      lblGroundG: 'Ground G',
      pAtm: 'Atmosphere',
      pViz: 'Visualisation',
      lblShowPrediction: 'Receiver grid',
      lblShowIsoBands: 'Isolines (5 dB)',
      btnRecompute: '⚡ Recompute',
      disclaimer: '<strong>Demonstrative proto.</strong> Implements ISO 9613-2 with single diffraction (Maekawa) on buildings imported from OpenStreetMap. <strong>Known limitations</strong>: diffraction only over the top of the building (not around it), a single building per source→receiver path (no multi-diffraction), building heights estimated from <code>building:levels</code> × 3m when OSM has no <code>height</code> tag, no reflections, no modelling of gaps or passages between buildings. <strong>Not a substitute for certified software</strong> for sworn statements or forensic reports.',
      ctaSmall: '★ Built in the field for Acustica Pro',
      ctaBody: 'This is the workflow Acustica Pro will bring to your practice: measurement → regulatory analysis → prediction with diffraction. Automatic forensic-grade traceability, open project format, versioned Italian regulations.',
      ctaBtn: 'Discover Acustica Pro →',
      docTitle: 'How it works',
      docH3a: 'Predict mode with diffraction',
      docPa: 'When you place a source, the tool automatically downloads the geometry of nearby buildings (radius = grid extent) from <strong>OpenStreetMap via the Overpass API</strong>. For each grid receiver it traces the source→receiver segment and looks for the first intercepted building. If one exists, it computes the diffraction attenuation with the <strong>Maekawa</strong> formula, ISO 9613-2 §7.4, per 1/3-octave band:',
      docPre: 'delta = (d_ST + d_TR) - d_SR     // path difference\nN = 2·delta/lambda               // Fresnel number\nA_dif = 10·log10(3 + 20·N)       // attenuation dB (clamp 0-25)',
      docPb: 'Where <code>T</code> is the top elevation of the intercepted building. The elevation is taken from the OSM <code>height</code> tag if present, otherwise computed as <code>building:levels × 3m</code>, falling back to the default value set in the interface.',
      docH3b: 'Computed terms',
      docTerms: '<li><code>A_div = 20·log₁₀(d) + 11</code> — geometric divergence (ISO 9613-2 §7.1)</li><li><code>A_atm = α(f, T, RH) · d</code> — atmospheric absorption (ISO 9613-1)</li><li><code>A_gr</code> — ground effect, general formula with G-factor (ISO 9613-2 §7.3.2)</li><li><code>A_dif</code> — Maekawa diffraction (ISO 9613-2 §7.4) <span style="color:var(--accent)">★ new in v0.2</span></li>',
      docH3c: 'What this proto does NOT do',
      docNot: '<li>Multi-diffraction (several buildings in cascade)</li><li>Lateral diffraction (around the building, not only over the top)</li><li>Multiple, line or area sources</li><li>Multiple reflections on façades</li><li>CNOSSOS-EU or NMPB-Routes-2008 model</li><li>Building-height accuracy check (estimated from building:levels when <code>height</code> is missing)</li>',
      docH3d: 'Validation',
      docVal: 'Source Lw=100 dB(A) flat broadband, h<sub>s</sub>=1.5m, h<sub>r</sub>=1.5m, soft ground, T=15°C, RH=70%.',
      valDistance: 'Distance',
      valComputed: 'Computed',
      valExpected: 'Expected',
      footerTag: 'Open Lab'
    }
  };

  // English-only build: no runtime language switching.
  var s = STRINGS.en;
  var T = s; // alias kept for code extracted from the shared ST-LINE bridge

  // Token substitution helper: fmt('Loaded %n points', { n: 42 }).
  var fmt = function (str, o) { var r = str; for (var k in o) r = r.split('%' + k).join(o[k]); return r; };

  // Re-render handles populated by initAcousticMap (kept for parity with
  // the original IT/EN-switching build; harmless in English-only mode).
  var H = { runValidation: null, renderMeasure: null, renderBuildings: null,
            calcProp: null, updateHaloNote: null, state: null };

  // =====================================================================
  // 2. PHYSICS — ISO 9613-1/-2 §7 + Maekawa diffraction.
  //    Inlined verbatim from the shared ST-LINE physics module.
  //    propagatePoint() with method='maekawa' is byte-identical to the
  //    original proto v0.3 reference implementation.
  // =====================================================================

  // --- constants ---
  var SPEED_OF_SOUND = 343.0;
  var FREQ_BANDS = [63, 125, 250, 500, 1000, 2000, 4000, 8000];
  var A_WEIGHTING = {
    63: -26.2, 125: -16.1, 250: -8.6, 500: -3.2,
    1000: 0.0, 2000: 1.2, 4000: 1.0, 8000: -1.1
  };

  // --- typical 1/3-octave source spectra (relative to Lw, dB) ---
  var SPECTRA = {
    flat:       { 63: -9.03, 125: -9.03, 250: -9.03, 500: -9.03, 1000: -9.03, 2000: -9.03, 4000: -9.03, 8000: -9.03 },
    traffic:    { 63: -14, 125: -10, 250: -7, 500: -6, 1000: -5, 2000: -7, 4000: -11, 8000: -16 },
    rail:       { 63: -16, 125: -13, 250: -9, 500: -6, 1000: -5, 2000: -6, 4000: -10, 8000: -15 },
    industrial: { 63: -11, 125: -10, 250: -9, 500: -8, 1000: -8, 2000: -9, 4000: -10, 8000: -13 },
    lowfreq:    { 63: -5, 125: -6, 250: -8, 500: -10, 1000: -12, 2000: -15, 4000: -19, 8000: -23 }
  };

  // ISO 9613-1 atmospheric absorption coefficient α (dB/m) at frequency f.
  function atmAttenuation(f, T_c, RH, p_kPa) {
    if (p_kPa === undefined) p_kPa = 101.325;
    var T = T_c + 273.15, T0 = 293.15;
    var pa_pr = p_kPa / 101.325;
    var psat_pr = pa_pr * Math.pow(10, -6.8346 * Math.pow(273.16 / T, 1.261) + 4.6151);
    var h = RH * psat_pr / pa_pr;
    var frO = pa_pr * (24 + 4.04e4 * h * (0.02 + h) / (0.391 + h));
    var frN = pa_pr * Math.pow(T / T0, -0.5) * (9 + 280 * h * Math.exp(-4.170 * (Math.pow(T / T0, -1 / 3) - 1)));
    return 8.686 * f * f * (
      1.84e-11 * (1 / pa_pr) * Math.sqrt(T / T0) +
      Math.pow(T / T0, -2.5) * (
        0.01275 * Math.exp(-2239.1 / T) / (frO + f * f / frO) +
        0.1068 * Math.exp(-3352.0 / T) / (frN + f * f / frN)
      )
    );
  }

  // ISO 9613-2 §7.3.2 ground effect — general (broadband) method with G-factor.
  function groundAtt(d, hs, hr, G) {
    if (d < 1) return 0;
    var hm = (hs + hr) / 2;
    var soft = 4.8 - (2 * hm / d) * (17 + 300 / d);
    return Math.max(G * soft + (1 - G) * (-3), -3);
  }

  // Maekawa (1968) single-edge diffraction attenuation, dB.
  function diffMaekawa(f, delta) {
    if (delta <= 0) return 0;
    var lam = SPEED_OF_SOUND / f;
    var N = 2 * delta / lam;
    if (N < 0) return 0;
    var v = 3 + 20 * N;
    if (v <= 1) return 0;
    return Math.max(0, Math.min(25, 10 * Math.log10(v)));
  }

  // ISO 9613-2 §7.4 screening (single edge), with meteorological correction Kmet.
  function diffISO9613(f, delta, d_ss, d_sr) {
    if (delta <= 0) return 0;
    var lam = SPEED_OF_SOUND / f;
    var C2 = 20;
    var C3 = 1;
    var Kmet = 1.0;
    if (d_ss > 0 && d_sr > 0 && delta > 0) {
      var arg = (d_ss * d_sr) / (2 * delta);
      if (arg > 0) Kmet = Math.exp(-(1 / 2000) * Math.sqrt(arg));
    }
    var v = 3 + (C2 / lam) * C3 * delta * Kmet;
    if (v <= 1) return 0;
    var Dz = 10 * Math.log10(v);
    var maxDz = (C3 === 1) ? 20 : 25;
    return Math.max(0, Math.min(maxDz, Dz));
  }

  function diffraction(method, f, delta, d_ss, d_sr) {
    if (method === 'maekawa') return diffMaekawa(f, delta);
    return diffISO9613(f, delta, d_ss, d_sr);
  }

  // Path-difference delta for a single screening edge of height hb at
  // horizontal distance d_sb from source and d_br from receiver.
  function pathDelta(d_sb, d_br, hs, hr, hb) {
    var d_sr = d_sb + d_br;
    if (d_sr < 1) return 0;
    var y_los = hs + (d_sb / d_sr) * (hr - hs);
    if (hb <= y_los) return 0;
    var d_st = Math.sqrt(d_sb * d_sb + (hb - hs) * (hb - hs));
    var d_tr = Math.sqrt(d_br * d_br + (hr - hb) * (hr - hb));
    var d_sr_dir = Math.sqrt(d_sr * d_sr + (hr - hs) * (hr - hs));
    return d_st + d_tr - d_sr_dir;
  }

  // Total propagation: divergence + atmospheric + ground + diffraction,
  // summed in energy across 1/3-octave bands with A-weighting.
  function propagatePoint(args) {
    var Lw = args.Lw, spectrum = args.spectrum, hs = args.hs, hr = args.hr,
      T_p = args.T, RH = args.RH, G = args.G;
    var dist = args.dist;
    var diffDelta = args.diffDelta !== undefined ? args.diffDelta : 0;
    var method = args.method !== undefined ? args.method : 'iso9613';
    var d_ss = args.d_ss !== undefined ? args.d_ss : 0;
    var d_sr = args.d_sr !== undefined ? args.d_sr : 0;
    if (dist < 1) dist = 1;
    var A_div = 20 * Math.log10(dist) + 11;
    var A_gr = groundAtt(dist, hs, hr, G);
    var energy = 0;
    for (var fi = 0; fi < FREQ_BANDS.length; fi++) {
      var f = FREQ_BANDS[fi];
      var Lw_f = Lw + spectrum[f];
      var A_atm = atmAttenuation(f, T_p, RH) * dist;
      var A_dif = diffraction(method, f, diffDelta, d_ss, d_sr);
      var Lp = Lw_f - A_div - A_atm - A_gr - A_dif;
      energy += Math.pow(10, (Lp + A_WEIGHTING[f]) / 10);
    }
    if (energy <= 0) return -Infinity;
    return 10 * Math.log10(energy);
  }

  // =====================================================================
  // 3. OSM BUILDINGS — Overpass API fetch + parsing.
  //    Buildings are flattened to a local (metres, source-centred) frame
  //    for fast ray-segment intersection in initAcousticMap.
  // =====================================================================

  // Lat/lng → local planar (x = east-meters, y = north-meters) about a reference point.
  function toLocal(latlng, srcLat, srcLng) {
    var dLat = (latlng[0] - srcLat) * 111111;
    var dLon = (latlng[1] - srcLng) * 111111 * Math.cos(srcLat * Math.PI / 180);
    return [dLon, dLat];
  }

  // Simple vertex-mean centroid (good enough for label placement).
  function polygonCentroid(polyLatLng) {
    var sumLat = 0, sumLng = 0;
    var n = polyLatLng.length - 1;
    for (var i = 0; i < n; i++) {
      sumLat += polyLatLng[i][0];
      sumLng += polyLatLng[i][1];
    }
    return [sumLat / n, sumLng / n];
  }

  // Parse Overpass JSON: extract `way` building footprints and resolve
  // height in priority order: tag `height` → `building:levels` × 3m → default.
  function parseOverpassBuildings(osmJson, refLat, refLng, defaultH) {
    var buildings = [];
    var elements = osmJson.elements || [];
    for (var ei = 0; ei < elements.length; ei++) {
      var el = elements[ei];
      if (!el.geometry && !el.members) continue;
      var tags = el.tags || {};
      var h = null;
      var heightSource = 'default';
      var levelsVal = null;
      if (tags.height) {
        var parsed = parseFloat(tags.height);
        if (!isNaN(parsed) && parsed > 0) {
          h = parsed;
          heightSource = 'height';
        }
      }
      if (h === null && tags['building:levels']) {
        var lv = parseFloat(tags['building:levels']);
        if (!isNaN(lv) && lv > 0) {
          h = lv * 3.0;
          levelsVal = lv;
          heightSource = 'levels';
        }
      }
      if (h === null || isNaN(h)) {
        h = defaultH;
        heightSource = 'default';
      }
      if (el.type === 'way' && el.geometry) {
        var polyLatLng = el.geometry.map(function (g) { return [g.lat, g.lon]; });
        if (polyLatLng.length > 2) {
          var first = polyLatLng[0], last = polyLatLng[polyLatLng.length - 1];
          if (first[0] !== last[0] || first[1] !== last[1]) {
            polyLatLng.push([first[0], first[1]]);
          }
        }
        var polyLocal = polyLatLng.map(function (p) { return toLocal(p, refLat, refLng); });
        var centroid = polygonCentroid(polyLatLng);
        buildings.push({
          id: el.id,
          polygon: polyLocal,
          polygonLatLng: polyLatLng,
          centroid: centroid,
          height: h,
          heightSource: heightSource,
          levelsVal: levelsVal,
          osmId: el.id,
          tags: tags
        });
      }
    }
    return buildings;
  }

  // POST a bbox query to the Overpass interpreter and resolve to parsed buildings.
  function fetchOSMBuildings(opts) {
    var center = opts.center, radius = opts.radius, refLat = opts.refLat,
      refLng = opts.refLng, defaultHeight = opts.defaultHeight;
    var dLat = radius / 111111;
    var dLng = radius / (111111 * Math.cos(center.lat * Math.PI / 180));
    var south = center.lat - dLat, north = center.lat + dLat;
    var west = center.lng - dLng, east = center.lng + dLng;
    var bbox = south + ',' + west + ',' + north + ',' + east;
    var query = '[out:json][timeout:25];\n(\n  way["building"](' + bbox + ');\n  relation["building"](' + bbox + ');\n);\nout body geom;';
    var url = 'https://overpass-api.de/api/interpreter';
    return fetch(url, {
      method: 'POST',
      body: 'data=' + encodeURIComponent(query),
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    }).then(function (resp) {
      if (!resp.ok) throw new Error('Overpass ' + resp.status);
      return resp.json();
    }).then(function (json) {
      return parseOverpassBuildings(json, refLat, refLng, defaultHeight);
    });
  }

  // =====================================================================
  // 4. SCREENSHOT — composite (map + legend + results) export.
  //    html2canvas is loaded lazily on first invocation to keep the
  //    initial page payload small.
  // =====================================================================
  var _html2canvasPromise = null;
  function loadHtml2Canvas() {
    if (window.html2canvas) return Promise.resolve(window.html2canvas);
    if (_html2canvasPromise) return _html2canvasPromise;
    _html2canvasPromise = new Promise(function (resolve, reject) {
      var sc = document.createElement('script');
      sc.src = 'https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js';
      sc.onload = function () {
        if (window.html2canvas) resolve(window.html2canvas);
        else reject(new Error('html2canvas failed to load'));
      };
      sc.onerror = function () { reject(new Error('html2canvas script error')); };
      document.head.appendChild(sc);
    });
    return _html2canvasPromise;
  }

  function captureToolScreenshot(opts) {
    var mapEl = opts.mapEl, legendEl = opts.legendEl, resultsEl = opts.resultsEl,
      filename = opts.filename;
    var mapCanvas, legendCanvas = null, resultsCanvas = null, h2c;
    return loadHtml2Canvas().then(function (lib) {
      h2c = lib;
      return h2c(mapEl, {
        useCORS: true, allowTaint: false, backgroundColor: null,
        scale: 1, logging: false
      });
    }).then(function (mc) {
      mapCanvas = mc;
      if (legendEl) {
        return h2c(legendEl, {
          useCORS: true, backgroundColor: null, scale: 1, logging: false
        });
      }
      return null;
    }).then(function (lc) {
      legendCanvas = lc;
      if (resultsEl) {
        return h2c(resultsEl, {
          useCORS: true, backgroundColor: '#1a1a1a', scale: 1, logging: false
        });
      }
      return null;
    }).then(function (rc) {
      resultsCanvas = rc;
      var padding = 16;
      var sidebarW = resultsCanvas ? Math.max(280, resultsCanvas.width + padding * 2) : 0;
      var finalW = mapCanvas.width + sidebarW;
      var finalH = mapCanvas.height + (legendCanvas ? legendCanvas.height + padding : 0);

      var finalCanvas = document.createElement('canvas');
      finalCanvas.width = finalW;
      finalCanvas.height = finalH;
      var ctx = finalCanvas.getContext('2d');

      ctx.fillStyle = '#0a0a0a';
      ctx.fillRect(0, 0, finalW, finalH);
      ctx.drawImage(mapCanvas, 0, 0);
      if (legendCanvas) {
        ctx.drawImage(legendCanvas, padding, mapCanvas.height + padding);
      }
      if (resultsCanvas) {
        ctx.drawImage(resultsCanvas, mapCanvas.width + padding, padding);
      }

      var ts = new Date().toISOString().replace('T', ' ').slice(0, 19);
      ctx.fillStyle = 'rgba(255,255,255,0.55)';
      ctx.font = '11px ui-monospace, monospace';
      ctx.textAlign = 'right';
      ctx.fillText(opts.toolLabel + ' · ' + ts + ' · stline.it', finalW - padding, finalH - 8);

      finalCanvas.toBlob(function (blob) {
        if (!blob) return;
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
      }, 'image/png', 0.95);
    });
  }

  // Leaflet control with a 📷 button that triggers captureToolScreenshot.
  function createScreenshotControl(opts) {
    var L = window.L;
    var ScreenshotControl = L.Control.extend({
      options: { position: opts.position || 'topright' },
      onAdd: function () {
        var btn = L.DomUtil.create('button', 'leaflet-control-screenshot leaflet-bar');
        btn.type = 'button';
        btn.innerHTML = '📷';
        btn.title = opts.title;
        btn.setAttribute('aria-label', opts.title);
        L.DomEvent.disableClickPropagation(btn);
        L.DomEvent.on(btn, 'click', function () {
          if (btn.classList.contains('capturing')) return;
          btn.classList.add('capturing');
          btn.title = opts.inProgressTitle;
          btn.innerHTML = '⏳';
          Promise.resolve(opts.onClick()).then(function () {
            btn.classList.remove('capturing');
            btn.title = opts.title;
            btn.innerHTML = '📷';
          }, function () {
            btn.classList.remove('capturing');
            btn.title = opts.title;
            btn.innerHTML = '📷';
          });
        });
        return btn;
      }
    });
    return new ScreenshotControl();
  }

  // =====================================================================
  // 5. i18n APPLY — paint static labels/tooltips into the DOM.
  //    Single-language build: called once on boot.
  // =====================================================================
  function setText(id, val) { var e = document.getElementById(id); if (e) e.textContent = val; }
  function setHTML(id, val) { var e = document.getElementById(id); if (e) e.innerHTML = val; }

  function applyStaticI18n() {
    document.documentElement.setAttribute('lang', s.htmlLang);
    setText('bc-openlab', s.bcOpenLab);
    setText('bc-current', s.bcCurrent);
    setText('bc2-tools', s.bcTools);
    setText('bc2-current', s.bcCurrent);
    setText('hero-eyebrow', s.heroEyebrow);
    setText('hero-h1-pre', s.heroH1Pre);
    setText('hero-h1-em', s.heroH1Em);
    setText('hero-sub', s.heroSub);
    setText('hero-tag-maekawa', s.tagMaekawa);
    setText('hero-tag-osm', s.tagOSM);
    setText('hero-tag-transp', s.tagTransp);
    setText('fab-hint', s.fabHint);
    var drClose = document.getElementById('bld-drawer-close');
    if (drClose) drClose.setAttribute('aria-label', s.drawerClose);
    setText('bld-drawer-title', s.bldDrawerTitle);
    setText('mode-measure', s.modeMeasure);
    setText('mode-predict', s.modePredict);
    setText('m-t1', s.mT1);
    setText('dz-strong', s.dzStrong);
    setText('dz-cols', s.dzCols);
    setText('load-sample-measure', s.loadSample);
    setText('m-t2', s.mT2);
    setText('lbl-show-points', s.lblShowPoints);
    setText('lbl-show-heatmap', s.lblShowHeatmap);
    setText('lbl-show-isolines', s.lblShowIsolines);
    setText('m-t3', s.mT3);
    setText('lbl-dpcm', s.lblDpcm);
    setText('opt-norm-0', s.optNorm0);
    setText('opt-norm-1', s.optNorm1);
    setText('opt-norm-2', s.optNorm2);
    setText('opt-norm-3', s.optNorm3);
    setText('opt-norm-4', s.optNorm4);
    setText('opt-norm-5', s.optNorm5);
    setText('opt-norm-6', s.optNorm6);
    setText('m-stats', s.mStats);
    setText('lbl-stat-points', s.lblStatPoints);
    setText('lbl-stat-mean', s.lblStatMean);
    setText('lbl-stat-over', s.lblStatOver);
    setText('m-results-explainer-title', s.resultsExplainerTitle);
    var _expEl = document.getElementById('m-results-explainer-text');
    if (_expEl) _expEl.innerHTML = s.resultsExplainerText;
    setText('sub-stat-points', s.subStatPoints);
    setText('sub-stat-mean', s.subStatMean);
    setText('sub-stat-range', s.subStatRange);
    setText('sub-stat-over', s.subStatOver);
    setText('m-export', s.mExport);
    setText('btn-export-geojson', s.btnGeojson);
    setText('btn-export-csv', s.btnCsvClean);
    setText('p-src', s.pSrc);
    setText('p-src-desc', s.pSrcDesc);
    setText('lbl-spectrum', s.lblSpectrum);
    setText('opt-sp-flat', s.optSpFlat);
    setText('opt-sp-traffic', s.optSpTraffic);
    setText('opt-sp-rail', s.optSpRail);
    setText('opt-sp-industrial', s.optSpIndustrial);
    setText('opt-sp-lowfreq', s.optSpLowfreq);
    setText('p-bld', s.pBld);
    setText('q-l-total', s.qLTotal);
    setText('q-l-real', s.qLReal);
    setText('q-l-est', s.qLEst);
    setText('q-l-mean', s.qLMean);
    setText('lbl-show-buildings', s.lblShowBuildings);
    setText('lbl-show-bld-labels', s.lblShowBldLabels);
    setText('lbl-enable-diff', s.lblEnableDiff);
    setText('lbl-default-h', s.lblDefaultH);
    setText('est-note-a', s.estNoteA);
    setText('est-note-b', s.estNoteB);
    setText('est-note-c', s.estNoteC);
    setText('p-recv', s.pRecv);
    setText('lbl-extent', s.lblExtent);
    setText('lbl-step', s.lblStep);
    setText('lbl-groundg', s.lblGroundG);
    setText('p-atm', s.pAtm);
    setText('p-viz', s.pViz);
    setText('lbl-show-prediction', s.lblShowPrediction);
    setText('lbl-show-iso-bands', s.lblShowIsoBands);
    setText('btn-calc', s.btnRecompute);
    setText('spinner-label', s.spinnerLabel);
    setText('halo-note-text', s.sphericalHaloNote);
    setHTML('disclaimer-body', s.disclaimer);
    setText('cta-small', s.ctaSmall);
    setText('cta-body', s.ctaBody);
    setText('cta-btn', s.ctaBtn);
    var ctaBtn = document.getElementById('cta-btn');
    if (ctaBtn) ctaBtn.href = 'https://stline.it/en/products/acustica-pro';
    setText('footer-tag', s.footerTag);

    var doc = document.getElementById('doc-body');
    if (doc) {
      doc.innerHTML =
        '<h2>' + s.docTitle + '</h2>' +
        '<h3>' + s.docH3a + '</h3>' +
        '<p>' + s.docPa + '</p>' +
        '<pre></pre>' +
        '<p>' + s.docPb + '</p>' +
        '<h3>' + s.docH3b + '</h3>' +
        '<ul>' + s.docTerms + '</ul>' +
        '<h3>' + s.docH3c + '</h3>' +
        '<ul>' + s.docNot + '</ul>' +
        '<h3>' + s.docH3d + '</h3>' +
        '<p>' + s.docVal + '</p>' +
        '<table class="val-table">' +
        '<thead><tr><th>' + s.valDistance + '</th><th>' + s.valComputed + '</th><th>' + s.valExpected + '</th><th>Δ</th></tr></thead>' +
        '<tbody>' +
        '<tr><td>10 m</td><td class="calc" id="val-10">—</td><td>65–72</td><td class="delta" id="val-10-d">—</td></tr>' +
        '<tr><td>100 m</td><td class="calc" id="val-100">—</td><td>40–48</td><td class="delta" id="val-100-d">—</td></tr>' +
        '<tr><td>500 m</td><td class="calc" id="val-500">—</td><td>20–28</td><td class="delta" id="val-500-d">—</td></tr>' +
        '</tbody></table>';
      doc.querySelector('pre').textContent = s.docPre;
    }
  }

  // =====================================================================
  // 6. THEME — html[data-theme], persisted in localStorage.
  // =====================================================================
  function isDarkTheme() {
    return document.documentElement.getAttribute('data-theme') === 'dark';
  }

  (function initTheme() {
    var saved = localStorage.getItem('stline-acmap-theme');
    if (saved === 'dark' || saved === 'light') {
      document.documentElement.setAttribute('data-theme', saved);
    } else {
      var prefersDark = window.matchMedia &&
        window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
    }
  })();

  function syncThemeToggleLabel() {
    var tt = document.getElementById('theme-toggle');
    if (tt) tt.textContent = isDarkTheme() ? s.themeLight : s.themeDark;
  }

  // =====================================================================
  // 7. initAcousticMap — the application proper.
  //    Encloses all map state and event wiring in a single scope to
  //    avoid leaking helpers (firstBuildingHit, renderMeasure, …) to
  //    the global namespace.
  // =====================================================================
  function initAcousticMap() {

    // ----- ray vs polygon intersection (used to find first building hit) -----
    function segIntersect(x1, y1, x2, y2, x3, y3, x4, y4) {
      var den = (x1-x2)*(y3-y4) - (y1-y2)*(x3-x4);
      if (Math.abs(den) < 1e-12) return null;
      var t = ((x1-x3)*(y3-y4) - (y1-y3)*(x3-x4)) / den;
      var u = -((x1-x2)*(y1-y3) - (y1-y2)*(x1-x3)) / den;
      if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
        return { t: t, x: x1 + t*(x2-x1), y: y1 + t*(y2-y1) };
      }
      return null;
    }

    // Returns the closest building intercepted by segment (x1,y1)→(x2,y2),
    // or null if none. Coordinates are in the local meters frame (source at origin).
    function firstBuildingHit(x1, y1, x2, y2, buildings, sourceX, sourceY) {
      var best = null;
      var totalLen = Math.sqrt((x2-x1)*(x2-x1) + (y2-y1)*(y2-y1));

      for (var bi = 0; bi < buildings.length; bi++) {
        var bld = buildings[bi];
        var poly = bld.polygon;
        // bbox prefilter
        var minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
        for (var pj = 0; pj < poly.length; pj++) {
          var px = poly[pj][0], py = poly[pj][1];
          if (px < minX) minX = px; if (px > maxX) maxX = px;
          if (py < minY) minY = py; if (py > maxY) maxY = py;
        }
        if (Math.min(x1,x2) > maxX || Math.max(x1,x2) < minX) continue;
        if (Math.min(y1,y2) > maxY || Math.max(y1,y2) < minY) continue;

        var firstT = Infinity;
        var firstHit = null;
        for (var i = 0; i < poly.length - 1; i++) {
          var hit = segIntersect(x1, y1, x2, y2,
            poly[i][0], poly[i][1], poly[i+1][0], poly[i+1][1]);
          if (hit && hit.t < firstT) {
            firstT = hit.t;
            firstHit = hit;
          }
        }
        if (firstHit && firstT < (best ? best.t : Infinity)) {
          var dS = Math.sqrt(firstHit.x*firstHit.x + firstHit.y*firstHit.y);
          var dR = totalLen - dS;
          best = { t: firstT, dSourceBld: dS, dBldRec: dR, height: bld.height };
        }
      }
      return best;
    }

    // ----- deterministic sample dataset (Treviso area, 47 points) -----
    function generateSampleData() {
      var data = [];
      var center = [45.66, 12.24];
      var seed = function (n) { var x = Math.sin(n) * 10000; return x - Math.floor(x); };
      for (var i = 0; i < 47; i++) {
        var dLat = (seed(i * 3.7) - 0.5) * 0.015;
        var dLon = (seed(i * 5.3) - 0.5) * 0.02;
        var dist = Math.sqrt(dLat * dLat + dLon * dLon);
        var leq = Math.max(42, 70 - dist * 1200 + (seed(i * 7.1) - 0.5) * 10);
        data.push({ lat: center[0] + dLat, lon: center[1] + dLon, leq: Math.round(leq * 10) / 10 });
      }
      return data;
    }

    // ----- map setup -----
    var map = L.map('map', { scrollWheelZoom: false }).setView([45.66, 12.24], 15);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap',
      crossOrigin: 'anonymous',
      maxZoom: 19
    }).addTo(map);

    // Wheel zoom requires Ctrl/Cmd; otherwise show a transient hint.
    (function () {
      var mapEl = document.getElementById('map');
      var hintTimer;
      mapEl.addEventListener('wheel', function (e) {
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          var delta = e.deltaY < 0 ? 1 : -1;
          var newZoom = Math.max(
            map.getMinZoom(),
            Math.min(map.getMaxZoom(), map.getZoom() + delta)
          );
          map.setZoom(newZoom);
        } else {
          var hint = mapEl.querySelector('.zoom-hint');
          if (!hint) {
            hint = document.createElement('div');
            hint.className = 'zoom-hint';
            mapEl.appendChild(hint);
          }
          hint.textContent = (s && s.zoomHint) || 'Ctrl + scroll';
          hint.classList.add('visible');
          clearTimeout(hintTimer);
          hintTimer = setTimeout(function () { hint.classList.remove('visible'); }, 1200);
        }
      }, { passive: false });
    })();

    // Screenshot control (top-right, html2canvas lazy-loaded on first click).
    createScreenshotControl({
      title: s.screenshot,
      inProgressTitle: s.screenshotInProgress,
      onClick: function () {
        return captureToolScreenshot({
          mapEl: document.getElementById('map'),
          legendEl: document.querySelector('.legend'),
          resultsEl: currentMode === 'measure'
            ? document.getElementById('acmap-results') : null,
          filename: 'acmap-' + new Date().toISOString().slice(0,19).replace(/[:T]/g,'-') + '.png',
          toolLabel: 'ST-LINE AcousticMap'
        }).catch(function (err) {
          console.error('[Screenshot]', err);
          alert(s.screenshotError);
        });
      }
    }).addTo(map);

    // Colour ramp for Leq dB(A) display.
    var colorForLevel = function (db) {
      if (db < 50) return '#10a020';
      if (db < 60) return '#c8e055';
      if (db < 70) return '#f4a836';
      return '#d8302a';
    };
    var opacityForLevel = function (db) {
      if (db < 35) return 0;
      if (db < 45) return 0.30;
      if (db < 55) return 0.50;
      return 0.65;
    };

    // ----- mode state -----
    var currentMode = 'measure';
    var measureData = [];
    var buildings = [];
    var buildingLayer = L.layerGroup();
    var sourceMarker = null;
    var predictionLayer = L.layerGroup();
    var measureLayer = L.layerGroup().addTo(map);

    var panelMeasure = document.getElementById('panel-measure');
    var panelPredict = document.getElementById('panel-predict');
    var fabHint = document.getElementById('fab-hint');

    var modeBtns = document.querySelectorAll('.mode-btn');
    for (var mb = 0; mb < modeBtns.length; mb++) {
      modeBtns[mb].addEventListener('click', function () {
        var btns = document.querySelectorAll('.mode-btn');
        for (var k = 0; k < btns.length; k++) btns[k].classList.remove('active');
        this.classList.add('active');
        currentMode = this.dataset.mode;
        if (currentMode === 'measure') {
          panelMeasure.style.display = 'grid';
          panelPredict.style.display = 'none';
          fabHint.classList.remove('active');
          document.getElementById('map').classList.remove('placing-source');
          clearPredictionLayer();
          clearBuildingLayer();
          renderMeasure();
        } else {
          panelMeasure.style.display = 'none';
          panelPredict.style.display = 'grid';
          fabHint.classList.add('active');
          document.getElementById('map').classList.add('placing-source');
          clearMeasureLayer();
        }
      });
    }

    // ===== MEASURE MODE =====
    function clearMeasureLayer() {
      if (measureLayer) map.removeLayer(measureLayer);
      measureLayer = null;
      updateHaloNote();
    }

    // Decorative concentric halo around each measurement point — visual A_div
    // reference (theoretical spherical spreading), not a propagation result.
    function addPropagationHalo(latlng) {
      var haloGroup = L.layerGroup();
      var rings = [{ r: 20, opacity: 0.18 }, { r: 35, opacity: 0.10 }, { r: 50, opacity: 0.05 }];
      for (var i = 0; i < rings.length; i++) {
        L.circle(latlng, {
          radius: rings[i].r, stroke: false, fill: true,
          fillColor: '#ff8c1a', fillOpacity: rings[i].opacity,
          interactive: false, pane: 'overlayPane'
        }).addTo(haloGroup);
      }
      return haloGroup;
    }

    function updateHaloNote() {
      var note = document.getElementById('halo-note');
      if (!note) return;
      var show = currentMode === 'measure' && measureData.length > 0;
      note.style.display = show ? 'flex' : 'none';
      if (show) {
        var txt = document.getElementById('halo-note-text');
        if (txt) txt.textContent = s.sphericalHaloNote || txt.textContent;
      }
    }

    function renderMeasure() {
      clearMeasureLayer();
      if (!measureData.length) {
        ['stat-points','stat-mean','stat-range','stat-over'].forEach(function (id) {
          document.getElementById(id).textContent = '—';
        });
        return;
      }
      measureLayer = L.layerGroup().addTo(map);

      measureData.forEach(function (p) {
        addPropagationHalo([p.lat, p.lon]).addTo(measureLayer);
      });

      var showPoints = document.getElementById('show-points').checked;
      var showHeat = document.getElementById('show-heatmap').checked;
      var showIso = document.getElementById('show-isolines').checked;

      if (showPoints) {
        measureData.forEach(function (p) {
          L.circleMarker([p.lat, p.lon], {
            radius: 7, fillColor: colorForLevel(p.leq), color: '#fff',
            weight: 1.5, fillOpacity: 0.9
          })
          .bindTooltip(p.leq.toFixed(1) + ' dBA', { direction: 'top', offset: [0, -7] })
          .addTo(measureLayer);
        });
      }
      if (showHeat) {
        var heatData = measureData.map(function (p) { return [p.lat, p.lon, Math.max(0, (p.leq - 35) / 50)]; });
        L.heatLayer(heatData, {
          radius: 35, blur: 25, maxZoom: 17,
          gradient: { 0.2: '#10a020', 0.5: '#c8e055', 0.7: '#f4a836', 1: '#d8302a' }
        }).addTo(measureLayer);
      }
      if (showIso) renderIsolinesIDW();

      updateStats();
      updateHaloNote();
      if (measureData.length) {
        map.fitBounds(L.latLngBounds(measureData.map(function (p) { return [p.lat, p.lon]; })),
          { padding: [40, 40], maxZoom: 16 });
      }
    }

    // Inverse-distance-weighted interpolation onto a coarse 30×30 grid,
    // rendered as small coloured dots. Used as a cheap isoline proxy.
    function renderIsolinesIDW() {
      if (measureData.length < 3) return;
      var lats = measureData.map(function (p) { return p.lat; });
      var lons = measureData.map(function (p) { return p.lon; });
      var latMin = Math.min.apply(null, lats), latMax = Math.max.apply(null, lats);
      var lonMin = Math.min.apply(null, lons), lonMax = Math.max.apply(null, lons);
      var pad = 0.002, N = 30;
      for (var i = 0; i < N; i++) {
        for (var j = 0; j < N; j++) {
          var lat = latMin - pad + (latMax + pad - (latMin - pad)) * i / (N - 1);
          var lon = lonMin - pad + (lonMax + pad - (lonMin - pad)) * j / (N - 1);
          var sumW = 0, sumWZ = 0, exact = null;
          for (var pk = 0; pk < measureData.length; pk++) {
            var pt = measureData[pk];
            var dLat = (lat - pt.lat) * 111111;
            var dLon = (lon - pt.lon) * 111111 * Math.cos(lat * Math.PI / 180);
            var d = Math.sqrt(dLat * dLat + dLon * dLon);
            if (d < 0.5) { exact = pt.leq; break; }
            var w = 1 / (d * d);
            sumW += w; sumWZ += w * pt.leq;
          }
          var val = exact !== null ? exact : sumWZ / sumW;
          L.circleMarker([lat, lon], {
            radius: 4, fillColor: colorForLevel(val), fillOpacity: 0.35, stroke: false
          }).addTo(measureLayer);
        }
      }
    }

    function updateStats() {
      if (!measureData.length) return;
      var leqs = measureData.map(function (p) { return p.leq; });
      document.getElementById('stat-points').textContent = leqs.length;
      document.getElementById('stat-mean').textContent =
        (leqs.reduce(function (a,b) { return a+b; }, 0)/leqs.length).toFixed(1);
      document.getElementById('stat-range').textContent =
        Math.min.apply(null, leqs).toFixed(0) + ' · ' + Math.max.apply(null, leqs).toFixed(0);
      var norm = document.getElementById('class-norm').value;
      if (norm) {
        var limit = parseFloat(norm.split(':')[1]);
        var over = leqs.filter(function (l) { return l > limit; }).length;
        document.getElementById('stat-over').textContent = Math.round(over / leqs.length * 100) + '%';
      } else {
        document.getElementById('stat-over').textContent = '—';
      }
    }

    // CSV parsing tolerant of several common column-name variants.
    function parseCSV(text) {
      var result = Papa.parse(text, {
        header: true, skipEmptyLines: true, dynamicTyping: true,
        delimitersToGuess: [',', ';', '\t']
      });
      var findCol = function (row, names) {
        var keys = Object.keys(row);
        for (var ki = 0; ki < keys.length; ki++) {
          for (var ni = 0; ni < names.length; ni++) {
            if (keys[ki].toLowerCase().trim() === names[ni]) return keys[ki];
          }
        }
        return null;
      };
      if (!result.data.length) return [];
      var r0 = result.data[0];
      var latK = findCol(r0, ['lat','latitude','latitudine']);
      var lonK = findCol(r0, ['lon','lng','longitude','longitudine']);
      var leqK = findCol(r0, ['leq','leq_dba','db','dba','level','livello']);
      if (!latK || !lonK || !leqK) {
        alert(s.colsNotFound + Object.keys(r0).join(', '));
        return [];
      }
      return result.data
        .filter(function (r) { return typeof r[latK]==='number' && typeof r[lonK]==='number' && typeof r[leqK]==='number'; })
        .map(function (r) { return { lat: r[latK], lon: r[lonK], leq: r[leqK] }; });
    }

    var dropZone = document.getElementById('drop-zone');
    var csvInput = document.getElementById('csv-input');
    dropZone.addEventListener('click', function () { csvInput.click(); });
    dropZone.addEventListener('dragover', function (e) { e.preventDefault(); dropZone.classList.add('drag-over'); });
    dropZone.addEventListener('dragleave', function () { dropZone.classList.remove('drag-over'); });
    dropZone.addEventListener('drop', function (e) {
      e.preventDefault(); dropZone.classList.remove('drag-over');
      if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
    });
    csvInput.addEventListener('change', function (e) { if (e.target.files[0]) handleFile(e.target.files[0]); });

    function handleFile(file) {
      var reader = new FileReader();
      reader.onload = function (e) {
        var data = parseCSV(e.target.result);
        if (data.length) {
          measureData = data;
          dropZone.classList.add('has-file');
          dropZone.innerHTML = '<strong>' + file.name + '</strong><br>' +
            '<span class="file-info">' + fmt(s.ptsLoaded, { n: data.length }) + '</span>' +
            '<input type="file" id="csv-input" accept=".csv,.txt" hidden>';
          document.getElementById('csv-input').addEventListener('change', function (e2) {
            if (e2.target.files[0]) handleFile(e2.target.files[0]);
          });
          renderMeasure();
        }
      };
      reader.readAsText(file);
    }

    document.getElementById('load-sample-measure').addEventListener('click', function () {
      measureData = generateSampleData();
      renderMeasure();
    });

    ['show-points', 'show-heatmap', 'show-isolines', 'class-norm'].forEach(function (id) {
      document.getElementById(id).addEventListener('change', renderMeasure);
    });

    document.getElementById('btn-export-geojson').addEventListener('click', function () {
      if (!measureData.length) { alert(s.noData); return; }
      var fc = { type: 'FeatureCollection', features: measureData.map(function (p) {
        return {
          type: 'Feature', geometry: { type: 'Point', coordinates: [p.lon, p.lat] },
          properties: { leq_dba: p.leq }
        };
      })};
      download(JSON.stringify(fc, null, 2), 'measurements.geojson', 'application/geo+json');
    });
    document.getElementById('btn-export-csv').addEventListener('click', function () {
      if (!measureData.length) { alert(s.noData); return; }
      var csv = ['lat,lon,leq'].concat(measureData.map(function (p) {
        return p.lat + ',' + p.lon + ',' + p.leq;
      })).join('\n');
      download(csv, 'measurements.csv', 'text/csv');
    });

    function download(content, fn, mime) {
      var blob = new Blob([content], { type: mime });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url; a.download = fn; a.click();
      URL.revokeObjectURL(url);
    }

    // ===== PREDICT MODE =====
    function clearPredictionLayer() {
      if (predictionLayer) { map.removeLayer(predictionLayer); predictionLayer = L.layerGroup(); }
      if (sourceMarker) { map.removeLayer(sourceMarker); sourceMarker = null; }
      document.getElementById('status-bar').classList.remove('active');
      document.getElementById('calc-status').textContent = '';
    }

    function clearBuildingLayer() {
      if (buildingLayer) { map.removeLayer(buildingLayer); buildingLayer = L.layerGroup(); }
      if (buildingLabelLayer) { map.removeLayer(buildingLabelLayer); buildingLabelLayer = L.layerGroup(); }
    }

    map.on('click', function (e) {
      if (currentMode !== 'predict') return;
      placeSource(e.latlng);
    });

    // Place the source, fetch surrounding buildings, then compute propagation.
    function placeSource(latlng) {
      if (sourceMarker) map.removeLayer(sourceMarker);
      sourceMarker = L.marker(latlng, {
        icon: L.divIcon({ className: 'source-marker', iconSize: [16, 16] })
      })
      .bindTooltip(s.sourceTip, { direction: 'top', offset: [0, -8] })
      .addTo(map);

      var extent = parseFloat(document.getElementById('grid-extent').value);
      var radius = extent / 2 + 100;
      showAcSpinner(s.dlBuildings);
      fetchOSMBuildings({
        center: { lat: latlng.lat, lng: latlng.lng },
        radius: radius,
        refLat: latlng.lat,
        refLng: latlng.lng,
        defaultHeight: parseFloat(document.getElementById('bld-default-h').value)
      }).then(function (b) {
        buildings = b;
        document.getElementById('bld-status').textContent =
          fmt(s.bldLoaded, { n: buildings.length, r: radius.toFixed(0) });
        updateBuildingStats();
        renderBuildings();
        hideAcSpinner();
        calculatePropagation(latlng);
      }, function (err) {
        buildings = [];
        document.getElementById('bld-status').textContent =
          fmt(s.bldErr, { m: err.message });
        document.getElementById('bld-quality').style.display = 'none';
        hideAcSpinner();
        calculatePropagation(latlng);
      });
    }

    // Theme-aware fill colour interpolated by height bucket.
    function fillColorForHeight(h, isDark) {
      var t;
      if (h < 6) t = 0.15;
      else if (h < 12) t = 0.40;
      else if (h < 20) t = 0.65;
      else t = 0.85;

      if (isDark) {
        var loD = [110, 110, 105], hiD = [40, 40, 42];
        var rD = Math.round(loD[0] + (hiD[0]-loD[0]) * t);
        var gD = Math.round(loD[1] + (hiD[1]-loD[1]) * t);
        var bD = Math.round(loD[2] + (hiD[2]-loD[2]) * t);
        return 'rgb(' + rD + ',' + gD + ',' + bD + ')';
      } else {
        var loL = [218, 218, 214], hiL = [94, 94, 90];
        var rL = Math.round(loL[0] + (hiL[0]-loL[0]) * t);
        var gL = Math.round(loL[1] + (hiL[1]-loL[1]) * t);
        var bL = Math.round(loL[2] + (hiL[2]-loL[2]) * t);
        return 'rgb(' + rL + ',' + gL + ',' + bL + ')';
      }
    }

    var buildingLabelLayer = L.layerGroup();

    function renderBuildings() {
      clearBuildingLayer();
      if (buildingLabelLayer) map.removeLayer(buildingLabelLayer);
      buildingLabelLayer = L.layerGroup();

      if (!document.getElementById('show-buildings').checked) return;
      buildingLayer = L.layerGroup().addTo(map);

      var isDark = isDarkTheme();
      var showLabels = document.getElementById('show-bld-labels').checked;
      var zoom = map.getZoom();

      buildings.forEach(function (b, idx) {
        if (!b.polygonLatLng) return;
        var isEstimated = b.heightSource === 'default';
        var fillColor = fillColorForHeight(b.height, isDark);
        var borderColor = isDark ? '#2a2d33' : '#5e5e5a';

        var polyOpts = {
          color: borderColor,
          weight: 1.2,
          fillColor: fillColor,
          fillOpacity: 0.65,
          opacity: 0.85
        };
        if (isEstimated) {
          // Dashed border flags height as estimated (no OSM tag).
          polyOpts.dashArray = '4,3';
          polyOpts.weight = 1.5;
        }

        var poly = L.polygon(b.polygonLatLng, polyOpts);
        poly.bindTooltip(
          'h ' + b.height.toFixed(1) + 'm' + (isEstimated ? ' (' + s.estimatedShort + ')' : '') +
          ((b.tags && b.tags.name) ? ' · ' + b.tags.name : ''),
          { direction: 'top', offset: [0, -8], sticky: true }
        );
        poly.on('click', function (e) {
          L.DomEvent.stopPropagation(e);
          showBuildingDrawer(b);
        });
        poly.addTo(buildingLayer);

        if (showLabels && zoom >= 17 && b.centroid) {
          var labelText = Math.round(b.height) + 'm';
          var labelClass = 'bld-label' + (isEstimated ? ' estimated' : '');
          L.marker(b.centroid, {
            icon: L.divIcon({
              className: labelClass,
              html: labelText,
              iconSize: [40, 14],
              iconAnchor: [20, 7]
            }),
            interactive: false
          }).addTo(buildingLabelLayer);
        }
      });

      if (showLabels) buildingLabelLayer.addTo(map);
    }

    function showBuildingDrawer(b) {
      var drawer = document.getElementById('bld-drawer');
      var body = document.getElementById('bld-drawer-body');

      var sourceLabel = {
        'height': s.srcHeightTag,
        'levels': s.srcLevels,
        'default': fmt(s.srcDefault, { hm: document.getElementById('bld-default-h').value + 'm' })
      }[b.heightSource];

      var tagsToShow = ['name', 'building', 'building:levels', 'height', 'addr:street', 'addr:housenumber'];
      var tagRows = '';
      for (var ti = 0; ti < tagsToShow.length; ti++) {
        var tk = tagsToShow[ti];
        if (b.tags && b.tags[tk]) {
          tagRows += '<div class="bld-drawer-row"><span class="k">' + tk + '</span><span class="v">' + b.tags[tk] + '</span></div>';
        }
      }

      var isEst = b.heightSource === 'default';
      body.innerHTML =
        '<div class="bld-drawer-row">' +
          '<span class="k">' + s.drawerH + '</span>' +
          '<span class="v ' + (isEst ? 'estimated' : '') + '">' + b.height.toFixed(1) + 'm' + (isEst ? ' *' : '') + '</span>' +
        '</div>' +
        '<div class="bld-drawer-row">' +
          '<span class="k">' + s.drawerSource + '</span>' +
          '<span class="v" style="font-size:11px">' + sourceLabel + '</span>' +
        '</div>' +
        (b.levelsVal ? '<div class="bld-drawer-row"><span class="k">' + s.drawerLevels + '</span><span class="v">' + b.levelsVal + '</span></div>' : '') +
        tagRows +
        '<div class="bld-drawer-row" style="margin-top:8px">' +
          '<span class="k">OSM</span>' +
          '<span class="v"><a href="https://www.openstreetmap.org/way/' + b.osmId + '" target="_blank" rel="noopener">way/' + b.osmId + ' ↗</a></span>' +
        '</div>';
      drawer.classList.add('active');
    }

    document.getElementById('bld-drawer-close').addEventListener('click', function () {
      document.getElementById('bld-drawer').classList.remove('active');
    });

    // Aggregate building-height quality: counters + a warning banner when
    // the share of estimated heights is high enough to mislead.
    function updateBuildingStats() {
      var qDiv = document.getElementById('bld-quality');
      if (!buildings.length) {
        qDiv.style.display = 'none';
        return;
      }
      qDiv.style.display = 'block';

      var total = buildings.length;
      var realHeight = buildings.filter(function (b) {
        return b.heightSource === 'height' || b.heightSource === 'levels';
      }).length;
      var estimated = total - realHeight;
      var heights = buildings.map(function (b) { return b.height; });
      var meanH = heights.reduce(function (a,b) { return a+b; }, 0) / heights.length;
      var maxH = Math.max.apply(null, heights);

      document.getElementById('q-total').textContent = total;
      document.getElementById('q-real').textContent = realHeight;
      document.getElementById('q-est').textContent = estimated;
      document.getElementById('q-mean').textContent = meanH.toFixed(1) + ' · ' + maxH.toFixed(0) + 'm';

      var banner = document.getElementById('q-warn-banner');
      var estPct = (estimated / total) * 100;
      if (estPct > 70) {
        banner.style.display = 'block';
        banner.style.background = '';
        banner.style.border = '';
        banner.style.borderLeft = '';
        banner.style.color = '';
        banner.textContent = fmt(s.qWarnHigh, { p: Math.round(estPct) });
      } else if (estPct > 40) {
        banner.style.display = 'block';
        banner.style.background = 'transparent';
        banner.style.border = 'none';
        banner.style.borderLeft = '2px solid var(--ink-2)';
        banner.style.color = 'var(--ink-2)';
        banner.textContent = fmt(s.qWarnMid, { p: Math.round(estPct) });
      } else {
        banner.style.display = 'none';
      }
    }

    function showAcSpinner(detail) {
      var sp = document.getElementById('calc-spinner');
      if (!sp) return;
      sp.classList.add('active');
      document.getElementById('spinner-detail').textContent =
        detail || s.calcInProgress || '—';
    }
    function hideAcSpinner() {
      var sp = document.getElementById('calc-spinner');
      if (sp) sp.classList.remove('active');
    }

    // Main propagation: build a regular receiver grid centred on the source,
    // compute Leq at each receiver and render points + isolines.
    function calculatePropagation(srcLatLng) {
      map.removeLayer(predictionLayer);
      predictionLayer = L.layerGroup().addTo(map);

      var Lw = parseFloat(document.getElementById('src-lw').value);
      var hs = parseFloat(document.getElementById('src-h').value);
      var hr = parseFloat(document.getElementById('rec-h').value);
      var extent = parseFloat(document.getElementById('grid-extent').value);
      var step = parseFloat(document.getElementById('grid-step').value);
      var G = parseFloat(document.getElementById('ground-G').value);
      var T_atm = parseFloat(document.getElementById('atm-T').value);
      var RH = parseFloat(document.getElementById('atm-RH').value);
      var spectrumKey = document.getElementById('src-spectrum').value;
      var spectrum = SPECTRA[spectrumKey];
      var useDiff = document.getElementById('enable-diffraction').checked && buildings.length > 0;

      var status = document.getElementById('calc-status');
      status.textContent = s.calcInProgress;
      showAcSpinner(s.calcInProgress);

      // setTimeout so the spinner has a chance to paint before the synchronous loop.
      setTimeout(function () {
        var t0 = performance.now();
        var grid = [];
        var halfExt = extent / 2;
        var metersToLat = 1 / 111111;
        var metersToLon = 1 / (111111 * Math.cos(srcLatLng.lat * Math.PI / 180));

        var nPoints = 0, nDiffracted = 0;
        for (var dy = -halfExt; dy <= halfExt; dy += step) {
          for (var dx = -halfExt; dx <= halfExt; dx += step) {
            var r = Math.sqrt(dx * dx + dy * dy);
            if (r < 2) continue;

            var diffDelta = 0;
            if (useDiff) {
              var hit = firstBuildingHit(0, 0, dx, dy, buildings);
              if (hit) {
                diffDelta = pathDelta(hit.dSourceBld, hit.dBldRec, hs, hr, hit.height);
                if (diffDelta > 0) nDiffracted++;
              }
            }

            // acmap historically uses Maekawa → explicit method='maekawa'.
            var Leq = propagatePoint({ Lw: Lw, spectrum: spectrum, dist: r, hs: hs, hr: hr, T: T_atm, RH: RH, G: G, diffDelta: diffDelta, method: 'maekawa' });
            if (Leq < 30) continue;
            grid.push({
              lat: srcLatLng.lat + dy * metersToLat,
              lon: srcLatLng.lng + dx * metersToLon,
              leq: Leq, dx: dx, dy: dy, r: r, diffracted: diffDelta > 0
            });
            nPoints++;
          }
        }

        var showPred = document.getElementById('show-prediction').checked;
        if (showPred) {
          grid.forEach(function (p) {
            L.circleMarker([p.lat, p.lon], {
              radius: step * 0.4,
              fillColor: colorForLevel(p.leq),
              fillOpacity: opacityForLevel(p.leq),
              stroke: false
            })
            .bindTooltip(
              p.leq.toFixed(1) + ' dBA @ ' + p.r.toFixed(0) + 'm' +
              (p.diffracted ? ' · ' + s.diffraction : ''),
              { direction: 'top' })
            .addTo(predictionLayer);
          });
        }

        var showIso = document.getElementById('show-iso-bands').checked;
        if (showIso) renderIsoLines(srcLatLng, grid, extent, step);

        var t1 = performance.now();
        var dt = t1 - t0;
        status.textContent = fmt(s.recvMs, { n: nPoints, t: dt.toFixed(0) });
        document.getElementById('status-bar').classList.add('active');
        document.getElementById('status-bar').innerHTML =
          '<span class="ok">●</span> ' + fmt(s.statusSource, { lw: Lw, sp: spectrumKey }) + '<br>' +
          fmt(s.statusGrid, { e: Math.round(extent), s: step, n: nPoints }) + '<br>' +
          (useDiff ? fmt(s.recvShadow, { n: nDiffracted }) : s.diffDisabled) + '<br>' +
          fmt(s.statusISO, { T: T_atm, RH: RH });
        hideAcSpinner();
      }, 20);
    }

    // 5 dB isoline bands from the regular grid via d3-contour.
    function renderIsoLines(srcLatLng, grid, extent, step) {
      var N = Math.floor(extent / step) + 1;
      var matrix = new Array(N * N).fill(-Infinity);
      var halfExt = extent / 2;
      grid.forEach(function (p) {
        var i = Math.round((p.dy + halfExt) / step);
        var j = Math.round((p.dx + halfExt) / step);
        if (i >= 0 && i < N && j >= 0 && j < N) matrix[i*N+j] = p.leq;
      });
      for (var k = 0; k < matrix.length; k++) if (matrix[k] === -Infinity) matrix[k] = 25;

      var thresholds = [40, 45, 50, 55, 60, 65, 70, 75];
      var contours = d3.contours().size([N, N]).thresholds(thresholds)(matrix);

      var metersToLat = 1 / 111111;
      var metersToLon = 1 / (111111 * Math.cos(srcLatLng.lat * Math.PI / 180));

      contours.forEach(function (contour) {
        var lvl = contour.value;
        contour.coordinates.forEach(function (polygon) {
          polygon.forEach(function (ring) {
            var latlngs = ring.map(function (pt) {
              var x = pt[0], y = pt[1];
              var dx = (x - N/2) * step, dy = (y - N/2) * step;
              return [srcLatLng.lat + dy * metersToLat, srcLatLng.lng + dx * metersToLon];
            });
            L.polyline(latlngs, {
              color: colorForLevel(lvl), weight: 1.5, opacity: 0.85
            })
            .bindTooltip(lvl + ' dBA', { permanent: false })
            .addTo(predictionLayer);
          });
        });
      });
    }

    document.getElementById('btn-calc').addEventListener('click', function () {
      if (!sourceMarker) { alert(s.placeSourceFirst); return; }
      calculatePropagation(sourceMarker.getLatLng());
    });

    // Any predict-mode input change → recompute (only if a source is placed).
    ['src-lw','src-h','rec-h','grid-extent','grid-step','ground-G',
     'atm-T','atm-RH','src-spectrum','show-prediction','show-iso-bands',
     'enable-diffraction','bld-default-h'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.addEventListener('change', function () {
        if (sourceMarker) calculatePropagation(sourceMarker.getLatLng());
      });
    });

    document.getElementById('show-buildings').addEventListener('change', renderBuildings);
    document.getElementById('show-bld-labels').addEventListener('change', renderBuildings);

    map.on('zoomend', function () {
      if (currentMode === 'predict' && buildings.length) renderBuildings();
    });

    // Re-render building polygons on theme change (light/dark fill recompute).
    new MutationObserver(function () {
      if (currentMode === 'predict' && buildings.length) {
        setTimeout(function () { renderBuildings(); }, 50);
      }
    }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

    map.on('click', function () {
      document.getElementById('bld-drawer').classList.remove('active');
    });

    // ===== VALIDATION TABLE =====
    // Compare computed Leq against literature expected range for a canonical
    // Lw=100 dB(A) flat broadband source, soft ground, standard atmosphere.
    function runValidation() {
      var expected = { 10: [65, 72], 100: [40, 48], 500: [20, 28] };
      var dists = [10, 100, 500];
      for (var di = 0; di < dists.length; di++) {
        var d = dists[di];
        var Leq = propagatePoint({ Lw: 100, spectrum: SPECTRA.flat, dist: d, hs: 1.5, hr: 1.5, T: 15, RH: 70, G: 1.0, diffDelta: 0, method: 'maekawa' });
        var cell = document.getElementById('val-' + d);
        if (cell) cell.textContent = Leq.toFixed(1) + ' dBA';
        var lo = expected[d][0], hi = expected[d][1];
        var delta;
        if (Leq < lo) delta = (Leq - lo).toFixed(1) + '';
        else if (Leq > hi) delta = '+' + (Leq - hi).toFixed(1);
        else delta = s.inRange;
        var dcell = document.getElementById('val-' + d + '-d');
        if (dcell) dcell.textContent = delta;
      }
    }

    // Expose re-render handles (kept for parity with the original build).
    H.runValidation = runValidation;
    H.renderMeasure = renderMeasure;
    H.renderBuildings = renderBuildings;
    H.calcProp = calculatePropagation;
    H.updateHaloNote = updateHaloNote;
    H.state = function () { return { currentMode: currentMode, sourceMarker: sourceMarker, buildings: buildings }; };

    // ===== INIT =====
    map.invalidateSize();
    measureData = generateSampleData();
    renderMeasure();
    runValidation();
  }

  // =====================================================================
  // 8. BOOT — DOM-ready entry point.
  // =====================================================================
  function boot() {
    var fy = document.getElementById('footer-year');
    if (fy) fy.textContent = new Date().getFullYear();

    applyStaticI18n();
    syncThemeToggleLabel();

    document.getElementById('theme-toggle').addEventListener('click', function () {
      var next = isDarkTheme() ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('stline-acmap-theme', next);
      syncThemeToggleLabel();
    });

    initAcousticMap();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
