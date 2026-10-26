# Presentation template design research

Research date: 26 October 2026. Scope: first-party presentation guidance and reference libraries, translated into an original collection of 30 editable Lipat deck templates. This document is a design brief; it does not claim that a template has shipped or passed rendering checks.

## What the references support

- **Readability before ornament.** Microsoft recommends simple fonts, short text, restrained backgrounds, high foreground/background contrast, and legible chart labels. Its general presentation guidance advises avoiding text smaller than 18 pt. These are useful lower bounds, rather than a reason to pack a slide with 18 pt copy. [Microsoft Support: effective presentations](https://support.microsoft.com/en-us/powerpoint/tips-for-creating-and-delivering-an-effective-presentation).
- **A deliberate visual hierarchy.** Microsoft's current design guide favors one message per slide, intentional empty space, a small font system, and chart colors that focus attention. It distinguishes comparisons, trends, and proportions when choosing charts. Its title-slide examples and linked gallery provide composition references rather than assets to redistribute. [Microsoft: PowerPoint design ideas](https://powerpoint.cloud.microsoft/create/en/blog/powerpoint-design-ideas/).
- **Spacing expresses meaning.** Canva explains how negative space can establish groups, focus attention, and improve legibility; the space can have any background color. Lipat should therefore preserve intentional gaps, including on dark templates. [Canva: how to design with white space](https://www.canva.com/learn/white-space-design/).
- **Consistency need not mean sameness.** Garr Reynolds describes contrast, repetition, alignment, and proximity as practical visual design foundations. Use a repeated baseline and a recognizable motif within a deck, while varying composition to suit the content. [Presentation Zen: design fundamentals](https://presentationzen.com/blog/design-fundamentals-contrast-repetition-alignment-proximity).
- **Visual and narrative contrast work together.** Duarte discusses contrast in slide appearance, story, and delivery. For this collection, contrasting a quiet evidence slide with a bold statement slide creates a useful rhythm; decorative motion is not a substitute for that structure. [Duarte: guide to contrast](https://www.duarte.com/blog/ultimate-guide-to-contrast/).
- **Templates are organized around a task.** Microsoft's gallery distinguishes proposals, planning, pitches, training, and teaching. A useful catalog should express these jobs in its metadata and slide sequence, rather than provide thirty interchangeable color themes. [Microsoft: presentation templates](https://powerpoint.cloud.microsoft/create/en/templates/).
- **Pitch structure starts with clarity.** Sequoia's guide moves from company purpose and customer problem through solution, timing, market, alternatives, business model, people, financials, and vision. The venture template below compresses this into a six-slide starter, with speaker notes for the details. It is not a reproduction of a Sequoia deck. [Sequoia: writing a business plan](https://articles.sequoiacap.com/writing-a-business-plan).
- **Teaching requires accessible grouping.** Monash recommends consistent uncluttered layouts, left-aligned text, useful spacing, and contrast of at least 4.5:1 for normal text or 3:1 for large text. Its guidance also considers viewing on smaller screens. [Monash: create presentation slides for teaching](https://www.monash.edu/learning-teaching/teachhq/Teaching-practices/using-multimedia/how-to/powerpoint-slides).

## Reference-to-design interpretation

The sources above support the principles. The following dimensions, palette choices, narrative sequences, names, and compositions are original design decisions for Lipat. They are not claimed to be the sources' exact recipes.

The target is an editable **six-slide starter deck**, not six pictures of slides. Every template needs a useful cover, at least four distinct interior compositions, an evidence graphic where appropriate, an actionable ending, and plausible labeled example content. Charts should retain editable data; SVG should supply original motifs and diagrams while important labels remain editable text. Template selection must expose the use case and included slide roles.

Use a 1280 × 720 logical canvas, a 64 px safe margin, a 12-column alignment grid, 24–32 px between related groups, and at least 40 px between independent groups. At this canvas scale, start with 56–72 px cover titles, 38–48 px slide titles, 24–28 px body text, and 18–20 px supporting labels. These are initial authoring values, not assumptions about the exact point conversion used by the exporter. Validate the rendered PPTX at its actual export dimensions. Never make overflowing text fit by shrinking it below a readable threshold.

Use Arial for a portable sans-serif baseline; Georgia may provide the editorial heading voice and Courier New may provide technical notation. These names do not guarantee installation on every platform. Avoid making a composition depend on a proprietary or remotely downloaded font; test with Lipat's deterministic metrics and normal browser fallbacks. A dark palette needs a near-white text color and a readable muted label color; accents are not automatically valid body text colors.

Use source titles or one-sentence claims rather than generic “Overview” headings. Keep three or fewer ideas in an overview, five or fewer items in a process, and generally one chart per slide. Directly label the unit, period, and important values. Use zero baselines for quantitative bars; label illustrative sample data and do not imply forecasts are observed results. Do not encode status only through red and green. An SVG motif should reinforce the story, not compete with it.

## Thirty original template briefs

Each palette lists background / principal ink / accent / secondary accent. Each narrative contains six slides. The identifiers are suggested stable API/catalog IDs.

### 01. Venture Signal — `venture-signal`

**Audience and task:** early-stage founders pitching investors. **Palette:** `#101A2D` / `#F4F7FC` / `#A3E635` / `#64C7E8`. **Type and composition:** bold Arial, oversized numerals, asymmetric 7:5 splits; a thin original orbital SVG motif introduces momentum without imitating a technology brand.

**Narrative:** purpose → customer friction → product solution → market and traction → business model and team → funding ask and milestones. Use a native line chart for illustrative traction and a simple native bar comparison for the opportunity. **Rules:** one sentence defines the company; isolate the ask in a large panel; separate actual and target values; the dark cover and final slide bracket four spacious evidence slides. Narrative inspiration: [Sequoia's pitch guide](https://articles.sequoiacap.com/writing-a-business-plan).

### 02. Boardroom Brief — `boardroom-brief`

**Audience and task:** executives seeking a board decision. **Palette:** `#F3F1EB` / `#17213A` / `#B58B3D` / `#527780`. **Type and composition:** Georgia statement headings with Arial evidence, quiet horizontal rules, wide margins, and a narrow decision rail.

**Narrative:** requested decision → three executive signals → performance against plan → options and trade-offs → risks and mitigations → approval and accountable owner. A restrained column chart compares plan with actuals. **Rules:** name the decision on the cover; give the recommendation more space than alternatives; show one status word alongside every status color; keep sources in a consistent footer and detailed caveats in notes.

### 03. Revenue Pulse — `revenue-pulse`

**Audience and task:** commercial teams running a quarterly business review. **Palette:** `#F5F8FF` / `#14224D` / `#2F63D8` / `#12A89A`. **Type and composition:** Arial, tabular-looking metric alignment, a prominent period label, white chart panels on a pale field.

**Narrative:** quarter in one sentence → three key metrics → revenue trend → segment comparison → drivers and interventions → next-quarter commitments. Combine a line chart with a separate horizontal-bar segment slide. **Rules:** include units and comparable periods; give the key metric at least twice the visual weight of its caption; align decimal precision; use an insight title rather than “Revenue chart”; avoid dashboard density.

### 04. Product Horizon — `product-horizon`

**Audience and task:** product leaders aligning a roadmap. **Palette:** `#F5F3FF` / `#272044` / `#7556D8` / `#F0B54A`. **Type and composition:** Arial, broad time lanes, rounded feature blocks, an original SVG horizon arc.

**Narrative:** product promise → user insight → experience principles → now/next/later roadmap → adoption evidence → decisions and dependencies. Use a line chart for adoption and editable shape lanes for the roadmap. **Rules:** distinguish committed work from exploration with words and strokes; limit the roadmap to three lanes and three horizons; give each initiative an outcome, not a feature list; use the arc only on the cover and conclusion.

### 05. Launch Studio — `launch-studio`

**Audience and task:** product marketing introducing a new offer. **Palette:** `#15141A` / `#FFF8F0` / `#FF7759` / `#C2AEFA`. **Type and composition:** oversized Arial, cropped original abstract SVG product silhouettes, high-contrast typographic spreads.

**Narrative:** launch promise → customer tension → hero offer → three differentiators → rollout and launch channels → try/buy/contact action. A native bar chart can show clearly labeled illustrative benefit comparisons. **Rules:** reserve the largest type for the benefit; present one hero object per slide; distinguish sample benefit values from measured claims; keep feature descriptions short; final action must be usable after content replacement.

### 06. Strategy Compass — `strategy-compass`

**Audience and task:** leadership teams setting annual direction. **Palette:** `#F8F6EF` / `#1E3B35` / `#347965` / `#D79A39`. **Type and composition:** Arial, large directional statements, a labeled original compass SVG, stable left alignment.

**Narrative:** destination → external context → strategic choices → three priorities → success measures → first ninety days. Use a column chart for baseline versus target and an editable three-step activation plan. **Rules:** make choices explicitly exclusive where relevant; include an owner and measurable result for each priority; keep the compass a navigational metaphor rather than a fake data visualization; the ending names the immediate next action.

### 07. Client Proposal — `client-proposal`

**Audience and task:** professional services teams winning a project. **Palette:** `#FCFAF5` / `#233540` / `#B86B45` / `#7E9B94`. **Type and composition:** Georgia headings, Arial body, editorial sidebars, staggered section numerals, fine dividers.

**Narrative:** desired client outcome → what we heard → proposed approach → work plan → commercial options → agreement and start date. Use an editable timeline and a clear three-option comparison rather than a decorative revenue chart. **Rules:** separate scope from exclusions; highlight a recommended option with a label; costs carry currency and tax assumptions; no placeholder testimonial should resemble a real endorsement.

### 08. Campaign Spectrum — `campaign-spectrum`

**Audience and task:** marketers presenting a cross-channel campaign. **Palette:** `#FFF4EF` / `#341D34` / `#E85D75` / `#F4B63F`. **Type and composition:** Arial, bold blocks, a large audience quote, original overlapping color-band SVGs confined to margins.

**Narrative:** campaign idea → audience tension → creative system → channel sequence → measurement plan → launch checklist. Use a native bar chart to show illustrative channel allocation. **Rules:** repeat one campaign line consistently; isolate message, channel, and metric roles; keep sample audience quotations visibly fictional; use color bands to distinguish phases, never as text backgrounds with inadequate contrast.

### 09. Brand Manifesto — `brand-manifesto`

**Audience and task:** founders and designers introducing a brand system. **Palette:** `#F4EDE3` / `#2D2926` / `#C64A31` / `#315C56`. **Type and composition:** Georgia statement type, Arial captions, dramatic short-text slides, editorial specimen blocks.

**Narrative:** belief → audience promise → personality → visual language → voice in practice → consistent application. Show editable color swatches, type hierarchy, and a before/after message example. **Rules:** no chart merely to satisfy a checklist; use actual editable typography rather than letters baked into SVG; no more than two type families; palette swatches have hex labels; distinguish the brand's primary voice from example copy.

### 10. Research Lens — `research-lens`

**Audience and task:** researchers communicating customer findings. **Palette:** `#FAF8F1` / `#20332C` / `#557C5A` / `#D5AA58`. **Type and composition:** Arial, research labels, offset quote panels, original magnification-ring SVG in section openers.

**Narrative:** research question → method and sample → finding one → finding two → opportunity map → recommended experiments. Use a bar chart with clear sample size and an editable quote block. **Rules:** identify illustrative participants; keep observation separate from interpretation; include uncertainty where meaningful; avoid percentages for tiny samples without raw counts; make the recommendation traceable to findings.

### 11. Academic Defense — `academic-defense`

**Audience and task:** graduate students defending a thesis. **Palette:** `#FFFFFF` / `#172A50` / `#336EA8` / `#8A6B40`. **Type and composition:** Georgia headings, Arial body, numbered figures, thin rules, generous figure space.

**Narrative:** central thesis → research gap → method → primary result → interpretation and limitations → contribution and questions. Use a native line or bar chart with labeled axes and sample-data attribution. **Rules:** central claim is readable without the talk; notation stays editable; never invent statistical significance; preserve figure numbering and concise source text; limitations receive a real slide area rather than unreadable footnotes.

### 12. Lesson Spark — `lesson-spark`

**Audience and task:** teachers delivering a short classroom lesson. **Palette:** `#FFF9E9` / `#213B4A` / `#E7A22A` / `#3A8F9B`. **Type and composition:** Arial, large numbered steps, simple original geometric SVG illustrations, varied question and example layouts.

**Narrative:** opening question → learning goal → explain the idea → worked example → quick practice → recap and next step. A tiny column chart may support a numeracy example, but only if it suits the lesson. **Rules:** one learning objective; body text stays large; label diagrams in editable text; include an answer in notes; avoid requiring animation to understand the lesson. Accessibility reference: [Monash teaching slide guidance](https://www.monash.edu/learning-teaching/teachhq/Teaching-practices/using-multimedia/how-to/powerpoint-slides).

### 13. Workshop Canvas — `workshop-canvas`

**Audience and task:** facilitators running a practical team session. **Palette:** `#F6F1FF` / `#342945` / `#8A58BD` / `#E99645`. **Type and composition:** Arial, editable sticky-note-like rectangles, clear time badges, a wide working area.

**Narrative:** desired outcome → agenda and norms → individual prompt → group exercise → prioritize and decide → commitments and follow-up. Use an editable two-axis prioritization diagram with explicitly qualitative axes. **Rules:** write one executable instruction per activity; timeboxes are visible; limit notes to a few words; distinguish instructions from example answers; whitespace is intentional space for participant contribution.

### 14. Onboarding Path — `onboarding-path`

**Audience and task:** people teams welcoming new employees. **Palette:** `#EFF8F5` / `#183E36` / `#28836D` / `#D8A33B`. **Type and composition:** Arial, friendly path SVG, alternating text-and-checklist compositions, open rounded panels.

**Narrative:** welcome and purpose → how we work → first-week essentials → people and support → first-month plan → where to ask for help. Use an editable day/week timeline rather than fake performance statistics. **Rules:** links and contacts are clearly marked sample values; every action has a place to start; use role labels instead of fictional employee endorsements; make mandatory steps visibly distinct from optional reading.

### 15. Clinical Evidence — `clinical-evidence`

**Audience and task:** clinical teams presenting a study or service evaluation. **Palette:** `#F7FBFD` / `#17384A` / `#207E9B` / `#76639C`. **Type and composition:** Arial, ample white space, structured evidence bands, original molecular/network SVG limited to the cover.

**Narrative:** clinical question → study population and method → primary result → safety and limitations → implications for practice → next validation step. Use clearly labeled illustrative series and native charts. **Rules:** no implied medical recommendation from sample data; expose denominator and units; distinguish absolute from relative changes; avoid red/green-only coding; do not invent confidence intervals or trial endorsements.

### 16. Public Health — `public-health`

**Audience and task:** public health communicators explaining an intervention. **Palette:** `#FFF9EF` / `#263A43` / `#D87537` / `#2F8B8B`. **Type and composition:** Arial, inclusive original human/household SVG symbols, large action-oriented headings, clear comparison blocks.

**Narrative:** community need → who is affected → intervention → access and delivery → progress measures → how to participate. Use a direct-labeled bar chart for illustrative coverage. **Rules:** sample statistics are explicit; no invented geographic authority; replace abstract policy language with actions; show contact placeholders honestly; avoid decorative maps that could imply unsupported regional data.

### 17. Climate Ledger — `climate-ledger`

**Audience and task:** sustainability teams reporting an environmental plan. **Palette:** `#F1F4E9` / `#233D30` / `#5D7C41` / `#C08F3C`. **Type and composition:** Georgia headings, Arial evidence, original contour-line SVG, calm full-width data plots.

**Narrative:** environmental commitment → baseline and boundary → emissions profile → reduction levers → milestones and investment → accountability and next report. Use native bar charts and an editable milestone diagram. **Rules:** show reporting year, unit, and organizational boundary; separate reduction from offsetting; label forecasts; no unsupported “carbon neutral” claim; contour artwork never masquerades as geographic measurements.

### 18. Nonprofit Impact — `nonprofit-impact`

**Audience and task:** nonprofits updating donors and recruiting support. **Palette:** `#FFF5EC` / `#49342B` / `#CA704B` / `#557F6C`. **Type and composition:** Georgia human-story headings, Arial facts, large quote blocks and warm original leaf/hand abstract SVG.

**Narrative:** mission and person-centered story → need → program approach → outcomes → responsible use of funds → next contribution. Use native columns for outputs and a simple native doughnut only for a few budget categories. **Rules:** distinguish outputs from outcomes; example stories cannot impersonate beneficiaries; include the time period and limitations; the ask connects a contribution with a concrete activity without inventing guaranteed impact.

### 19. Civic Plan — `civic-plan`

**Audience and task:** public agencies explaining a local initiative. **Palette:** `#F4F6F7` / `#213C58` / `#2D7296` / `#B98B43`. **Type and composition:** Arial, orderly public-information grid, original abstract street-grid SVG, accessible phase labels.

**Narrative:** public outcome → current challenge → proposed service → implementation phases → budget and measures → consultation and decision date. Use native budget bars and an editable phased timeline. **Rules:** do not invent jurisdictional seals; abstract map artwork is labeled illustrative; dates and public-response routes are replaceable; separate an approved commitment from a consultation proposal; full words accompany status markers.

### 20. Architecture Atelier — `architecture-atelier`

**Audience and task:** architects presenting a concept design. **Palette:** `#F0EDE6` / `#302D28` / `#A56E4D` / `#7B8E88`. **Type and composition:** Georgia headings, Arial technical labels, fine original SVG line drawings, offset plan-and-caption layouts.

**Narrative:** design proposition → site and constraints → spatial concept → material language → performance priorities → next design stage. Use a native bar chart only for meaningful area or performance comparisons. **Rules:** no borrowed architectural renders; label schematic drawings as non-scaled; keep line weights legible at thumbnail size; avoid tiny plan annotations; sample costs do not read as estimates for a real property.

### 21. Property Portfolio — `property-portfolio`

**Audience and task:** real estate teams presenting an asset opportunity. **Palette:** `#F8F3EA` / `#223E3B` / `#A77E49` / `#6D9491`. **Type and composition:** Georgia titles, Arial facts, large property-geometry SVG, strong fact-sheet sidebars.

**Narrative:** property proposition → location and context → asset facts → commercial performance → improvement plan → next diligence step. Use native occupancy/revenue comparisons and editable fact panels. **Rules:** no implied valuation or guaranteed return; units and periods are explicit; use schematic rather than invented photographic evidence; separate actual rent, model assumptions, and target; foreground diligence needs.

### 22. Hospitality Journey — `hospitality-journey`

**Audience and task:** hospitality brands selling a guest experience. **Palette:** `#FBF3E6` / `#263D3E` / `#BF8258` / `#5F9C9B`. **Type and composition:** Georgia display headings, Arial captions, original sun/wave SVG, expansive horizontal bands.

**Narrative:** destination promise → guest profile → arrival-to-departure journey → signature experiences → package comparison → booking or partnership action. Use an editable journey diagram and simple package comparison. **Rules:** no stock imagery required for a complete preview; suggested itineraries remain editable; package inclusions and exclusions are distinct; keep geographic references generic unless verified; avoid unreadable text on a decorative scene.

### 23. Culinary Story — `culinary-story`

**Audience and task:** food businesses introducing a restaurant or product concept. **Palette:** `#FFF3DC` / `#472F25` / `#C76538` / `#6A8353`. **Type and composition:** Georgia editorial type, Arial menu labels, original ingredient line art, alternating recipe-card and statement layouts.

**Narrative:** concept and flavor promise → audience and occasion → signature offering → sourcing and craft → service/business model → tasting or collaboration action. A native column chart can illustrate an explicitly sample sales mix. **Rules:** menu prices carry currency; do not imply dietary/allergen guarantees; ingredients remain readable text; artwork is original and secondary; avoid filling slides with decorative food icons.

### 24. Retail Season — `retail-season`

**Audience and task:** retail teams planning a seasonal collection. **Palette:** `#F9F1F0` / `#382C38` / `#B74A6B` / `#B19864`. **Type and composition:** bold Arial, oversized season numerals, original geometric product silhouettes, staggered merchandising panels.

**Narrative:** season thesis → customer signals → assortment story → channel activation → inventory and sales targets → readiness decisions. Use native comparison bars and a clean editable activation timeline. **Rules:** differentiate units, revenue, and margin; label illustrative demand values; max three assortment groups per slide; avoid implying actual branded products; use one hero silhouette rather than a collage of weak placeholders.

### 25. Supply Chain — `supply-chain`

**Audience and task:** operations leaders explaining a resilience plan. **Palette:** `#F3F5F5` / `#253C47` / `#287E89` / `#D69A36`. **Type and composition:** Arial, orderly process rails, original node-and-route SVG, wide exception panels.

**Narrative:** operating objective → current network → service and cost baseline → bottlenecks and risks → improvement sequence → owner and review cadence. Use a native line chart for lead-time trend and an editable four-stage process. **Rules:** label average versus percentile statistics; no unnecessary world map; use actual stage names; show a status word on risks; isolate the operational decision from supporting detail.

### 26. Finance Outlook — `finance-outlook`

**Audience and task:** finance teams communicating a forecast. **Palette:** `#F8F8F4` / `#223148` / `#456F9B` / `#A2854B`. **Type and composition:** Arial, large well-aligned figures, restrained rules, a contrasting assumptions column.

**Narrative:** outlook statement → historical performance → forecast drivers → scenario comparison → cash and investment priorities → decisions and assumptions. Use separate native line and column chart slides. **Rules:** actual and forecast periods are labeled distinctly; show currency and scale; specify scenario assumptions; no invented investment advice; prevent the pale accent from being the only cue to a series or variance.

### 27. Security Brief — `security-brief`

**Audience and task:** security leaders giving a risk update. **Palette:** `#111C2A` / `#F1F5FA` / `#4BC3CE` / `#E3AC53`. **Type and composition:** Arial headings, Courier New identifiers, original shield/grid SVG, sharply separated recommendation and evidence zones.

**Narrative:** risk posture → relevant threat model → control coverage → exposure trend → remediation priorities → required decision. Use native bars for explicitly illustrative control coverage. **Rules:** no fabricated incident attribution; label sample exposure counts; distinguish severity from confidence; include owner and due date; shield artwork is a motif rather than a certification badge; keep technical identifiers selectable.

### 28. Developer Keynote — `developer-keynote`

**Audience and task:** engineers introducing a platform or API. **Palette:** `#151626` / `#F3F3FF` / `#A899FF` / `#6BD6BB`. **Type and composition:** Arial headings, Courier New code, bold short statements, original connected-node SVG.

**Narrative:** developer problem → conceptual model → smallest working example → architecture and boundaries → measured or illustrative performance → try the next step. Use an editable code example and architecture diagram; a native bar chart may compare labeled sample latency. **Rules:** the example is complete enough to understand; code has room to breathe; do not claim unmeasured speed; name API boundaries; no meaningful text embedded inside the diagram SVG.

### 29. Creative Portfolio — `creative-portfolio`

**Audience and task:** independent designers and studios showcasing work. **Palette:** `#F7EEE7` / `#2D2630` / `#D45D4A` / `#7A62A8`. **Type and composition:** Georgia display type, Arial metadata, large project numerals, original abstract art blocks, uneven but aligned editorial splits.

**Narrative:** practice and point of view → selected case context → exploration → final system → outcome and learning → collaboration invitation. Use editable artifact panels and a process strip rather than an irrelevant chart. **Rules:** fictional work is identified as illustrative; sample outcomes do not impersonate client results; preserve one focal piece per slide; use the same caption position; let the work carry the visual variety.

### 30. Event Program — `event-program`

**Audience and task:** conference and community organizers introducing an event. **Palette:** `#FFF5E8` / `#2D2350` / `#7A4CCB` / `#E99B37`. **Type and composition:** bold Arial, huge date numerals, original concentric-stage SVG, timetable bands and speaker role panels.

**Narrative:** event promise → who should attend → program highlights → agenda → participation and access → register or join. Use an editable agenda and clear access-information block. **Rules:** do not invent speaker endorsements; keep a visible timezone; distinguish doors/opening/session times; sample contact and registration fields are replaceable; decorative stage rings never sit behind dense agenda text.

## Implementation and visual acceptance checklist

These are proposed quality gates for the implementation, not evidence that they have already passed.

1. **Catalog completeness:** exactly 30 unique stable IDs; each has a name, use case/domain, description, palette, six nonempty slides, and useful editable sample content. The gallery must make the domain and narrative apparent before opening a deck.
2. **Composition diversity:** render all 180 slides in a contact sheet. Verify that templates vary in type voice, cover composition, body layouts, chart/diagram roles, and narrative. Recoloring one generic six-slide layout thirty times is insufficient.
3. **Useful editing:** instantiate at least one deck from each template through the public API, update ordinary text and chart data, and compile/export it. Avoid rasterized slide backgrounds containing the entire design. Original SVG should remain a separate embedded asset with alternative text.
4. **Measured layout:** compile every deck with the standard font configuration; inspect structured diagnostics. No unexplained clipping, outside-slide nodes, chart label collisions, or body text hidden behind artwork. Replace sample text with slightly longer realistic headings to expose brittle compositions.
5. **Visual review:** inspect at normal presentation size and thumbnail size; verify titles dominate, captions remain legible, margins align, visual rhythm is deliberate, and each slide has one focal point. Check every palette's actual text/background pairings; palette hexes alone are not contrast evidence.
6. **Chart correctness:** native data matches the preview and exported PPTX; units, categories, legends, zero baseline for quantitative bars, and actual/forecast boundaries remain meaningful. Do not rasterize native charts just to match a browser screenshot.
7. **SVG portability:** original embedded SVGs display in browser and supported native renderers, survive PPTX export/reparse, contain no scripts/external resources, and have a tested fallback for consumers that cannot display SVG. Asset reuse should not make edits to one deck mutate another.
8. **Offline completeness:** shipped templates must render without remote fonts, image services, or network fetches. Embedded shapes and SVG should provide a complete design; hosts may replace optional hero artwork with properly licensed images.
9. **Documentation and playground:** document listing, instantiation, text/data replacement, SVG use, chart use, export behavior and limits; add a gallery and at least one end-to-end chart/SVG sample. Examples must use the released public API.
10. **Honest sample content:** fabricated metrics, people, testimonials, property details, and clinical values must be visibly illustrative, with no implied certification or real-world endorsement. Do not embed third-party logos, source screenshots, copyrighted template artwork, or external proprietary fonts.

## Source and asset policy

All references were visited through their publishers' own sites during this research. The references guide principles and content structure; they do not license copying a template or illustration. Implement original compositions, original simple SVG artwork, editable chart data, and portable text. No proprietary template files or source screenshots are required to ship the collection. User-provided imagery can be inserted later through Lipat's normal image flow with the host's resource policy.
