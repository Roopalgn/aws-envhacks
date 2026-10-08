# BreatheAhead

## Source-to-Exposure Air Pollution Intelligence & Smoke Transport Visualization

You are building **BreatheAhead** for the AWS / WeMakeDevs **Environmental Hacks 2026** hackathon.

You already have access to the hackathon information/rules file. Treat those rules as authoritative. The project must be genuinely built during the hackathon, use AWS meaningfully, and the final submission must be understandable from the repository, website, and ≤3-minute demo video.

---

# 1. THE CORE IDEA

## One-sentence product definition

**BreatheAhead shows where pollution sources are, how weather can transport their smoke, where that pollution is likely to move next, and how the predicted movement compares with what actually happened.**

The central concept is:

> **SOURCE → TRANSPORT → EXPOSURE**

Most air-quality interfaces answer:

> “How polluted is my city right now?”

BreatheAhead answers:

> **“Where is this pollution coming from, where is it moving, and when could it reach an area?”**

This distinction is the heart of the product.

---

# 2. IMPORTANT POSITIONING

Do NOT build BreatheAhead as:

* a generic AQI dashboard
* a chatbot that tells users pollution is bad
* a school-only application
* an app that simply says “stay indoors”
* a generic weather website
* a generic fire map
* a claim that stubble burning causes Delhi's pollution
* a system claiming exact AQI prediction
* a fake scientific model presented as equivalent to HYSPLIT/CMAQ/etc.
* an AI wrapper around public APIs

The project should instead feel like a **visual environmental intelligence system**.

The wow factor must come from the underlying pipeline:

**real source data → atmospheric transport approximation → spatial simulation → exposure forecast → historical validation/replay**

AI is secondary.

---

# 3. THE PROBLEM

Air-quality applications generally expose the **current state** of pollution.

However, current AQI alone does not answer important questions:

* What are the major visible pollution sources?
* Are those sources located upwind or downwind of me?
* Is wind transporting emissions toward my region?
* How long could that transport take?
* Which areas may be influenced over the next several hours?
* Did the predicted movement actually resemble what happened?
* What happened during a previous pollution event?

Raw AQI measurements are observations at monitoring stations.

BreatheAhead adds a different layer:

### Spatial + temporal reasoning.

Instead of showing isolated numbers, it creates a visual explanation:

**source**
↓
**wind direction**
↓
**transport path**
↓
**affected region**
↓
**observed pollution**

The system should make this relationship visually obvious.

---

# 4. INITIAL DEMONSTRATION SCENARIO

The primary demonstration scenario should use **agricultural fire hotspots in northern India** as the pollution source because they provide a strong visual source → transport story.

The prototype can focus on a Punjab/Haryana → NCR-type scenario.

However:

### DO NOT claim:

“Stubble burning causes Delhi pollution.”

Instead say:

> “BreatheAhead models the potential transport of smoke from detected fire hotspots under prevailing wind conditions.”

Agricultural fires are the initial demonstrator, not the entire definition of the product.

The architecture should conceptually support other emission sources later.

---

# 5. PRODUCT EXPERIENCE

The website should feel like a **mission-control / environmental intelligence interface**, not a conventional dashboard.

The first screen should immediately communicate:

> **AIR POLLUTION ISN'T STATIC. SEE WHERE IT'S MOVING.**

Then transition into the live map.

---

# 6. PRIMARY UI

## Overall visual direction

Use a premium dark interface.

Think:

* satellite/environmental intelligence
* weather radar
* aviation/mission control
* scientific visualization
* modern Bloomberg-style data density
* cinematic but still usable

Avoid:

* excessive glassmorphism
* giant rounded cards everywhere
* generic purple AI gradients
* stock illustrations
* cartoon environmental graphics
* unnecessary animations
* dashboard-template appearance

The map should dominate the screen.

---

# 7. MAIN SCREEN LAYOUT

## Top navigation

Left:

**BreatheAhead**

Small subtitle:

**Source → Transport → Exposure**

Center navigation:

* LIVE
* FORECAST
* REPLAY

Right:

* Data status
* Last updated
* AWS status indicator

Example:

`● DATA LIVE`

---

# 8. HERO MAP

The map should occupy approximately **70–80% of the visual attention**.

Base layer:

* dark map
* subtle geographic boundaries
* India / northern India context
* major cities
* very restrained labels

Do not make the base map brighter than the pollution visualization.

---

# 9. SOURCE VISUALIZATION

Fire hotspots should appear as glowing points.

Example:

🔥 Punjab/Haryana source clusters

But don't literally use hundreds of emoji-like fire icons.

Use:

* orange/red glowing particles
* pulsing source points
* clustered heat intensity

When the user selects a source cluster, show:

**SOURCE CLUSTER**

Detected hotspots: 47
Detection window: 14:00–16:00
Region: Punjab
Confidence: High

If actual confidence metadata is unavailable, do not fabricate it.

---

# 10. WIND VISUALIZATION

Wind direction is essential.

Represent wind using animated particles or streamlines.

Example:

Punjab
→ → → → →
Haryana
→ → → → →
Delhi NCR

The movement should make it immediately obvious that the simulated plume is being transported by the wind.

This is one of the main visual wow moments.

The user should be able to understand the system without reading documentation.

---

# 11. SMOKE / PLUME SIMULATION

This is the signature feature.

Take detected source locations and wind vectors.

Run a **simplified atmospheric advection model**.

Conceptually:

For each particle:

1. Start at source coordinates.
2. Retrieve wind direction/speed.
3. Move particle according to wind vector.
4. Add small stochastic dispersion.
5. Reduce intensity with distance/time.
6. Continue through forecast time steps.

This produces a simulated plume.

Visually:

Source
→ particles
→ expanding plume
→ fading concentration
→ potentially affected region

The plume should NOT look like a perfectly straight arrow.

Introduce controlled dispersion.

---

# 12. IMPORTANT SCIENTIFIC HONESTY

This is a hackathon prototype.

Do NOT present the simplified model as a complete atmospheric chemistry model.

Use wording such as:

> **Simulated smoke influence**

or

> **Estimated transport pathway**

rather than:

> “Predicted PM2.5 concentration”

unless there is actual validated methodology supporting that claim.

The UI should include a small methodology/info panel:

> “BreatheAhead uses detected emission sources and meteorological wind fields to estimate potential smoke transport. This is a simplified transport model, not a full atmospheric chemistry forecast.”

This actually increases credibility.

---

# 13. FORECAST MODE

Create a timeline at the bottom of the map.

Example:

`NOW | +3H | +6H | +9H | +12H | +18H | +24H`

Dragging the timeline should animate the plume.

This is critical.

The judge should be able to drag:

**NOW → +6H → +12H**

and literally watch the simulated smoke move.

This creates a much stronger demo than a static dashboard.

---

# 14. AFFECTED AREA

When the simulated plume reaches an area, visually highlight the region.

For example:

**Potential smoke influence**

Delhi NCR
ETA: ~8 hours

Again, don't present ETA as exact atmospheric truth.

Label it:

**Estimated transport time**

and include uncertainty where appropriate.

---

# 15. CITY / LOCATION INSPECTOR

Clicking a major location should open a compact side panel.

Example:

### DELHI NCR

Current observed PM2.5
`142 µg/m³`

Nearby source activity
`Elevated`

Transport direction
`NW → SE`

Estimated plume arrival
`~7–10 hours`

Transport influence
`Moderate`

Observed data source:

`Ground monitoring`

Important:

If real data isn't available, do not manufacture numbers.

The application should distinguish:

**OBSERVED**

from

**MODELED**

visually.

For example:

OBSERVED = blue/white

MODELED = orange

This distinction should be consistent throughout the interface.

---

# 16. FORECAST PANEL

A right-side expandable panel can show:

### NEXT 12 HOURS

**Transport outlook**

00:00
Source activity detected

+3h
Plume moving southeast

+6h
NCR enters potential influence zone

+9h
Maximum modeled influence

+12h
Influence begins dispersing

This is much more useful than simply displaying AQI.

---

# 17. REPLAY MODE

This should be one of the biggest wow features.

Create a historical pollution-event replay.

The user chooses:

### REPLAY EVENT

`Northern India Smoke Event`

Then:

**STEP 1 — SOURCE**

Show historical fire hotspots.

**STEP 2 — WIND**

Animate the historical wind field.

**STEP 3 — TRANSPORT**

Animate the simulated plume.

**STEP 4 — OBSERVATION**

Reveal actual monitoring observations.

The UI should allow:

`◀ Previous | ▶ Play | Next ▶`

and a timeline.

---

# 18. WHY REPLAY MATTERS

Replay changes the product from:

> “Here is our prediction.”

to:

> **“Here is how our model explains a real historical event.”**

This gives judges something tangible to inspect.

It also provides a natural way to demonstrate validation without pretending the model is scientifically perfect.

---

# 19. MODEL VS OBSERVED VIEW

Include an optional comparison mode.

Example:

### MODEL

Simulated smoke influence

versus

### OBSERVED

Actual PM2.5 measurements

Use monitoring stations as dots.

When the timeline progresses, observed measurements appear alongside the simulated plume.

The goal is not necessarily to prove perfect numerical accuracy.

Instead communicate:

> **Does the modeled transport direction and timing broadly correspond with the observed event?**

That is a much more defensible claim.

---

# 20. DATA SOURCES

Use real external data where practical.

Potential data pipeline:

### Fire / emission sources

NASA FIRMS

Provides detected fire hotspots.

### Meteorology

Use an accessible weather / historical weather API providing:

* wind speed
* wind direction
* timestamps
* coordinates

### Ground observations

OpenAQ or another legitimate monitoring source where appropriate.

The UI should explicitly show data provenance.

Example:

`FIRE DATA — NASA FIRMS`

`WEATHER — Meteorological API`

`GROUND OBSERVATIONS — OpenAQ`

Do not fabricate data-source attribution.

---

# 21. AWS ARCHITECTURE

AWS must be a genuine part of the product, not decorative.

Recommended architecture:

### EventBridge

Schedules data refreshes.

Example:

Every N hours:

EventBridge
↓
Lambda ingestion
↓
S3

---

### Lambda

Use Lambda for:

* retrieving source data
* processing wind data
* generating normalized datasets
* running transport simulation
* generating forecast/replay data
* serving lightweight API operations

---

### S3

Use S3 for:

* raw source datasets
* processed geospatial data
* replay datasets
* generated forecast snapshots
* static frontend deployment if appropriate

---

### DynamoDB

Use DynamoDB only where useful.

Potential uses:

* forecast metadata
* event metadata
* processing status
* saved replay configurations

Do not use DynamoDB merely because the hackathon mentions it.

---

### API Gateway

Expose the backend to the frontend.

Example endpoints:

`/sources`

`/forecast`

`/wind`

`/replay`

`/locations`

`/events`

---

### CloudFront

Serve the frontend efficiently if using S3 static hosting.

---

### Optional Bedrock

If Bedrock is used, it should NOT perform the actual atmospheric calculation.

Use Bedrock for:

### “Explain this event”

Example:

The deterministic system generates:

* 37 source clusters
* wind direction
* modeled transport
* affected region
* observed changes

Then Bedrock turns these structured facts into a concise explanation.

Example:

> “A cluster of agricultural fire detections northwest of NCR coincided with southeasterly transport conditions. The modeled plume reaches the NCR region approximately 7–10 hours after detection. Ground observations can be compared against this transport window.”

The LLM should explain the model.

It should NOT invent the model.

---

# 22. BACKEND DATA FLOW

The architecture should conceptually look like:

NASA FIRMS
↓
AWS ingestion
↓
S3 raw data
↓
Lambda processing
↓
Wind + source normalization
↓
Transport simulation
↓
Forecast / replay dataset
↓
S3 / DynamoDB
↓
API Gateway
↓
Frontend map

Optional:

Structured results
↓
Amazon Bedrock
↓
Human-readable explanation

---

# 23. FRONTEND TECHNOLOGY

Use whatever modern stack you are fastest and most reliable with.

A strong choice:

* React
* TypeScript
* MapLibre GL JS or Leaflet
* Tailwind/CSS
* lightweight charting where useful

Do not spend hackathon time building a complex backend framework if Lambda/API Gateway is sufficient.

---

# 24. MAP ANIMATION

The map animation should be extremely polished.

Particles should:

* move according to wind
* spread gradually
* fade with time
* remain tied to their source
* update when timeline changes

Potential interaction:

Hover over plume:

`MODELED TRANSPORT`

Click:

`Transport estimate`

The animation should feel like an actual environmental simulation rather than a line drawn between two points.

---

# 25. VISUAL HIERARCHY

At any moment the user should understand:

### 1.

Where are the sources?

### 2.

Which way is the air moving?

### 3.

Where is the plume going?

### 4.

When could it arrive?

### 5.

What do observations show?

That is the entire product story.

Everything else is secondary.

---

# 26. COLOR LANGUAGE

Use a restrained dark theme.

Suggested semantic colors:

* neutral/white = normal UI
* blue = meteorology / observed information
* orange = emission sources
* red = stronger source activity / modeled influence
* green = lower influence / dissipating
* yellow = uncertainty / caution

Do not turn the entire interface into a rainbow.

The map should remain visually dominant.

---

# 27. LANDING EXPERIENCE

When the website loads, avoid a generic login page.

Show:

# BreatheAhead

### SEE POLLUTION MOVE.

Small subtitle:

**Source → Transport → Exposure**

Then immediately load the map.

Potential animated sequence:

1. India map appears.
2. Source hotspots fade in.
3. Wind particles begin moving.
4. Smoke particles emerge.
5. Plume travels toward the affected region.
6. Timeline appears.
7. UI settles into the interactive dashboard.

This can happen within approximately 2–4 seconds.

It should feel cinematic but not gimmicky.

---

# 28. LIVE / FORECAST / REPLAY NAVIGATION

Use three primary modes.

## LIVE

“What is happening now?”

Displays:

* current source detections
* current wind
* current modeled transport
* current observations

## FORECAST

“What could happen next?”

Displays:

* forecast wind
* projected plume
* timeline
* estimated influence zones

## REPLAY

“What happened during a previous event?”

Displays:

* historical sources
* historical wind
* modeled transport
* actual observations

This three-mode structure gives the application a clear product identity.

---

# 29. OPTIONAL “EVENT CARD”

When an important event is detected:

### TRANSPORT EVENT

**Punjab → NCR**

Source activity: Elevated
Wind: SE
Estimated transport: 7–10h
Potential influence: Moderate

`EXPLORE EVENT →`

This makes the system feel proactive rather than passive.

---

# 30. DO NOT OVERLOAD THE UI

The first version should NOT contain:

* user accounts
* social features
* chat
* notification systems
* complex profiles
* huge analytics dashboards
* unnecessary settings
* dozens of filters
* fake precision
* complicated ML training pipelines

The judge should understand the entire product within **10 seconds**.

---

# 31. CORE MVP PRIORITY

If development time becomes limited, implement features in this exact order.

### PRIORITY 1

Working interactive map.

### PRIORITY 2

Real source/fire data.

### PRIORITY 3

Real wind data.

### PRIORITY 4

Particle/advection simulation.

### PRIORITY 5

Timeline animation.

### PRIORITY 6

Historical replay.

### PRIORITY 7

Observed monitoring comparison.

### PRIORITY 8

AWS backend.

### PRIORITY 9

AI explanation.

Do not sacrifice the core visualization to add more AI.

---

# 32. THE “WOW” MOMENT

The strongest moment of the entire application should be:

The judge sees fire hotspots in Punjab/Haryana.

Then presses:

**FORECAST**

The wind particles start moving.

The smoke particles emerge from the hotspots.

The timeline advances:

`NOW → +3H → +6H → +9H`

The plume visibly moves toward NCR.

Then the application switches to:

**REPLAY**

and shows a historical event where the same source → transport → observation relationship can be inspected.

The judge should think:

> “Oh. This isn't just an AQI website. It is actually modeling where pollution is moving.”

That is the desired reaction.

---

# 33. DEMO VIDEO

Maximum duration:

**3 minutes.**

Do not waste time explaining the entire architecture verbally.

The video should be cinematic and extremely visual.

## 0:00–0:15 — THE PROBLEM

Black/dark screen.

Text:

> “AQI tells us how polluted the air is.”

Then:

> “But it doesn't tell us where that pollution is moving from.”

Immediately transition to the BreatheAhead map.

---

## 0:15–0:35 — SOURCE

Zoom into northern India.

Fire hotspots appear.

Voiceover:

> “BreatheAhead starts with detected emission sources and meteorological conditions.”

Show the source clusters.

---

## 0:35–1:00 — TRANSPORT

Turn on wind visualization.

Animate wind.

Then activate plume simulation.

Voiceover:

> “We combine source detections with wind fields to estimate how smoke can be transported over time.”

Move timeline:

`NOW → +3H → +6H → +9H`

Show plume moving.

This should be the main visual wow moment.

---

## 1:00–1:25 — FORECAST

Select NCR.

Show:

**Potential smoke influence**

**Estimated transport window**

Show the timeline and affected region.

Voiceover:

> “Instead of showing only the pollution level at a monitoring station, BreatheAhead gives a spatial view of the potential transport pathway and its timing.”

---

## 1:25–1:55 — REPLAY

Click:

**REPLAY**

Choose historical event.

Play the event.

Show:

SOURCE
→
WIND
→
PLUME
→
OBSERVATION

Voiceover:

> “We can also replay historical events and compare the modeled transport with ground observations.”

This establishes that the system is more than a pretty animation.

---

## 1:55–2:15 — AWS

Briefly show architecture.

Animated flow:

FIRMS
↓
AWS Lambda
↓
S3
↓
Transport Engine
↓
API Gateway
↓
BreatheAhead

Then show AWS Console briefly.

Voiceover:

> “The data pipeline runs on AWS, with scheduled ingestion, processing, storage and API delivery.”

Do NOT spend 30 seconds showing the AWS console.

The judges care about the product, not screenshots of configuration pages.

---

## 2:15–2:35 — AI

Show:

**Explain Event**

Bedrock generates a short explanation from structured model results.

Voiceover:

> “Generative AI explains the modeled event, but the underlying transport calculation remains deterministic and data-driven.”

This is important.

---

## 2:35–2:50 — WHY IT MATTERS

Show the complete map.

Text:

> **SOURCE → TRANSPORT → EXPOSURE**

Then:

> “From knowing the air is polluted to understanding where that pollution may be coming from and where it may move next.”

---

## 2:50–3:00 — END

BreatheAhead logo.

Text:

# SEE POLLUTION MOVE.

Small footer:

**Built on AWS**

Then end.

---

# 34. DEMO VIDEO STYLE

Do NOT make the demo:

* a screen recording with mouse movements everywhere
* a developer explaining code
* a long PowerPoint presentation
* a talking-head video
* a generic feature tour

Use:

* clean screen recording
* deliberate cursor movement
* zoomed map interactions
* smooth transitions
* short voiceover
* readable captions
* background music at low volume if appropriate

The visual simulation should carry the story.

---

# 35. JUDGE STORY

The entire pitch should communicate five things:

### PROBLEM

AQI tells us what pollution is.

### GAP

It does not explain the spatial transport story.

### SOLUTION

BreatheAhead connects sources, wind, transport and observations.

### TECHNOLOGY

Real environmental data + transport simulation + AWS data pipeline.

### IMPACT

People and organizations can understand pollution events spatially and temporally rather than seeing isolated AQI numbers.

Do not claim that BreatheAhead can eliminate pollution.

It provides **better environmental situational awareness**.

---

# 36. TECHNICAL CREDIBILITY

The repository should contain a clear README with:

## Architecture

A diagram showing:

Data sources
→ ingestion
→ processing
→ simulation
→ API
→ frontend

## Methodology

Explain the simplified transport model.

## Data

Document every external data source.

## AWS

Clearly identify which components actually run on AWS.

## Limitations

Explicitly state:

* simplified atmospheric transport
* not a full atmospheric chemistry model
* transport estimates depend on meteorological data quality
* source detection does not automatically imply causation
* modeled influence is not equivalent to measured AQI

This makes the project look much more serious.

---

# 37. WHAT NOT TO FAKE

Never fabricate:

* fire detections
* AQI measurements
* weather values
* prediction accuracy
* model confidence
* AWS usage
* API responses
* historical events
* scientific validation

If an external API is unreliable during the demo, use a clearly labeled cached dataset captured during development.

Label it:

**Replay dataset**

Do not pretend cached data is live.

---

# 38. FALLBACK DEMO MODE

The application should have a hidden or clearly labeled demo/replay dataset so the final video does not depend on an API being available at recording time.

The core visual pipeline should therefore support:

### LIVE DATA

and

### HISTORICAL / DEMO DATA

The demo dataset should contain enough data to make the animation smooth.

---

# 39. DEVELOPMENT STRATEGY

Do not spend the first day polishing cards.

First prove:

**fire points → wind → particles → moving plume**

If that works convincingly, the core idea works.

Then add:

* timeline
* map styling
* replay
* monitoring comparison
* AWS backend
* AI explanation
* polish

The simulation is the project.

The UI is the presentation layer around it.

---

# 40. FINAL PRODUCT FEEL

When someone opens BreatheAhead, it should NOT feel like:

> “Another environmental dashboard.”

It should feel like:

> **“An environmental intelligence system showing pollution as a moving phenomenon.”**

The visual narrative should always be:

**Where did it start?**

↓

**Which way is the atmosphere moving it?**

↓

**Where could it go?**

↓

**When could it arrive?**

↓

**What did observations actually show?**

That is BreatheAhead.

---

# 41. FINAL BUILD PRINCIPLE

The hackathon explicitly values solving a small problem well rather than solving a huge problem vaguely.

Therefore, do not attempt to build:

“An AI system that predicts India's entire air pollution.”

Build:

> **A focused system that reconstructs and forecasts the transport pathway of pollution-source events using real source and meteorological data.**

A polished, working source → transport → exposure simulation with credible data and AWS infrastructure is substantially stronger than a huge application full of disconnected features.

---

# 42. CODING AGENT INSTRUCTIONS

As the implementation agent:

1. Prioritize a working end-to-end vertical slice.
2. Never fabricate environmental data.
3. Keep modeled values explicitly separate from observations.
4. Do not claim scientific accuracy that has not been demonstrated.
5. Keep the UI visually premium but functional.
6. Make the map the primary visual element.
7. Make the source → wind → plume animation extremely polished.
8. Make the timeline interaction smooth.
9. Make replay a first-class feature.
10. Use AWS for real backend/data-processing functionality.
11. Keep the architecture simple enough to finish during the hackathon.
12. Avoid unnecessary authentication and product infrastructure.
13. Avoid generic AI-chat functionality.
14. Use Bedrock only where it adds genuine explanatory value.
15. Make the final application demoable without relying on an external API being available at the exact moment of judging.
16. Keep all hackathon-created work inside the new project/repository and comply with the event's rules regarding project start date and external code.
17. Build toward the 3-minute demo from the beginning.
18. Every feature should answer one of these questions:

**SOURCE?**

**DIRECTION?**

**MOVEMENT?**

**TIMING?**

**OBSERVATION?**

If a feature does not improve one of these, it is probably not worth building for this hackathon.

---

# THE FINAL PRODUCT IN ONE SCREEN

A judge should be able to look at the screen and immediately see:

**47 SOURCE DETECTIONS**

🔥 🔥 🔥

↓ prevailing wind

🌫️🌫️🌫️ → → → →

**SIMULATED TRANSPORT**

↓

**NCR**

**ESTIMATED INFLUENCE WINDOW**
`+7h – +10h`

Bottom:

`NOW ━━━●━━━━━━━━ +24H`

And the top navigation:

**LIVE | FORECAST | REPLAY**

That is the BreatheAhead experience.
