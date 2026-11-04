# Specification — Hotel bookings dashboard (Delivery 1)

## Goal

To create a repository that explains the intentions and the process of building a high-quality, two-screen dashboard about hotel bookings, following the good practices of the Presentation and Visualization course and adapted for people with disabilities. The process and the decisions are as important as the final dashboard (the brief says so), and every group member must be able to explain all of it in an interview.

## Context

- Course: Presentation and Visualization (Data Science master)
- Group 3. Written in English.
- AI use is allowed only if it is acknowledged clearly (where and how) and the students can answer questions about every decision. Deliveries using AI are subject to an interview.
- Reference documents: `Delivery1-Dashboard-2627.pdf` (the brief) and the course PDFs in `Course information/`. The five Vega-Altair skills in `Claude instructions/skills/` (from the course repository) are binding for Part 6, and the DRACO and WCAG ones also guide Parts 4 and 5.
- If documents disagree, the order is: the brief, then `spec.md` and `architecture.md`, then the course PDFs, then the skills. Conflicts already settled are in the "Skills" section of `architecture.md`; for any new one, ask.

## Dataset

- `Course information/hotel_bookings_dataset.csv` (identical to the file inside `archive.zip`). 119,390 rows, 32 columns. Two hotels (a city hotel and a resort hotel) and bookings arriving between July 2015 and August 2017. Never modify the raw file.
- Source to cite in `ACKNOWLEDGMENTS.md`: Antonio, Almeida and Nunes, "Hotel booking demand datasets", Data in Brief, 2019. Verify the exact reference before citing it.
- Things already seen in the file that Part 1 must investigate, not assume: the text `NULL` in `agent` and `company`; missing `country` (488) and `children` (4); one negative and one very large `adr` (5,400); bookings with 0 adults; the meal value `Undefined`; about 32,000 fully duplicated rows; `reservation_status` repeating `is_canceled` (careful: using it to explain cancellations is circular); `reservation_status_date` starting before the first arrival. There is no update frequency: it is a historical snapshot.

## What is already decided

- Dataset: the hotel bookings above.
- Tools: Python (`pandas` only for data processing) for analysis, and Vega-Altair for the charts of the final dashboard. The dashboard pages are plain HTML, CSS and JavaScript around those charts, built from a Jupyter notebook, because the accessibility skill requires it. All code is in notebooks.
- Dashboard: exactly two screens (two HTML pages). One main screen with global information, one screen with detail on one aspect of the data. It may be static, but Part 5 must still plan interaction and Part 6 should implement it if feasible.
- Accessibility is a requirement, not an extra (see Quality criteria).
- Charts and interactions must be valid under the DRACO rules and feasible in Vega-Altair (selections, tooltips, linked views, dropdowns and legends that filter). If an idea is not, the AI says so in Parts 4 and 5, not in Part 6.
- Design limits that come from the skills, which Parts 2 to 5 must respect: at most 4 KPIs and 2 or 3 charts visible at once on each screen, with extra detail behind an expand button; KPIs at the top and the main chart taking at least 40 % of the screen; filters below or beside the charts, with a reset button always visible and the active filters always shown; a meaningful first state with data already visible; bars start at zero, no 3D, no pie or donut with more than 5 parts; at most 7 categorical colours; plain-language titles, formatted numbers with units, and the data source and date always visible. Fitting 5 to 7 questions into these limits is part of the work of Part 4.

## What the group decides (the AI proposes, the student approves)

For each item the AI gives 2 or 3 options with reasons and a recommendation, then waits for an answer. Every answer goes into `log.md` as a student decision.

- The audience, the platform (only one: tablet or desktop), how often they use the dashboard, the persona, their goal and the scenario of use.
- The goals of the dashboard and the 5 to 7 questions it must answer, written from the user's point of view.
- Which fields and relationships are highlighted, and which aspect gets the detail screen.
- Whether extra data is added (for example a country map or country names) or fields are merged.
- Chart types, encodings, layout, colours and interactions.

The AI never invents the group's own experience. Part 7 (how the group worked, difficulties, surprises) and every "we decided because" must come from the students; the AI only structures what they say.

## What each part must contain

| Part | Weight | Must contain |
|---|---|---|
| 1 EDA | 15 % | For every field: data type (course taxonomy: nominal, ordinal, discrete, continuous, ratio, interval), temporal or geographic nature, range and domain, units, precision needed. Distributions and outliers. Currency of the data and how often it should be updated. Groupings and relationships. Missing data and incoherences. Several exploratory charts, commented. A final decision on which fields and relationships go into the dashboard. |
| 2 Audience | 15 % | Expertise with charts, platform, frequency, a persona, goal and scenario. The goals of the dashboard. 5 to 7 questions from the user's perspective. |
| 3 Reflection | 5 % | Whether more data or merging is needed. Small changes to Part 1. Any new data described in detail. |
| 4 Charts and encoding | 15 % | Chart type and encoding for each question, layout, with perception and Gestalt arguments and accessibility. A low-fidelity prototype of both screens and how it answers each question. Every chart is checked against the DRACO hard rules. |
| 5 Interaction | 15 % | Interaction inside each chart and between charts, each one linked to the course models (Shneiderman's mantra, the manipulation / exploration / problem-solving types) with the reason. |
| 6 Implementation | 30 % | The hi-fi dashboard: two HTML pages and an accessibility help page, built from a Vega-Altair notebook, and the explanation of the implementation decisions. Data, code and screenshots needed to see and rebuild it, and how to open it. The skills' checklists passed, or the gaps listed honestly. |
| 7 Reflections | 5 % | How the tasks were organised, how the process went, whether the theory helped, surprises and difficulties. |

The parts feed each other. Part 1 (bottom-up) and Part 2 (top-down) are done as a loop, so Part 3 may send the work back to Part 1.

## Quality criteria

1. **Traceable.** Each choice cites the course concept behind it; each number comes from executed code.
2. **Course dashboard guidelines** (`06-Dashboards`): clear goal and audience, relevant KPIs with context, simplicity, a focal point, consistency, layout and white space, one screen per dashboard screen, interaction only where it helps.
3. **Perception** (`05`, `05b`): suitable visual channels, pre-attentive highlighting used sparingly, related items placed close together, no judgement that depends on hard magnitude estimation (areas, angles) when a bar would do.
4. **Accessibility** (`01-Introduction`, `05b`, and the whole `wcag-accessibility` skill, WCAG 2.2 AA plus cognitive accessibility), checked one by one in Parts 4 and 6. Course items: title, legend, axis titles, caption, abbreviations explained, data source; safe colours and enough contrast; colour never the only code; legible text; the dashboard resizes; works without depending on one device; customisable where possible. Skill items for Part 6: SVG only; every data point reachable with the arrow keys (and `Alt` + up/down arrows between series), a focus ring drawn as an SVG overlay, and `aria-live` announcements; the selected category and its exact value always visible; each chart in a figure with a short and a long alternative text and a collapsible data table; a skip link; `accessibility.html` linked from both screens; page language declared; usable at 200 % zoom and on a phone; reduced motion respected; fill patterns where colour encodes categories (`pattern-rules`).
5. **Honest.** What was not verified is said so. If unsure about a chart, an Altair or Vega-Lite expression, say so instead of guessing.
6. **Reproducible.** Every notebook runs from the raw data to its output with "Restart and run all" and a fixed seed (`42`).
7. **Acknowledged.** Dataset source, reused or inspiring code (the skills' code patterns count), and each AI use are in `ACKNOWLEDGMENTS.md`.
8. **Skills checklists.** Before Part 6 is done: the DRACO hard-rules checklist (all items), the data-viz pre-publication checklist, the notebook checklist, and the WCAG and cognitive-accessibility checklist, each tested in a browser. Soft preferences are followed, or the reason for not following them is written in the text.

## Out of scope

The storytelling task (10 December), the final exam, other datasets, and putting the dashboard online (it runs from a local folder).

## Open points for the students

- Is the group's GitHub Pages site (`Infovis2627-Group3`) also a place where this delivery is published, or only the zip?
- Is a short advanced draft still wanted for tutoring feedback? (The brief set it 15 days before the deadline.)
- Do `Claude instructions` files go in the zip as proof of AI use, or only `ACKNOWLEDGMENTS.md`?
- How will the professor open the dashboard? The skills load `data.json` through a local server (`python -m http.server`) because browsers block it from `file://`. The alternative, embedding the data in the HTML, breaks a skill rule. Default: follow the skills and explain the command in Part 6.
- Should the Vega libraries come from a CDN (needs internet) or from a local `lib/` copy (works offline)? Default: CDN, unless the student wants it offline.
- The brief lists "jupyter notebook with vega-altair" as a form of delivery; ours is HTML pages built from a notebook. Is that acceptable to the professor?
