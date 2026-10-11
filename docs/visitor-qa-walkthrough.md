# BreatheAhead visitor QA walkthrough

Website: https://d2du2xm4yef86k.cloudfront.net/

Use this as a manual test script. Record **Pass**, **Fail**, or **Not applicable** beside each ID. A capture can change between visits, so compare labels and relationships rather than expecting a fixed fire count, timestamp, particle count, or replay list. The model shows **potential influence**, not measured exposure, a live fire feed, or a health forecast.

Start on a desktop browser at roughly 1440 × 900. Reload the page once before test A01. Write down the captured timestamp and fire-detection count you see. After the desktop checks, repeat section H at a narrow mobile width. Keep the browser console open if you know how; a visible failure is enough to file a bug even without console logs.

| Result | Test ID | What to do | Expected outcome |
|---|---|---|---|
| ☐ | A01 | Open the website and wait for loading to finish. | The map, timeline, study-area card, location inspector, layers, comparison cards, and footer appear. No permanent spinner, blank map, or `Data unavailable` panel. |
| ☐ | A02 | Read the top-right status and capture timestamp. | Hosted site says `CAPTURED DATA · API`; health normally says `AWS backend verified`. A specific `Captured … IST` time appears. This is a saved capture, not a claim of live detections. |
| ☐ | A03 | Compare the map time, timeline hour, and `Run starts` line. | The map time equals run start plus the selected hour; default Forecast normally opens at `+6 HOURS`. All displayed times use IST. |
| ☐ | A04 | Read the study-area card. | It names Northern India, shows a numeric satellite-detection count, VIIRS / Suomi NPP, a 24-hour horizon, and the same capture timestamp as the header. The count may change when a new run is published. |
| ☐ | A05 | Inspect the map legend and the map itself. | The legend identifies fire detections, wind direction, and modeled particles. Geographic boundaries are approximate; no map tiles should show a missing-image icon. |

## B. Main navigation and map

| Result | Test ID | What to do | Expected outcome |
|---|---|---|---|
| ☐ | B01 | Click **SOURCES**. | SOURCES is highlighted, heading says `SATELLITE SOURCE CAPTURE`, timeline goes to `START`, and smoke particles and starting-position rings are hidden. This view shows captured detections, not a live feed. |
| ☐ | B02 | While in SOURCES, try Play, the hour slider, hour ticks, Previous/Next, Smoke simulation, and Starting positions. | These controls are disabled and do not change the hour or show the simulated plume. Wind field, detections, and ground-observation toggles can still be used. |
| ☐ | B03 | Click **FORECAST**. | FORECAST is highlighted, heading says `TRANSPORT EXPLORER`, and the hour resets to `+6 HOURS`. Timeline and simulated-particle controls become usable. |
| ☐ | B04 | Click **REPLAY**. | REPLAY is highlighted, heading says `CAPTURED RUN REPLAY`, hour resets to `START`, and a `CAPTURED RUN` dropdown appears near the bottom. Replay is a saved model run, not a live stream. |
| ☐ | B05 | Click **FORECAST** again. | The dropdown is replaced by `Explore captured replay`; the hour returns to +6. The loaded dataset stays the same until a replay is selected or latest is reloaded. |
| ☐ | B06 | Drag the map. | The geography, fire points, city markers, wind strokes, and particles move together. No overlay should detach from its map location. |
| ☐ | B07 | Use mouse-wheel zoom or pinch zoom, then click **Zoom in** and **Zoom out**. | Map scale changes in the expected direction. Markers and particle drawing stay aligned. Zoom is bounded; repeated presses eventually stop changing scale. |
| ☐ | B08 | Click **Reset map view**. | Map recenters and fits the source and location area. The selected city or fire point and selected hour do not reset. |
| ☐ | B09 | Hover over a fire point. | A tooltip identifies it as a VIIRS detection and shows its confidence. The point is not described as a confirmed agricultural fire. |
| ☐ | B10 | Click any visible fire point. | The inspector changes to `SOURCE INSPECTOR / DETECTED`; it shows coordinates, acquisition time, confidence, radiative power, wind, and a model-limit note. The point is highlighted. |
| ☐ | B11 | In SOURCES with a fire selected, click **Follow this source**. | Mode switches to FORECAST, the map frames the modeled source path, particles are visible, and the inspector shows mean displacement and surviving particles for the selected hour. A path may end early if no particles survive. |
| ☐ | B12 | Click a named city marker (for example, Hisar or Delhi NCR). | `LOCATION INSPECTOR / MODELED` shows that city's name, coordinates, first modeled proximity, count at selected time, peak count/time, observed PM2.5 status, and local model wind. A study-radius ring highlights the selected city. |
| ☐ | B13 | Select a city that says `No proximity in this run` in its comparison card. | Inspector shows zero particles at relevant hours and `No proximity`; this is a valid result, not a loading failure. |
| ☐ | B14 | Read the inspector and map badges while switching between a fire and a city. | A fire has observed **detection** details and a **modeled** path. A city has modeled particle proximity. Neither view reports actual exposure, AQI, health risk, or proven source attribution. |

## C. Timeline and animation

Return to FORECAST with a city selected before starting this section.

| Result | Test ID | What to do | Expected outcome |
|---|---|---|---|
| ☐ | C01 | Click **START**, then each preset tick: `+3H`, `+6H`, `+9H`, `+12H`, `+18H`, `+24H`. | Highlighted tick, displayed hour, map time, particle positions, city count, wind readout, and charts update to the selected frame. Changes need not be monotonic. |
| ☐ | C02 | Drag the **Forecast hour** slider to a non-preset hour such as +5 or +11. | Exact selected hour appears above the slider; map and inspector use that hour. Playback stops if it was running. |
| ☐ | C03 | At +5, click **Previous hour** and **Next hour**. | Previous goes to +4; Next returns to +5. At START, Previous is disabled; at +24H, Next is disabled. |
| ☐ | C04 | At START, click **Play animation**. | Label changes to Pause; hour advances approximately once per 1.2 seconds through saved hourly frames. Map changes with it. This is playback, not a fresh computation or API capture. |
| ☐ | C05 | Click **Pause animation**. | Hour stops advancing and the button changes back to Play. |
| ☐ | C06 | Play through +24H. | Playback stops at +24H. Clicking Play once more returns to START and resumes playback. |
| ☐ | C07 | While playing, click a preset hour or move the slider. | Playback stops and the selected hour remains. |
| ☐ | C08 | With a city selected, click several bars in the inspector's 25-bar mini chart. | Each bar selects its corresponding hour (0–24); the selected bar, timeline, map, and city readout agree. Hovering a bar shows its hour and particle count. Bars are disabled in SOURCES. |

## D. Layer switches and interpretation

| Result | Test ID | What to do | Expected outcome |
|---|---|---|---|
| ☐ | D01 | Toggle **Fire detections** off and on. | Fire-point markers disappear and return. City markers remain. If a fire was selected, its inspector selection need not be cleared. |
| ☐ | D02 | Toggle **Wind field** off and on. | Animated short wind strokes disappear and return. Particle positions and source/city selections do not change. |
| ☐ | D03 | Toggle **Smoke simulation** off and on in FORECAST. | Orange modeled particles disappear and return. When a fire is selected, its modeled path also disappears and returns. Fire and city markers remain. |
| ☐ | D04 | Toggle **Starting positions** on and off in FORECAST. | Faint rings appear at captured source origins and then disappear. They do not represent additional detections. |
| ☐ | D05 | Toggle **Ground observations** on for the currently deployed capture. | If it has no imported verified measurements, show `No verified station measurements in this capture`; no station markers or invented PM2.5 values appear. If a later capture contains observations, show only stations whose timestamps are within 30 minutes of the selected frame. |
| ☐ | D06 | With observations absent, inspect `OBSERVED PM2.5` in a city inspector. | It says `Not available`. The modeled particle count is not substituted as PM2.5. |
| ☐ | D07 | Turn every usable layer off, then back on. | Blank-ish map is intentional with layers off; toggles show their pressed state and reliably restore the overlays. Base geography and city labels remain. |

## E. Location comparison and source tracing

Scroll below the map to `LOCATION COMPARISON`. If presentation view hides something you need, exit presentation view first.

| Result | Test ID | What to do | Expected outcome |
|---|---|---|---|
| ☐ | E01 | Review all seven location cards. | Delhi NCR, Hisar, Ludhiana, Chandigarh, Jaipur, Karnal, and Patiala are present. Each shows a full-run mini chart, peak particle count and hour, and first-proximity or no-proximity text. Counts are relative model particles, not pollution readings. |
| ☐ | E02 | Click a card with a nonzero peak. | Mode becomes FORECAST; inspector selects that city; timeline jumps to its peak hour; the card gains selected styling. The inspector's peak and selected-time values should agree. |
| ☐ | E03 | Click a zero-peak card. | Its city is selected at START (+0); inspector reports no proximity. The card may show a dash instead of a peak hour. |
| ☐ | E04 | Compare chart heights across two cards. | Bars use a common scale across all locations. A location with a smaller peak should not have an equally tall peak bar unless values are equal. |
| ☐ | E05 | At a city/hour with nearby particles, click a row under **MODEL SOURCE GROUPS**. | A fire detection becomes selected, mode remains/switches to FORECAST, the map frames that source's modeled path, and the inspector changes to source details. These rows are model associations, not measured attribution. |
| ☐ | E06 | Change to an hour where the selected city has zero particles. | The `MODEL SOURCE GROUPS` list disappears if there are no contributing modeled particles at that hour. No stale row remains. |

## F. Guided tour and presentation view

Click **Guided tour** near the top. If you cannot see it, scroll to the top or click the BreatheAhead logo to return home first.

| Result | Test ID | What to do | Expected outcome |
|---|---|---|---|
| ☐ | F01 | Start the tour. | Chapter `01 / 04 — The sources` appears, SOURCES mode is selected, START is shown, and a story card explains real detections. Presentation view hides the intro and expands the workspace on desktop. |
| ☐ | F02 | Click chapter numbers 1–4 on desktop, in nonsequential order. | Active number and story-card text change to the requested chapter; map mode, layers, selected item, and hour switch to that chapter's prepared view. On narrow mobile screens these number buttons are intentionally hidden. |
| ☐ | F03 | From chapter 1, inspect **Previous tour chapter**. | It is disabled. |
| ☐ | F04 | Click **Next chapter** to chapter 2, `Follow one pathway`. | A source is automatically selected, FORECAST starts at START, playback begins, and a highlighted modeled path plus starting-position rings appear. It may take a moment for the hour to advance. |
| ☐ | F05 | Pause chapter 2 at any hour and click Next. | Chapter 3, `Compare locations`, selects a location chosen for the loaded run and jumps to a meaningful modeled hour (normally its peak). The story card, inspector, and comparison cards agree about the selection. |
| ☐ | F06 | Click Next to chapter 4, `Open the evidence`, then **Inspect this capture** in its story card. | REPLAY is selected; an evidence dialog opens over the page and names the currently loaded capture. |
| ☐ | F07 | Close the evidence dialog, then click **Finish tour**. | Dialog closes first; finishing removes the tour bar and story card, exits presentation view, and stops playback. Loaded run remains available. |
| ☐ | F08 | Start the tour again and click the **X / Exit guided tour** button. | Tour bar and story card vanish immediately, normal page layout returns, and playback stops. |
| ☐ | F09 | Outside the tour, click **Enter presentation view** beside the map time, then click **Exit presentation view**. | Desktop layout condenses the intro, study-area/layer panels, bottom row, and footer to emphasize the map and inspector; the second click restores them. On mobile, panels remain available in presentation view. |
| ☐ | F10 | In presentation view with no dialog open, press Escape. | Presentation view closes and playback stops. If a tour is active, Escape also exits the tour. |

## G. Evidence, methodology, replay, and links

| Result | Test ID | What to do | Expected outcome |
|---|---|---|---|
| ☐ | G01 | Click **How the model works**. | A dialog explains detected source → wind/dispersion → potential influence, calculation steps, model limitations, data sources, and lack of historical validation. Background page should not scroll while it is open. |
| ☐ | G02 | Close methodology with its X. Reopen it, then press Escape. Reopen it, then click outside the dialog. | All three methods close it; focus should return to the opener after closing. The underlying mode/hour should remain unchanged. |
| ☐ | G03 | Click **Capture & provenance** in the study-area card. | Evidence dialog shows capture ID, source count, nine-point wind grid, 25 model frames, distinct acquisition/capture/model times, raw SHA-256 hashes, provider links, AWS delivery pipeline when verified, and ground-measurement status. |
| ☐ | G04 | In the evidence dialog, compare its `Data retrieved` time to the header and its modeled start to `Run starts`. | Times agree for the selected run. Satellite acquisition span may predate the capture; it should not be mislabeled as the model start or as live detection time. |
| ☐ | G05 | Open NASA FIRMS and Open-Meteo links from the evidence dialog, then the footer links. | Each opens the relevant external provider in a new tab. The provenance links may show a specific raw-data URL; the footer Open-Meteo link opens the provider home. Return to BreatheAhead without losing your state. |
| ☐ | G06 | Click the footer **Methodology & limitations** button. | The same methodology dialog opens. |
| ☐ | G07 | Click **Explore captured replay** below the comparison section. | REPLAY mode activates, START is selected, and the captured-run dropdown appears. |
| ☐ | G08 | Open the captured-run dropdown. | It lists saved runs by modeled start and capture time. Two runs may have the same modeled start but different capture times; both should remain selectable. The list can grow as new captures are published. |
| ☐ | G09 | Select an older run. | A brief loading state may appear; header/study-area capture time, detection count, map, charts, and evidence switch together to that run. The selector stays on the chosen run. No data from the previous run should remain in the inspector. |
| ☐ | G10 | Open **Capture & provenance** for the older run. | Capture ID and retrieved time match that run. If a second run has the same modeled start, its capture ID and retrieved time should still distinguish it. |
| ☐ | G11 | Click **Reload latest captured data** (circular-arrow button). | Latest capture loads, capture timestamp updates to the newest available run, and the selector/event list refreshes. This downloads the latest saved capture; it does **not** invoke a new NASA/Open-Meteo capture. In REPLAY, hour returns to START. |
| ☐ | G12 | Click the BreatheAhead logo. | Home page reloads with latest saved data and default FORECAST view; temporary tour, layer, selection, and hour changes reset. |

## H. Mobile, keyboard, and failure-path checks

Repeat the site at about 390 × 844 (phone or browser device emulation), then at a tablet-like width. Testing a real touch device is useful for pan, zoom, slider, and small targets.

| Result | Test ID | What to do | Expected outcome |
|---|---|---|---|
| ☐ | H01 | Scroll from top to footer on mobile. | No sideways page scroll, overlapping text, clipped controls, or content you cannot reach. Map, timeline, study-area, inspector, layers, cards, replay, and footer remain usable. |
| ☐ | H02 | Use the three mode tabs, timeline slider, layer switches, city cards, and replay dropdown by touch. | Controls respond with one tap; the active state and dependent map/inspector content update. Browser scrolling should not accidentally activate a control. |
| ☐ | H03 | Run all four tour chapters on mobile. | Story card and map controls remain readable. Mobile hides chapter-number circles and the Previous button, but **Next chapter**, **Finish tour**, and **Exit guided tour** remain accessible. |
| ☐ | H04 | Open both dialogs on mobile and scroll their contents. | Dialog content fits within the viewport, scrolls independently, and its close button stays reachable. Closing returns to the same page state. |
| ☐ | H05 | On desktop, navigate with Tab and Shift+Tab; use Enter/Space on controls. | Visible focus outline appears. Buttons, mode tabs, city cards, layer switches, links, and dialog close control are reachable and operable without a mouse. |
| ☐ | H06 | With a dialog open, press Tab repeatedly, then Shift+Tab. | Focus cycles inside the dialog rather than moving to background controls; Escape closes it. If focus escapes or becomes invisible, log an accessibility bug. |
| ☐ | H07 | In browser developer tools, switch Network to Offline **after the page has loaded**, then click Reload latest. Restore Online and click **Try again**. | Offline request shows `Data unavailable` and a Try again button; the prior map may remain behind the error. After reconnecting, Try again clears the error and restores captured data. Do not run this during a demo recording. |
| ☐ | H08 | Reload normally and inspect browser console/network if available. | No uncaught JavaScript errors or failed first-party data requests. External source links and the static geography file should load as expected. |

## Log a bug clearly

For any failure, record: **test ID**, browser/device and screen width, selected mode/run/hour, selected city or source, exact action, expected result, actual result, whether it reproduces after reload, and a screenshot. Include the captured timestamp (and capture ID from Evidence when relevant) because saved runs can differ. Prioritize crashes, wrong data/run mix-ups, broken controls, misleading exposure/live wording, or mobile controls that cannot be reached.

An empty observation layer, zero-proximity city, changing capture count, or a source path ending when particles leave the grid is not by itself a bug. The six-hour AWS capture schedule is currently enabled even though the stack parameter says it is disabled; that infrastructure mismatch is separate from visitor UI behavior.
