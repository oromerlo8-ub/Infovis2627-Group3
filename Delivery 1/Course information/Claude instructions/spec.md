# Specification — Hotel bookings dashboard (Delivery 1)

## Goal

To create a repository that explains the intentions and the process of building a high-quality, two-screen dashboard about hotel bookings, following the good practices of the Presentation and Visualization course and adapted for people with disabilities. The process and the decisions are as important as the final dashboard (the brief says so), and every group member must be able to explain all of it in an interview.

## Context

- Course: Presentation and Visualization (Data Science master)
- Group 3. Written in English.
- AI use is allowed only if it is acknowledged clearly (where and how) and the students can answer questions about every decision. Deliveries using AI are subject to an interview.
- Reference documents: `Delivery1-Dashboard-2627.pdf` (the brief) and the course PDFs in `Course information/`.

## Dataset

- `Course information/hotel_bookings_dataset.csv` (identical to the file inside `archive.zip`). 119,390 rows, 32 columns. Two hotels (a city hotel and a resort hotel) and bookings arriving between July 2015 and August 2017. Never modify the raw file.
- Source to cite in `ACKNOWLEDGMENTS.md`: Antonio, Almeida and Nunes, "Hotel booking demand datasets", Data in Brief, 2019. Verify the exact reference before citing it.
- Things already seen in the file that Part 1 must investigate, not assume: the text `NULL` in `agent` and `company`; missing `country` (488) and `children` (4); one negative and one very large `adr` (5,400); bookings with 0 adults; the meal value `Undefined`; about 32,000 fully duplicated rows; `reservation_status` repeating `is_canceled` (careful: using it to explain cancellations is circular); `reservation_status_date` starting before the first arrival. There is no update frequency: it is a historical snapshot.

## What is already decided

- Dataset: the hotel bookings above.
- Tools: Python for analysis, Power BI for the final dashboard.
- Dashboard: exactly two screens. One main screen with global information, one screen with detail on one aspect of the data. It may be static, but Part 5 must still plan interaction and Part 6 should implement it if feasible.
- Accessibility is a requirement, not an extra (see Quality criteria).

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
| 4 Charts and encoding | 15 % | Chart type and encoding for each question, layout, with perception and Gestalt arguments and accessibility. A low-fidelity prototype of both screens and how it answers each question. |
| 5 Interaction | 15 % | Interaction inside each chart and between charts, each one linked to the course models (Shneiderman's mantra, the manipulation / exploration / problem-solving types) with the reason. |
| 6 Implementation | 30 % | The hi-fi dashboard in Power BI and the explanation of the implementation decisions. Data, code and screenshots needed to see and rebuild it. |
| 7 Reflections | 5 % | How the tasks were organised, how the process went, whether the theory helped, surprises and difficulties. |

The parts feed each other. Part 1 (bottom-up) and Part 2 (top-down) are done as a loop, so Part 3 may send the work back to Part 1.

## Quality criteria

1. **Traceable.** Each choice cites the course concept behind it; each number comes from executed code.
2. **Course dashboard guidelines** (`06-Dashboards`): clear goal and audience, relevant KPIs with context, simplicity, a focal point, consistency, layout and white space, one screen per dashboard screen, interaction only where it helps.
3. **Perception** (`05`, `05b`): suitable visual channels, pre-attentive highlighting used sparingly, related items placed close together, no judgement that depends on hard magnitude estimation (areas, angles) when a bar would do.
4. **Accessibility** (`01-Introduction`, `05b`), checked one by one in Parts 4 and 6: title, legend, axis titles, caption, abbreviations explained, data source; safe colours for colour blindness and enough contrast; colour never the only code (add shape, label or position); legible text size; the dashboard resizes; visible keyboard focus and a logical tab order; short alternative text and a long description for each chart; works without depending on one device; customisable where the tool allows it.
5. **Honest.** What was not verified is said so. If unsure about a chart, an expression or a DAX formula, say so instead of guessing.
6. **Reproducible.** Every program runs from the raw data to its output with a fixed seed (`42`).
7. **Acknowledged.** Dataset source, reused or inspiring code, and each AI use are in `ACKNOWLEDGMENTS.md`.

## Out of scope

The storytelling task (10 December), the final exam, other datasets, and deployment of the dashboard anywhere but a local file.

## Open points for the students

- Is the group's GitHub Pages site (`Infovis2627-Group3`) also a place where this delivery is published, or only the zip?
- Is a short advanced draft still wanted for tutoring feedback? (The brief set it 15 days before the deadline.)
- Do `Claude instructions` files go in the zip as proof of AI use, or only `ACKNOWLEDGMENTS.md`?
