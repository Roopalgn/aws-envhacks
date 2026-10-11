# Execution status — October 10, 2026

## Implemented

- [x] Read and preserve hackathon brief and initial plan.
- [x] Build map-led responsive React/TypeScript application.
- [x] Capture real NASA FIRMS detections and Open-Meteo wind responses.
- [x] Implement and test deterministic particle advection and dispersion.
- [x] Drive timeline, playback, source selection and city proximity from computed data.
- [x] Save an offline real-data capture with raw provenance and replay controls.
- [x] Distinguish modeled values from missing ground observations.
- [x] Build verified-measurement CSV import and time-aligned station markers.
- [x] Implement local API and AWS ingestion/API handlers.
- [x] Add SAM infrastructure and an end-to-end AWS deployment script.
- [x] Deploy in `ap-south-1`, publish a real 117-detection capture, and verify the hosted UI, API, and replay. Website: https://d2du2xm4yef86k.cloudfront.net/. The six-hour schedule remains disabled.
- [x] Document methodology, assumptions, provenance and demo narration.
- [x] Replace LIVE/EXPOSURE wording; add source tracing, modeled source-group inspection, common-scale location comparison, guided presentation, and capture evidence view.
- [x] Align wind rendering with the Python model's distance weighting; verify source grouping, tracing and timing with frontend analysis tests.
- [x] Preserve separate ingestion runs at the same model start hour using unique capture IDs, with backward-compatible replay routes and regression coverage.
- [x] Deploy the demo improvements and replay fix; verify 21 tests, production build, desktop/mobile UI, and a real 127-detection capture with its unique replay endpoint. Schedule remains disabled.

## Still needed for submission

1. **Ground observations and historical validation.** Obtain real, matching station measurements. The captured transport runs are replayable but are not validated historical pollution events. Add more events and evaluate a defined comparison before reporting accuracy.
2. **Record the demo and submit.** The script is prepared; no video has been recorded or submission sent. Confirm final requirements on the event site. The supplied plan's three-minute limit is used as the working constraint.
3. **Optional later:** higher-resolution/aloft winds, release timing and source clustering, uncertainty ensembles, continuous emission assumptions, and evidence-bound Bedrock summaries. These should follow, not replace, the validated data pipeline.

The default capture is real public data, not synthetic demo data. Source thermal anomalies are not classified as agricultural fires. Local proximity is not a health forecast or a city-pollution attribution.
