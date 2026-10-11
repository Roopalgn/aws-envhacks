# Project review — October 10, 2026

## Changes implemented for the demo

| Gap | Improvement | Meaning |
|---|---|---|
| EXPOSURE implied a measured quantity the model does not calculate | Use Source → Transport → Influence in the interface and potential influence in narration | The model calculates particle proximity, not exposure dose |
| LIVE contradicted captured inputs | Rename the navigation mode SOURCES; retain capture and acquisition timestamps | Sources is a snapshot-inspection mode |
| A selected fire had metadata but no visible relationship to the simulation | Highlight its particles and mean hourly pathway; show net displacement and surviving particle count | Derived from saved source-group indices; no new trajectory data is fabricated |
| Comparing cities required repeated manual selection | Seven city charts on a shared scale; click to inspect the earliest peak | Counts, peak hour, and first proximity use the actual frames |
| City influence did not show its modeled source groups | List contributing groups and link each to its source path | Model association within the study radius, not attribution of measured pollution |
| Demo navigation lacked a concise story | Four-chapter guided tour, map framing, captions, presentation layout | Real source selection and locations are derived from the loaded capture |
| Hourly playback looked abrupt | Crossfade saved snapshots; slow playback to 1.2 seconds per model hour | A display transition, not temporal model interpolation |
| AWS and provenance were hard to demonstrate visually | Evidence panel with hashes, timestamps, provider links and pipeline | AWS label depends on the API health response |
| Wind arrows used degree-based spatial weights | Use kilometer-based inverse-square weights, matching Python | Direction and speed now agree with the model at saved hours |
| Refresh did not refresh the replay menu; competing requests could replace newer choices | Refresh events with the run and ignore outdated requests | Preserves the intended capture when switching quickly |
| Captures at the same model start hour overwrote previous replay files and raw inputs | Add unique capture-ID suffixes; keep older IDs readable and show capture time in the replay menu | Separate retrievals remain separate even when their model anchor is identical |
| Fire points were difficult to reach by keyboard; tiny text and modal scrolling weakened usability | Native marker buttons, clearer text, mobile layout, focus handling and scroll containment | Works across the explorer and the recording flow |

## Gaps that remain

1. **Ground measurements and evaluation:** the importer exists, but no verified measurements are connected. A stronger scientific demo would show a matched event with station timestamps and an explicitly defined comparison. This remains the most valuable data improvement.
2. **Physical model detail:** simultaneous equal-weight pulses, coarse 10 m winds, and illustrative decay remain major assumptions. No elevated wind, plume rise, emissions conversion, chemistry or calibrated removal is calculated.
3. **Uncertainty:** no ensemble is present, so there is no basis for a confidence band or probability. Adding such a feature requires several scientifically distinct model runs and clear interpretation.
4. **Historical event claims:** saved captured runs are reproducible replays; they are not validated historical pollution episodes.
5. **No detections:** ingestion deliberately preserves the last capture and reports an error for a feed with zero detections. Supporting a genuine empty-source run would require a dataset/UI contract change and pipeline tests.
6. **Submission assets:** record and upload the final video, review the submission requirements, and submit the final links. The updated script is in `docs/demo.md`.

The original temporary plan is preserved. The implemented demo emphasizes inspectable source-to-transport behavior and the real AWS pipeline. The remaining data and model gaps should guide further work rather than be hidden by presentation changes.

## Verification

All 17 Python tests and four frontend analysis tests passed, as did the TypeScript/Vite production build. Browser checks covered the guided tour, source tracing, native keyboard marker selection, location comparisons, provenance, and saved replay loading. The 1440×900 desktop and 390×844 mobile layouts were reviewed; mobile had no horizontal overflow. The update was deployed to the existing AWS site. A real 127-detection capture with a unique ID was published and verified through its replay endpoint; the replay menu preserves the earlier capture at the same model start. The existing six-hour schedule remains disabled.
