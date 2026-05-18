# Example datasets

This folder hosts sample CSV files for the **Measure mode** of acmap.

## `treviso-sample.csv`

47 synthetic sound-level measurement points centered on Treviso
(Italy). Generated procedurally with deterministic noise to simulate
a typical environmental survey.

**Format** (all three columns required):

```
lat,lon,leq
45.660,12.240,62.4
45.661,12.241,58.7
...
```

- `lat`, `lon`: WGS84 decimal degrees
- `leq`: equivalent continuous A-weighted sound level (dB(A))

**Note**: this is not real measurement data. It's procedurally
generated to demonstrate the tool. Distance from city center
produces lower levels with random noise; nothing in the dataset
should be interpreted as a real acoustic observation.

## CSV format details

The parser auto-detects column names case-insensitively. Accepted
synonyms:

| Required role | Acceptable column names |
|---|---|
| Latitude | `lat`, `latitude`, `latitudine` |
| Longitude | `lon`, `lng`, `longitude`, `longitudine` |
| Sound level | `leq`, `leq_dba`, `db`, `dba`, `level`, `livello` |

Separator can be comma `,`, semicolon `;`, or tab. PapaParse handles
detection automatically.

Header row is **required** in the current version (no header → no
parsing).

Rows where any required value is missing or non-numeric are silently
skipped.

## Where to get real data

For real surveys you can use:

- Your own SLM (sound-level meter) exports — most professional meters
  export CSV directly
- Public open-data portals — many Italian municipalities publish
  acoustic mapping points (search ARPA + your region)
- The European Environment Agency
  ([END Directive 2002/49/EC reporting](https://www.eea.europa.eu))
  — large-scale strategic noise maps from cities and major
  infrastructure operators

## Contributing your own dataset

If you have a real, anonymized survey dataset that demonstrates the
tool well and you're willing to share it under the project's
Apache-2.0 license, open a PR. Useful additions: industrial sites,
road networks, ferries/railways, cultural sites with quiet limits.
