# Tasks (proposal, to be reviewed by the student)

One task at a time (see `aiRules.md`). Mark a task `[x]` only when its check passes and the log line is written.
**◆** = the student must decide something before the task can be closed (the AI proposes options, the student chooses).
Text for the parts follows `spec.md` and `architecture.md`.

## Phase 0 — Setup
- [ ] **0.1** Read all instructions, the brief and the course files for Part 1. Create the folder skeleton, empty `log.md` and `ACKNOWLEDGMENTS.md`. *Check: the tree matches `architecture.md`.*
- [ ] **0.2** Load the raw dataset with `pandas`. *Check: 119,390 rows x 32 columns; the raw file is untouched.*

## Phase 1 — Part 1: Exploratory Data Analysis
- [ ] **1.1** Data dictionary: for each of the 32 fields, type (course taxonomy), temporal / geographic nature, range, domain, units, precision. *Check: all 32 fields covered.*
- [ ] **1.2** Data quality: missing values, `NULL` placeholders, duplicates, impossible or odd values, overlap between `is_canceled` and `reservation_status`. *Check: every number comes from a script and its output.*
- [ ] **1.3** Distributions and outliers, with exploratory charts. *Check: each chart has title, axis labels, source and a comment in the text.*
- [ ] **1.4** Relationships and groupings between fields (time, hotel, market segment, country, cancellations, price). *Check: each relationship has a chart and a comment.*
- [ ] **1.5** Currency and update frequency of the data. ◆ Fields and relationships proposed for the dashboard. *Check: the student approved the list.*
- [ ] **1.6** Write `part1_eda.md` and the `.pdf`. *Check: same text in both; every image referenced.*

## Phase 2 — Part 2: Audience
- [ ] **2.1** ◆ Audience, platform (one only) and frequency of use. *Check: the student chose among the options.*
- [ ] **2.2** ◆ Persona, goal and scenario of use. *Check: consistent with 2.1.*
- [ ] **2.3** ◆ Goals of the dashboard and 5–7 questions from the user's perspective. *Check: between 5 and 7; each answerable with the dataset.*
- [ ] **2.4** Write the Part 2 `.md` and `.pdf`. *Check: same text in both.*

## Phase 3 — Part 3: Reflection and adjustment
- [ ] **3.1** ◆ Review Parts 1 and 2: is more data or a merge needed? *Check: decision recorded.*
- [ ] **3.2** If needed, add or merge data (code and output saved) and describe any new data in detail. *Check: new file in `data/processed/`, loads correctly.*
- [ ] **3.3** Write the Part 3 `.md` and `.pdf`, with the small changes to Part 1. *Check: same text in both.*

## Phase 4 — Part 4: Chart selection and encoding
- [ ] **4.1** ◆ For each of the questions, the function of the chart (Visual Vocabulary) and the chart type. *Check: every question is covered by a chart.*
- [ ] **4.2** Encoding, colour and accessibility decisions, with perception and Gestalt reasons. *Check: accessibility list in `spec.md` reviewed item by item.*
- [ ] **4.3** ◆ Low-fidelity prototype of both screens (a clean sketch). *Check: the student approved the layout.*
- [ ] **4.4** Write the Part 4 `.md` and `.pdf`, including how the prototype answers the questions. *Check: same text in both.*

## Phase 5 — Part 5: Interaction planning
- [ ] **5.1** ◆ Interactions inside each chart and between charts. *Check: each one has trigger, action and reason.*
- [ ] **5.2** Link each interaction to the course models. *Check: Shneiderman's mantra and the interaction types are used correctly.*
- [ ] **5.3** Update the prototype and write the Part 5 `.md` and `.pdf`. *Check: same text in both.*

## Phase 6 — Part 6: Implementation and delivery
- [ ] **6.1** Data-preparation script producing the file for Power BI. *Check: row counts and key totals agree with Part 1.*
- [ ] **6.2** Power BI build sheet and DAX measures for screen 1. The student builds it. *Check: numbers on the dashboard equal the Python results.*
- [ ] **6.3** Same for screen 2. *Check: same as 6.2.*
- [ ] **6.4** Interaction and accessibility setup (theme, contrast, alternative text, tab order, titles). *Check: accessibility list in `spec.md` passes.*
- [ ] **6.5** ◆ Review of both screens from screenshots. *Check: the student approved.*
- [ ] **6.6** Write the Part 6 `.md` and `.pdf`; save the code, DAX and screenshots. *Check: folder matches `architecture.md`.*

## Phase 7 — Part 7 and packaging
- [ ] **7.1** The AI asks questions; the students write their reflections; the AI only formats them. *Check: the content is the students'.*
- [ ] **7.2** Final `ACKNOWLEDGMENTS.md` from `log.md`. *Check: source of data, reused code, and every AI use are listed.*
- [ ] **7.3** Final check of the whole repository and creation of the zip. *Check: name `DashboardTask<Member1><Member2><Member3>.zip`; no course PDFs inside.*
- [ ] **7.4** Interview preparation: a list of questions the professor could ask for each part, with the answer from the documents. *Check: the student can answer them.*
