# Architecture

How the repository is organised, which tools are used, and how every file must be written. `spec.md` says WHAT must be built; this file says WHERE it goes and HOW it is written.

## Files

```
Delivery 1/
├── Course information/            (read-only: brief, course PDFs, raw dataset, archive.zip)
│   └── Claude instructions/       (spec.md, architecture.md, tasks.md, aiRules.md)
│       └── skills/                (the course's Vega-Altair skills, see "Skills" below)
├── log.md                         (decisions and AI use, see "log.md" below)
├── ACKNOWLEDGMENTS.md             (dataset source, reused code, where and how AI was used)
├── data/
│   └── processed/                 (cleaned or merged data created by our code; never overwrite the raw data)
├── Part 1 - Exploratory Data Analysis/
├── Part 2 - Audience/
├── Part 3 - Reflection and Adjustment/
├── Part 4 - Chart Selection and Encoding/
├── Part 5 - Interaction Planning/
├── Part 6 - Implementation and Delivery/
└── Part 7 - Work Group and Reflections/
```

The parts are the ones in `Delivery1-Dashboard-2627.pdf`. Do not rename or merge them.

### Inside each part folder

```
Part N - Name/
├── partN_name.pdf        (the explanation, this is what is graded)
├── partN_name.md         (the same text, plain, no fancy formatting)
├── images/               (every plot, graph or sketch used in the text)
└── code/                 (only if code was used)
    ├── descriptive_name.ipynb
    └── descriptive_name_output/   (everything that notebook produced)
```

- The `.md` is written first and the `.pdf` is made from it, so the two always have the same text. Checking this is part of "done".
- Folder names use a hyphen, never a colon (a colon is not allowed in Windows file names).
- Every file in `images/` is referenced in the text, and every image used in the text is in `images/`.
- Every notebook has a descriptive name (`clean_missing_values.ipynb`, not `notebook2.ipynb`) and its own `_output` folder.

### Part 6 is different

```
Part 6 - Implementation and Delivery/
├── dashboard/
│   ├── index.html            (screen 1, the main screen)
│   ├── detail.html           (screen 2, the detail screen)
│   ├── accessibility.html    (keyboard and screen-reader help, linked from both screens)
│   ├── data.js               (the aggregated data, as a JavaScript file; one file per screen is fine)
│   ├── specs.js              (the Vega-Lite spec of every chart, exported from the notebook)
│   └── lib/                  (local copies of the vega, vega-lite and vega-embed libraries, so it works offline)
├── part6_implementation.pdf / .md   (explains the implementation decisions, as the brief requires)
├── images/               (screenshots of both screens)
└── code/
    ├── build_dashboard.ipynb          (builds the data, the charts and the specs; writes them straight into ../dashboard/)
    └── build_dashboard_output/        (everything else it produced)
```

The brief asks for implementation decisions to be explained, so Part 6 also has its explanation. The pages in `dashboard/` are plain HTML, CSS and JavaScript around the Altair charts, because the accessibility skill needs keyboard navigation, focus rings and `aria-live` announcements that Altair cannot produce alone. The notebook also shows every chart, so it can be read as the "jupyter notebook with vega-altair" the brief mentions.

To open the dashboard: double-click `dashboard/index.html`, or open it in VS Code or any browser. No server and no command are needed. This works because the data and the specs are JavaScript files loaded with `<script src="...">`, which browsers allow from a `file://` address (a `fetch` of a `.json` file would be blocked). The Part 6 text says how to open it in its first paragraph.

### Submission

One zip named `DashboardTask<Member1><Member2><Member3>.zip` (see the brief), containing the seven part folders, `data/` and `ACKNOWLEDGMENTS.md`. It must not contain the course PDFs, and the 16 MB dataset must not be included twice. Only one member uploads it.

## Course material to read for each part

Always follow the course. Before starting a part, read the delivery brief and the files listed for that part.

| Part | Read |
|---|---|
| 1 EDA | `02-HowToApproachAVisualization` (bottom-up, data types), `04` (chart functions, to choose exploratory charts) |
| 2 Audience | `03-UnderstandingUsers-Psychologist` (persona, scenario, design thinking), `04` (top-down) |
| 3 Reflection | `02` and `04` (the bottom-up / top-down loop) |
| 4 Charts and encoding | `04` (chart by function), `05-GraphicDesign`, `05b-Extra-GraphicDesignGuidelines`, `06-Dashboards`, `01-Introduction` (accessibility guidelines), `GeoHandout` only if a map is used, and `skills/draco-vis-guidelines`, `skills/data-viz-best-practices`, `skills/wcag-accessibility` (to check that the design is valid and can be built) |
| 5 Interaction | `07-Interaction`, and the interaction and keyboard parts of `skills/data-viz-best-practices` and `skills/wcag-accessibility` |
| 6 Implementation | `06-Dashboards`, `07-Interaction`, `05b`, `01-Introduction` (accessibility guidelines), and every file in `Claude instructions/skills/` |
| 7 Reflections | none, the content comes from the students |

## Tools

- **Python**, with `pandas` for all data processing (no polars, dask or similar; `numpy` only as support), and `matplotlib`, `seaborn` or `altair` for the exploratory charts. Check which libraries are installed before using them (for Part 6 also `jupyter`; `vl-convert-python` exports PNG images).
- **Vega-Altair** for the charts of the final dashboard (Part 6), built in a Jupyter notebook and shown in plain HTML, CSS and JavaScript pages with `vega-embed`. Other tools only if the student agrees and it is recorded in `log.md`.
- The files in `Claude instructions/skills/` say how the code, the charts and the pages must be written. See "Skills" below.
- The AI builds the Part 6 dashboard itself and must run it: execute the notebook top to bottom, open `dashboard/index.html` straight from the folder (a `file://` address, exactly as the professor will, never through a server), and look at both screens. The WCAG skill requires checking the dashboard in a browser (keyboard navigation, focus, announcements, 200 % zoom, minimum tablet width). If a headless browser such as Playwright is installed, use it for the keyboard tests and for screenshots. If not, give the student a short list of what to test, and have the student confirm it. Never claim an interaction or an accessibility feature works without checking it.

## Skills

The five files in `Claude instructions/skills/` come from the course repository. Read all of them at the start of every session. They are binding in Part 6, and the DRACO and WCAG ones also decide what can be proposed in Parts 4 and 5. They are written in Spanish; everything we deliver is in English. Where a skill points to a file that is not in the folder (`SKILL.md`, `references/`), use what is here and say so.

| File | What it gives | Where it is used |
|---|---|---|
| `draco-vis-guidelines.md` | Hard rules (a chart that breaks one is invalid) and weighted soft preferences for marks, channels, aggregations and scales, with a checklist | Every chart, in Parts 4 and 6 |
| `data-viz-best-practices.md` | Chart choice by relationship, palettes, layout and typography, interaction patterns, Gestalt, ranking of visual channels, a pre-publication checklist | Parts 4 to 6 |
| `wcag-accessibility.md` | WCAG 2.2 AA and cognitive accessibility: contrast, patterns, SVG only, keyboard navigation of every data point, focus indicator, alternative text, help page, checklist | Parts 4 and 6; its checklist is the acceptance test |
| `pattern-rules.md` | When colour also needs a fill pattern, and how to show quantitative heatmaps with dots | Whenever colour encodes categories, and any heatmap |
| `jupyter-accessible-notebook.md` | All code in notebooks, pandas only, a fixed notebook structure, how to explain decisions | All code, all parts |

DRACO decides whether a chart and its encodings are valid; WCAG decides contrast, redundancy and access (the skills say so themselves). Apply DRACO first.

Decisions already taken where the skills clash with other documents or need adapting. They can be changed by the student, and each change goes in `log.md`.

- **Notebooks only, with one exception.** All code is in `.ipynb` files in every part, not only in Part 6; this replaces the old idea of `.py` programs. The student decided that the data cleaning of Part 1 is a plain `.py` script, so it overrides the notebook skill on this point.
- **Data size.** The notebook skill's import cell contains `alt.data_transformers.disable_max_rows()`. Keep it, but never chart the 119,390 raw rows: aggregate with `pandas` first. Aggregated tables go in `data/processed/`, and `data.js` must stay small. Choose the aggregation level so that the planned interactions still work (a filter can only act on a column the table still has).
- **Data outside the pages.** The student's decision is that the dashboard opens by double-click, so it must not use `fetch` or a server. This replaces the skills' `data.json` loaded by URL. Data and specs are still kept out of the HTML: the notebook writes `data.js` (for example `const DASHBOARD_DATA = {...};`) and `specs.js`, and the pages load them with `<script src>`. The chart specs refer to a named dataset (`alt.NamedData`) and the page supplies its values. Adapt the skills' JavaScript to this: the dataset has that name, not `source_0`. Keep only the columns that are needed.
- **Palette.** Use the explicit list of hex colours in the skills, at most 7 categorical colours (group the rest as "Other"). Do not rely on `scheme='okabe'`: it may not be a built-in Vega scheme, so test it, and if it fails use the hex list. The skills call the list "Wong", but its values look like Paul Tol's "bright" palette; check before naming the palette in a report.
- **Limits per screen** (from the WCAG and cognitive-accessibility part): at most 4 KPIs and 2 or 3 charts visible at once, more detail behind an expand button. The 5 to 7 questions of Part 2 must fit inside them.
- **Devices.** The dashboard is for a computer or a tablet only. Ignore the skills' mobile advice (stacking the layout in one column, a mobile check in the checklists, controls that must fit on a phone). Keep the touch-target size and the 200 % zoom check, and test at the minimum width set in Part 4 and at tablet size.
- **Names and language.** `accessibility.html` instead of `accesibilidad.html`, `<html lang="en">`, and all page and chart text in English.
- **Audience.** The skills assume the general public. The persona of Part 2 decides; if the persona is an expert, a data-viz rule may be relaxed with a written reason, but a WCAG or cognitive-accessibility rule never is.

## Design decisions

### Writing the documents

- Simple style. Text is the main content; add a figure only when it is the evidence for what is being said (an EDA chart, a sketch, a screenshot).
- Length: the final document of each of Parts 1 to 5 (`.md` and `.pdf`) has at most 500 words; the aim is 250 to 350. Count the words of the `.md` and report the number. Say only what the part needs; the evidence is in the notebooks and the figures. Parts 6 and 7 have no word limit. The exception is the data dictionary of Part 1: it is given as several images (so that it fits in the PDF), each one readable at its size in the PDF, and its words do not count. The same dictionary is saved as a `.csv` in the notebook's `_output` folder as an accessible version.
- Continuous prose, written like a report. The brief says the delivery is not a question-answer text nor a list of bullets. Short tables are fine for data dictionaries.
- Every figure has a title, a caption, a source and a one-sentence alternative text in the `.md`. The documents follow the same accessibility rules as the dashboard.
- Every design choice names the course concept behind it (for example "Weber's law", "pre-attentive colour", "Shneiderman's mantra"). No choice is justified only by taste.
- Every number in the text comes from code that was executed, and that code is in the part's `code` folder.

### Writing the code

- Simple, as if a second-year computer engineering student had written it. Plain `pandas` and `matplotlib`, small functions or none, no classes, no clever one-liners.
- A comment above each block saying what it does and why.
- Read the raw data from `Course information/hotel_bookings_dataset.csv`. Write results only inside the part's own `code/..._output` folder or `data/processed/`.
- Fixed seed (`112358`) wherever there is any randomness (sampling), so every run gives the same result.
- All code lives in Jupyter notebooks (`.ipynb`), never in loose `.py` scripts. The one exception is the cleaning script of Part 1, `clean_hotel_bookings.py`: a plain Python file in Part 1's `code` folder that reads the raw file, applies the cleaning rules the student approved, writes `data/processed/hotel_bookings_clean.csv`, and saves a log of how many rows each rule changes in `clean_hotel_bookings_output/`. It runs from top to bottom with `python clean_hotel_bookings.py`. Each notebook runs from top to bottom with "Restart and run all" without manual steps, and is saved with its outputs.
- Notebook structure, from `jupyter-accessible-notebook`: a title cell (title, data source, date, authors, description), an index cell, an imports cell, then the sections in the skill's order (load, explore, clean, analyse, accessible visualisation, export), and a final conclusions cell. A Markdown cell after each step explains the decision in the skill's format (context, decision, alternatives, limitation), not the syntax. Variable names are descriptive, every code cell ends with a visible output, and there is no debug code.
- Every chart has a `title` in plain language, a `description` (its alternative text), axis labels with units, tooltips with units and formatted numbers (`format=',.0f'`), an explicit colour scale, and the SVG renderer (`alt.renderers.enable('svg')`, never canvas). Where colour encodes categories it is reinforced with `strokeDash`, `shape` (only where DRACO allows it) or fill patterns, as `wcag-accessibility` and `pattern-rules` say.
- Before a chart is accepted, check it against the DRACO hard-rules checklist and then its soft preferences.

### `log.md`

One line per entry: `date | task | what | who decided (student, or AI proposal approved by student) | why`.
It records every decision, every deviation from these documents, and every use of AI. This feeds `ACKNOWLEDGMENTS.md`, which the brief requires.

## Done means

A task is done only when: the folder matches this file, the code ran and its output exists, the numbers in the text match that output, `.md` and `.pdf` have the same text (and, in Parts 1 to 5, no more than 500 words), the relevant checks in `spec.md` pass (in Part 6 also the checklists of the skills), and the log line is written.
