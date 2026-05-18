# Acoustic propagation physics in acmap

This document derives the formulas implemented in `index.html` for
the **Predict mode**. The implementation follows ISO 9613-2:1996
*"Attenuation of sound during propagation outdoors — Part 2: General
method of calculation"* with simplifications noted below.

---

## Equation overview

For a single point source with sound power level $L_W$ (dB) emitting
into a homogeneous atmosphere, the equivalent sound level at a
receiver at distance $d$ is computed per third-octave band, then
summed energetically with A-weighting:

$$L_{eq,A}(\text{receiver}) = 10 \log_{10} \sum_{f} 10^{(L_{p,f} + W_A(f))/10}$$

where $L_{p,f}$ is the sound pressure level at the receiver in band
$f$:

$$L_{p,f} = L_{W,f} - A_{div}(d) - A_{atm}(f, T, RH) \cdot d - A_{gr}(d, h_s, h_r, G) - A_{dif}(f, \delta)$$

The four attenuation terms are:

- **$A_{div}$** — geometric divergence (point source spreading)
- **$A_{atm}$** — atmospheric absorption (air losses)
- **$A_{gr}$** — ground effect (interference with reflected path)
- **$A_{dif}$** — diffraction over a screen (Maekawa formula)

All four are detailed below.

The source spectrum $L_{W,f}$ is decomposed from the total
A-weighted power $L_W$ using a normalized spectrum shape (selectable
in the UI: flat, traffic, rail, industrial, low-frequency).

The A-weighting per band $W_A(f)$ follows IEC 61672 (dB):

| Band (Hz) | $W_A$ (dB) |
|---:|---:|
| 63   | -26.2 |
| 125  | -16.1 |
| 250  | -8.6  |
| 500  | -3.2  |
| 1000 | 0.0   |
| 2000 | +1.2  |
| 4000 | +1.0  |
| 8000 | -1.1  |

---

## 1. Geometric divergence

$$A_{div} = 20 \log_{10}(d) + 11$$

ISO 9613-2 §7.1, for a point source radiating into a hemisphere.
The constant `11` corresponds to the spreading over a hemisphere
$4\pi d^2 / 2$, equivalent to the dB definition's reference area.

For $d$ in meters, $A_{div}$ in dB.

---

## 2. Atmospheric absorption

The atmospheric attenuation coefficient $\alpha(f, T, RH)$ is
computed per band following ISO 9613-1:1993, equation (3):

$$\alpha = 8.686 f^2 \left[ 1.84 \times 10^{-11} p_r^{-1} \sqrt{T/T_0} + (T/T_0)^{-5/2} \cdot \left( 0.01275 \cdot \frac{e^{-2239.1/T}}{f_{rO} + f^2/f_{rO}} + 0.1068 \cdot \frac{e^{-3352.0/T}}{f_{rN} + f^2/f_{rN}} \right) \right]$$

where:

- $T$ = absolute temperature (K), $T = T_C + 273.15$
- $T_0 = 293.15$ K (reference, 20°C)
- $p_r$ = pressure ratio relative to 101.325 kPa
- $f_{rO}$, $f_{rN}$ = oxygen and nitrogen relaxation frequencies,
  depend on $T$, $p$, and water-vapour concentration $h$
- $h$ = molar concentration of water vapour, derived from $RH$ and
  saturation vapour pressure (Magnus formula)

Output $\alpha$ in dB/m. Attenuation over distance $d$:

$$A_{atm} = \alpha(f, T, RH) \cdot d$$

**Validation**: at 1 kHz, 15°C, 70% RH → $\alpha \approx 4.08$ dB/km
(matches tabulated values ~4–5 dB/km).

---

## 3. Ground effect

ISO 9613-2 defines two methods for ground attenuation:

- **§7.3.1** (preferred): frequency-dependent, separating zones
  near source / near receiver / middle
- **§7.3.2** (alternative): broadband, simplified

This tool implements the **alternative broadband method** §7.3.2:

$$A_{gr,soft} = 4.8 - \frac{2 h_m}{d}(17 + \frac{300}{d})$$

where $h_m = (h_s + h_r) / 2$ is the mean propagation height.

For hard ground (G = 0):

$$A_{gr,hard} = -3 \text{ dB}$$

(reinforcement from ground reflection)

For mixed ground, linear interpolation by G-factor (0 = hard,
1 = soft):

$$A_{gr} = G \cdot A_{gr,soft} + (1 - G) \cdot A_{gr,hard}$$

Clamped below at $-3$ dB.

**Note**: this is a simplification. The §7.3.1 method would yield
slightly different (and more accurate) values for buildings near
the source or receiver. For demonstrative purposes the simpler
formula is adequate.

---

## 4. Maekawa diffraction (over single screen)

When a building lies on the source→receiver line of sight, sound
must diffract over its top. The Maekawa formula (Maekawa Z.,
*Noise reduction by screens*, Applied Acoustics, 1968) — also
adopted by ISO 9613-2 §7.4 — gives:

$$A_{dif}(f) = 10 \log_{10}\left(3 + 20 N\right)$$

where $N$ is the Fresnel number:

$$N = \frac{2 \delta}{\lambda} = \frac{2 \delta f}{c}$$

with:

- $\delta$ = path difference (m): $\delta = (d_{ST} + d_{TR}) - d_{SR}$
- $\lambda$ = wavelength = $c/f$
- $c$ = speed of sound = 343 m/s

Path difference geometry (2D vertical plane):

```
          T (top of building)
         /|\
        / | \
   d_ST/  |  \d_TR
      /   |hb \
     /    |    \
    S-----+------+------R
       d_sb         d_br
              d_sr direct
```

If the direct line of sight $\overline{SR}$ passes above the top
of the building (i.e., $y_{LOS}$ at the building's x-position is
$\geq h_b$), then $\delta = 0$ — no diffraction.

If the top blocks LOS:

$$\delta = \sqrt{d_{sb}^2 + (h_b - h_s)^2} + \sqrt{d_{br}^2 + (h_r - h_b)^2} - \sqrt{(d_{sb}+d_{br})^2 + (h_r - h_s)^2}$$

Clamping: $A_{dif} \in [0, 25]$ dB (practical bounds; the formula
predicts infinite attenuation for large $N$, which is unphysical
due to side diffraction).

### What this implementation does **not** do

- **Multi-screen diffraction**. If two buildings are in line, only
  the first intercepted on the S→R path is considered. ISO 9613-2
  §7.4 provides a combination rule for multi-screen which is not
  implemented here.
- **Lateral diffraction**. Diffraction can also occur around the
  vertical edges of a building (left and right). We model only the
  top path. For tall buildings this is conservative (we
  overestimate the diffraction attenuation slightly), for very wide
  buildings it is correct, for narrow tall buildings it is
  inadequate.
- **Variable atmosphere effects on diffraction**. The Maekawa
  formula uses speed-of-sound at 343 m/s, ignoring small variations
  with $T$ and humidity that would affect very high frequencies.

---

## Source spectra

Five preloaded spectra are available. They are normalized: summing
$10^{spec_f/10}$ over all bands gives 1.0, so they redistribute the
total $L_W$ across bands without changing the total energy.

| Band (Hz) | Flat | Traffic | Rail | Industrial | Low-freq |
|---:|---:|---:|---:|---:|---:|
| 63   | -9.0 | -14 | -16 | -11 | -5  |
| 125  | -9.0 | -10 | -13 | -10 | -6  |
| 250  | -9.0 | -7  | -9  | -9  | -8  |
| 500  | -9.0 | -6  | -6  | -8  | -10 |
| 1000 | -9.0 | -5  | -5  | -8  | -12 |
| 2000 | -9.0 | -7  | -6  | -9  | -15 |
| 4000 | -9.0 | -11 | -10 | -10 | -19 |
| 8000 | -9.0 | -16 | -15 | -13 | -23 |

These shapes are **stylized**, not derived from measured spectra.
They are educationally useful but should not be used in lieu of a
real measured source spectrum for any legal or peritial analysis.

---

## Validation

The tool ships with a minimal in-app validation table. Test case:

- Source: $L_W = 100$ dB(A) broadband flat
- $h_s = h_r = 1.5$ m
- Ground: soft (G = 1)
- Atmosphere: 15°C, 70% RH, 101.325 kPa
- Distances: 10 m, 100 m, 500 m

Expected output ranges (from intuition / divulgative manuals):

| Distance | Expected $L_{eq,A}$ |
|---|---|
| 10 m  | 65–72 dB(A) |
| 100 m | 40–48 dB(A) |
| 500 m | 20–28 dB(A) |

The implementation produces values within these ranges. This is a
**minimal sanity check**, not certified validation against ISO test
cases. A full benchmark suite against standardized scenarios
(ISO 9613-2 Annex, CSTB benchmarks, or NoiseModelling test cases)
is in the roadmap.

---

## References

- **ISO 9613-1:1993** — *Acoustics — Attenuation of sound during
  propagation outdoors — Part 1: Calculation of the absorption of
  sound by the atmosphere*
- **ISO 9613-2:1996** — *Part 2: General method of calculation*
- **Maekawa, Z.** (1968) — *Noise reduction by screens*. Applied
  Acoustics, 1(3), 157–173
- **IEC 61672-1:2013** — *Electroacoustics — Sound level meters —
  Part 1: Specifications* (A-weighting definition)
- **DPCM 14/11/1997** — *Determinazione dei valori limite delle
  sorgenti sonore* (Italian acoustic class limits used in Measure
  mode comparison)
