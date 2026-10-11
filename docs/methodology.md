# Methodology, data, and validation

## Optional local API

Run `npm run api` to start the read-only Python server. In another PowerShell session, set `$env:VITE_API_URL = '/api'` and run `npm.cmd run dev`. Vite proxies `/api` to `127.0.0.1:8000`. Remove the environment variable to return to file-backed replay. Input refresh is a separate `npm run data:refresh` command; API reads do not trigger capture.

## Model methodology

1. Filter detections to 28–32.5° N and 73.5–78° E. Deduplicate identical coordinates and acquisition times. If there are over 240 detections, deterministically select evenly spaced records; disclose both counts.
2. Set the pulse-release time to the next whole UTC hour after the latest detection. **All detections are assumed to release together**, including earlier detections from the 24-hour feed. This is a demonstrator assumption, not inferred fire duration.
3. Fetch hourly 10 m wind speed (m/s) and meteorological direction from nine points spanning 26–33° N, 72–80° E, for the entire 24-hour run. Preserve actual weather model grid coordinates.
4. Convert directions **from** north into velocity: `u = -speed × sin(direction)`, `v = -speed × cos(direction)`. Interpolate vectors in time and use inverse-distance-squared spatial weights.
5. Advance eight equal-weight particles per detection every 15 minutes. Convert meters to latitude/longitude with a cosine correction; add seeded Gaussian dispersion with standard deviation `sqrt(2 × K × dt)`, `K = 350 m²/s`. Random seed: 42.
6. Use a 12-hour exponential weight decay for illustrative fading. Drop particles that leave the weather grid. Save hourly frames.
7. Report particle counts within 25 km of selected city coordinates. First proximity can be **present at start**, never a made-up transport ETA. Counts depend on particle sampling and are not a concentration or calibrated probability.

There is no plume rise, vertical mixing, terrain-resolved wind, chemistry, emission-rate estimation, calibrated deposition, or uncertainty ensemble. Near-surface winds can differ substantially from winds transporting elevated smoke. FRP is displayed as source metadata, **not converted into emissions**. Thermal anomalies alone cannot identify crop-residue burning or establish the cause of city pollution. Open-Meteo winds are numerical weather output, not station observations. Neither particle counts nor their weights are AQI, PM2.5, dose, or health guidance.

## Data and provenance

| Data | Provider | Treatment |
|---|---|---|
| Thermal anomalies | [NASA FIRMS active fire downloads](https://firms.modaps.eosdis.nasa.gov/active_fire/) | Public Suomi NPP VIIRS C2 South Asia CSV; actual confidence metadata preserved |
| Meteorology | [Open-Meteo Weather API](https://open-meteo.com/en/docs) | Hourly 10 m winds; response URL and hash saved; [CC BY 4.0 attribution](https://open-meteo.com/en/terms) |
| Older wind captures | [Historical Forecast API](https://open-meteo.com/en/docs/historical-forecast-api) | Used when the source anchor is older than the recent forecast window |
| Geographic outlines | [Natural Earth](https://www.naturalearthdata.com/about/terms-of-use/) | Public-domain 110m country outlines; approximate orientation, not authoritative boundaries |
| Ground PM2.5 | Not connected | No fabricated values; import externally verified measurements below |

`data/raw/` preserves original fire and wind responses. `public/data/capture-*.json` contains a reproducible processed run, its inputs, metadata and derived frames. `latest.json` is the default capture; `events.json` indexes saved replays. Public payloads contain only environmental data. Raw NASA regional data includes detections outside the app's filtered domain.

New capture IDs include a UUID suffix, so repeating ingestion at the same model start hour preserves separate runs and raw responses. Older IDs remain readable. The replay menu displays both model start and capture time.

## Ground observations

Obtain timestamped, quality-checked measurements from a legitimate provider such as OpenAQ or a monitoring agency. Do not use forecast PM2.5 as a ground measurement. The importer requires a CSV with these columns (no sample measurements are shipped):

```csv
station,latitude,longitude,time,pm25,unit,source_url
```

`time` must contain `Z` or an explicit UTC offset; unit must be `ug/m3` or `µg/m³`; `source_url` must identify the HTTPS source. Negative/nonfinite values and duplicate station/time records are rejected. Only measurements overlapping the run are retained.

```powershell
python -m backend.import_observations path/to/real-measurements.csv
```

Turn on **Ground observations**. Blue markers appear only within ±30 minutes of the selected frame; hover for measurement and timestamp. This provides visual timing comparison. It does **not** establish model accuracy or causal attribution. Do not announce validation until a pre-specified comparison across independent events has been performed. A later fresh capture does not automatically reuse older observations.
