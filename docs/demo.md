# BreatheAhead: 2 minute 45 second demo script

Use the bundled real capture to avoid depending on public APIs during recording. Keep the capture timestamp and modeled-data label visible. Record at 1440×900 or 1920×1080. Do not imply the capture proves a historical smoke episode.

| Time | Action | Voiceover |
|---|---|---|
| 0:00–0:15 | Open the map, no login or slides | “A pollution reading tells us the air is polluted. BreatheAhead explores a different question: where could smoke from detected sources move?” |
| 0:15–0:40 | Select an orange detection; show acquisition time and confidence | “These are real NASA VIIRS thermal anomalies, captured on October 8. They are detections, not proof of crop burning or the cause of a city's pollution.” |
| 0:40–1:10 | Forecast; START → +6H → +12H → +24H, then play | “We move particles through a real hourly wind grid, adding controlled dispersion and fading. This is potential transport, not predicted PM2.5.” |
| 1:10–1:35 | Select Delhi, then Hisar; scrub the timeline | “The inspector shows particles within 25 kilometers at the chosen hour. Some are already nearby at the start; we do not invent an arrival time.” |
| 1:35–1:55 | Replay; choose saved event; toggle layers | “Every run is captured with its inputs and provenance, so the same pathway can be explored again, even when the data providers are offline.” |
| 1:55–2:15 | Ground observations layer, methodology | Before measurements exist: “Verified ground observations are the next validation step. Missing data stays visibly missing.” After import: “Blue station markers show actual measurements at their recorded times. This is a timing comparison, not proof of causation.” |
| 2:15–2:35 | Architecture diagram and a verified AWS run, if deployed | Only after deployment: “EventBridge triggers our Python Lambda pipeline. It preserves raw data and produces simulation snapshots in S3, delivered through API Gateway. CloudFront serves the map.” Until then say “The AWS deployment is prepared; this preview is running locally.” |
| 2:35–2:45 | Return to full map, play | “Source. Transport. Exposure. A spatial view of pollution as a moving phenomenon.” |

Do not include Bedrock, validation scores, live AWS badges, or successful cloud ingestion unless they actually exist. Leave time for slow transitions; keep the final export below three minutes.
