# BreatheAhead: 2 minute 45 second demo script

Open https://d2du2xm4yef86k.cloudfront.net/ and start **Guided tour**. Record at 1440×900 or 1920×1080. Use the capture timestamp visible in the header; do not hardcode a detection count or date in the voiceover. Pause playback when narrating a specific hour. The tour selects a real source with a long modeled path, then a location with later modeled proximity when that exists in the loaded run.

| Time | Action | Voiceover |
|---|---|---|
| 0:00–0:15 | Open the map, then Guided tour | “A pollution reading tells us the air is polluted. BreatheAhead explores a different question: where could smoke from detected sources move?” |
| 0:15–0:40 | Chapter 1: SOURCES. Select a fire point and show its acquisition timestamp and confidence. | “These are real NASA VIIRS thermal anomalies. Every detection has an acquisition time. The captured timestamp stays visible, so we know which data we're exploring.” |
| 0:40–1:15 | Next chapter: follow one pathway. Let it play, then pause at +6H and +12H. | “Now we follow one source through the wind field. The highlighted path connects the mean positions of its surviving model particles. The rings mark starting positions, and the inspector shows displacement. This is a surface-wind approximation of potential transport.” |
| 1:15–1:45 | Next chapter: compare locations. Select two city cards. Show peak timing and source-group buttons. | “The same wind field produces different patterns at different locations. Every chart uses a common scale. These counts describe particles within a 25-kilometer study radius. Selecting a model source group lets us inspect its pathway.” |
| 1:45–2:00 | Explain the first-proximity label and observed-data status. | “Some particles are already nearby at the start; others move closer later. We keep that distinction visible. Verified ground observations are the next validation step. Missing data remains visibly missing.” |
| 2:00–2:30 | Next chapter: Open the evidence → Inspect this capture. Show timestamps, hashes, provider links, AWS pipeline. | “Every run preserves its inputs, acquisition and capture times, and response hashes. Our Python capture Lambda saves the raw inputs and simulation in private S3. API Gateway delivers captured runs to the map, hosted through CloudFront.” |
| 2:30–2:45 | Close evidence. Finish tour, select REPLAY and a saved run. End on the map. | “Saved runs can be revisited with the same inputs and model output. Source. Transport. Potential influence. A spatial view of how detected sources could affect nearby regions.” |

Leave the final export below three minutes. Show the actual loaded values. The mean source path is a model summary, not an observed smoke track. Particle counts are not PM2.5 or health risk. Do not claim ground validation, agricultural fuel type, causal source attribution, uncertainty bounds, or a Bedrock feature.

## Recording fallback

If AWS is unavailable, run `npm run dev` without `VITE_API_URL` and use the bundled October 8 capture. The same tour and tracing work locally, but the status says local replay and the evidence diagram shows the local pipeline. Do not narrate the local preview as a live AWS demonstration. Obtain separate verified AWS footage when connectivity returns.

## Presentation controls

- **Guided tour:** four chapters with framing and captions; source-path playback begins in chapter 2.
- **Next chapter / chapter numbers:** move through the story at your own pace.
- **Play / pause and hour buttons:** control the saved hourly frames. Playback crossfades snapshots rather than calculating extra model steps.
- **Presentation-view icon:** expand the map and inspector without the introductory content.
- **Escape:** close a dialog, or exit the tour/presentation when no dialog is open.
- **Capture & provenance:** inspect real inputs and the delivery pipeline outside the tour.
