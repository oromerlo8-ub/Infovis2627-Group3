# Tasks

One task at a time (see `aiRules.md`). Mark a task `[x]` only when its check passes and the log line is written.
**◆** = the student must decide something before the task can be closed (the AI proposes options, the student chooses).
Text for the parts follows `spec.md` and `architecture.md`.
The final documents of Parts 1 to 5 have at most 500 words (the aim is 250 to 350).

## Phase 0 — Setup
- [x] **0.1** Read all instructions, every file in `skills/`, the brief and the course files for Part 1. Create the folder skeleton, empty `log.md` and `ACKNOWLEDGMENTS.md`. *Check: the tree matches `architecture.md`.*
- [x] **0.2** Load the raw dataset with `pandas`. *Check: 119,390 rows x 32 columns; the raw file is untouched.*
- [x] **0.3** Check the environment: Python, `pandas`, `altair`, `jupyter`, `vl-convert-python`; whether a headless browser (for example Playwright) can be used; whether the Vega libraries can be downloaded for `lib/`. Report what is missing and ask the student before installing anything or changing the plan. *Check: a list of what is available and what is missing.*

## Phase 1 — Part 1: Exploratory Data Analysis
- [x] **1.1** Data dictionary: for each of the 32 fields, type (course taxonomy), temporal / geographic nature, range, domain, units, precision. It is delivered as several images, so that it fits in the PDF, and is also saved as a `.csv` in the notebook's output folder. *Check: all 32 fields covered; the images are readable at their size in the PDF.*
- [x] **1.2** Data quality: missing values, `NULL` placeholders, duplicates, impossible or odd values, overlap between `is_canceled` and `reservation_status`. *Check: every number comes from a notebook and its output.*
- [x] **1.3** Distributions and outliers, with exploratory charts. *Check: each chart has title, axis labels, source and a comment in the text.*
- [x] **1.4** Relationships and groupings between fields (time, hotel, market segment, country, cancellations, price). *Check: each relationship has a chart and a comment.*
- [x] **1.5** Currency and update frequency of the data, and whether it is real or forecast. *Check: stated in the text, with the evidence from the data.*
- [x] **1.6** ◆ Cleaning rules. The AI lists the problems found in 1.2 (duplicates, `NULL` placeholders, missing values, odd values) with options for each, and the student chooses. The cleaning is done only by a plain Python script, `clean_hotel_bookings.py`, in Part 1's `code` folder, run with `python` from the raw file; never by hand and never decided by the AI alone. It saves `data/processed/hotel_bookings_clean.csv` and a log of how many rows each rule changes. *Check: the student approved every rule; the row counts before and after each rule are printed; the raw file is untouched.*
- [x] **1.7** ◆ Fields and relationships proposed for the dashboard. *Check: the student approved the list.*
- [x] **1.8** Write `part1_eda.md` and the `.pdf`. *Check: same text in both; every image referenced; at most 500 words (aim 250–350), not counting the data dictionary images.*

## Phase 2 — Part 2: Audience
- [x] **2.1** ◆ Audience, platform (one only) and frequency of use. *Check: the student chose among the options.*
- [x] **2.2** ◆ Persona, goal and scenario of use. *Check: consistent with 2.1.*
- [x] **2.3** ◆ Goals of the dashboard and 5–7 questions from the user's perspective. *Check: between 5 and 7; each answerable with the dataset.*
- [x] **2.4** Write the Part 2 `.md` and `.pdf`. *Check: same text in both; at most 500 words (aim 250–350).*

## Phase 3 — Part 3: Reflection and adjustment
- [x] **3.1** ◆ Review Parts 1 and 2: is more data or a merge needed? *Check: decision recorded.*
- [x] **3.2** If needed, add or merge data, or change a cleaning rule (by changing the cleaning script and running it again) and describe any new data in detail. *Check: new file in `data/processed/`, loads correctly.*
- [x] **3.3** Write the Part 3 `.md` and `.pdf`, with the small changes to Part 1. *Check: same text in both; at most 500 words (aim 250–350).*

## Phase 4 — Part 4: Chart selection and encoding
- [x] **4.1** ◆ For each of the questions, the function of the chart (Visual Vocabulary) and the chart type. *Check: every question is covered by a chart; every chart passes the DRACO hard rules.*
- [x] **4.2** Encoding, colour and accessibility decisions, with perception and Gestalt reasons. *Check: accessibility list in `spec.md` and the `wcag-accessibility` checklist reviewed item by item; colours and patterns follow the skills.*
- [x] **4.3** ◆ Low-fidelity prototype of both screens (a clean sketch). *Check: each screen respects the limits in `spec.md` (at most 4 KPIs, 2 or 3 charts visible); the student approved the layout.*
- [x] **4.4** Write the Part 4 `.md` and `.pdf`, including how the prototype answers the questions. *Check: same text in both; at most 500 words (aim 250–350).*

## Phase 5 — Part 5: Interaction planning
- [x] **5.1** ◆ Interactions inside each chart and between charts. *Check: each one has trigger, action and reason, is feasible in Altair, and has a keyboard equivalent.*
- [x] **5.2** Link each interaction to the course models. *Check: Shneiderman's mantra and the interaction types are used correctly.*
- [x] **5.3** Update the prototype and write the Part 5 `.md` and `.pdf`. *Check: same text in both; at most 500 words (aim 250–350).*

## Phase 6 — Part 6: Implementation and delivery
Before 6.1, re-read every file in `skills/`. All Part 6 tasks follow them and the decisions in the "Skills" section of `architecture.md`; each task's report says which skill was applied.
- [x] **6.1** ◆ Notebook `build_dashboard.ipynb`: skeleton (title, index, imports, sections as in the notebook skill) and data preparation with `pandas`. The aggregation level is proposed so that the planned interactions still work; the aggregated tables go in `data/processed/`. *Check: runs top to bottom; totals agree with the cleaned data of Part 1.*
- [x] **6.2** Charts of screen 1 in the notebook, with palette, titles, `description` and tooltips. *Check: each chart passes the DRACO hard rules; the numbers equal the pandas results.*
- [x] **6.3** Charts of screen 2. *Check: same as 6.2.*
- [x] **6.4** Export `data.js` and `specs.js` and build `index.html` and `detail.html`: layout (KPIs, main chart, secondary charts, filters, reset button, active filters, source and date), `lang="en"`, skip link, headings, local `lib/` copies of the libraries (downloaded once; if they cannot be downloaded, ask the student). *Check: both pages open by double-click, with no server and no internet, and show data at first load.*
- [x] **6.5** The interactions planned in Part 5 (selections, tooltips, linked views, filters, expand button). *Check: each one works in the browser and its changes are announced.*
- [x] **6.6** Keyboard and focus layer from `wcag-accessibility`: keyboard navigation of the data points (and between series with `Alt` + arrows), focus overlay, `aria-live` announcements, selected category and value always visible, skip link, visible focus on every control, reduced motion. *Check: tested in a browser with the keyboard only; the Operability items of the WCAG checklist are reviewed; any item not met is listed.*
- [x] **6.7** Alternative texts and help: each chart in a figure with short and long alternative text, collapsible data table, fill patterns where colour encodes categories, contrast and text-size check, `accessibility.html`, 200 % zoom and minimum tablet width. *Check: the Perception, Comprehensibility, Robustness and help-page items of the WCAG checklist are reviewed in a browser; any item not met is listed.*
- [x] **6.8** ◆ Screenshots of both screens and review. *Check: the DRACO, data-viz, notebook and WCAG checklists are all reviewed; the student approved.*
- [x] **6.9** Write the Part 6 `.md` and `.pdf`; the first paragraph says how to open the dashboard; save the notebook after "Restart and run all". *Check: folder matches `architecture.md`.*

## Phase 7 — Part 7 and packaging
- [ ] **7.1** The AI asks questions; the students write their reflections, both for the group and personal ones (the brief asks for both); the AI only formats them. *Check: the content is the students'; there is one personal paragraph per member.*
- [ ] **7.2** Final `ACKNOWLEDGMENTS.md` from `log.md`. *Check: source of data, reused code, and every AI use are listed.*
- [ ] **7.3** Final check of the whole repository and creation of the zip. *Check: name `DashboardTask<Member1><Member2><Member3>.zip` with the three members' names (the AI asks the student for the exact spelling); no course PDFs inside; `dashboard/index.html` opens by double-click from the unzipped folder.*
- [ ] **7.4** Interview preparation: a list of questions the professor could ask for each part, with the answer from the documents. *Check: the student can answer them.*
