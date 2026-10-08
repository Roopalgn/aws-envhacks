# Execution status — October 8, 2026

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
- [x] Document methodology, assumptions, provenance and demo narration.

## Still needed for submission

1. **Deploy and verify AWS.** No CLI, SAM installation or account credentials were available during initial implementation. Run the deployment script in the intended configured account, verify a real capture and website, and preserve deployment evidence.
2. **Ground observations and historical validation.** Obtain real, matching station measurements. The captured October 8 transport run is replayable but is not a validated historical pollution event. Add more events and evaluate a defined comparison before reporting accuracy.
3. **Record the demo and submit.** The script is prepared; no video has been recorded or submission sent. Confirm final requirements on the event site. The supplied plan's three-minute limit is used as the working constraint.
4. **Optional later:** higher-resolution/aloft winds, release timing and source clustering, uncertainty ensembles, continuous emission assumptions, and evidence-bound Bedrock summaries. These should follow, not replace, the validated data pipeline.

The default capture is real public data, not synthetic demo data. Source thermal anomalies are not classified as agricultural fires. Local proximity is not a health forecast or a city-pollution attribution.
