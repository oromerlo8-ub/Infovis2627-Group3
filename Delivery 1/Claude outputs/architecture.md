# Architecture

How the repository is organised, which tools are used, and how every file must be written. `spec.md` says WHAT must be built; this file says WHERE it goes and HOW it is written.

## Files

```
Delivery 1/
├── Course information/            (read-only: brief, course PDFs, raw dataset, archive.zip)
│   └── Claude instructions/       (spec.md, architecture.md, tasks.md, aiRules.md)
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
    ├── descriptive_name.py
    └── descriptive_name_output/   (everything that program produced)
```

- The `.md` is written first and the `.pdf` is made from it, so the two always have the same text. Checking this is part of "done".
- Folder names use a hyphen, never a colon (a colon is not allowed in Windows file names).
- Every file in `images/` is referenced in the text, and every image used in the text is in `images/`.
- Every program has a descriptive name (`clean_missing_values.py`, not `script2.py`) and its own `_output` folder.

### Part 6 is different

```
Part 6 - Implementation and Delivery/
├── dashboard.pbix        (the Power BI dashboard, 2 screens)
├── part6_implementation.pdf / .md   (explains the implementation decisions, as the brief requires)
├── images/               (screenshots of both screens)
└── code/                 (data preparation scripts, DAX measures in .dax/.txt files, Power Query steps)
```

The brief asks for implementation decisions to be explained, so Part 6 also has its explanation. Everything else stays as light as the group wanted: the dashboard and the `code` folder with everything needed to rebuild it.

### Submission

One zip named `DashboardTask<Member1><Member2><Member3>.zip` (see the brief), containing the seven part folders, `data/` and `ACKNOWLEDGMENTS.md`. It must not contain the course PDFs, and the 16 MB dataset must not be included twice. Only one member uploads it.

## Course material to read for each part

Always follow the course. Before starting a part, read the delivery brief and the files listed for that part.

| Part | Read |
|---|---|
| 1 EDA | `02-HowToApproachAVisualization` (bottom-up, data types), `04` (chart functions, to choose exploratory charts) |
| 2 Audience | `03-UnderstandingUsers-Psychologist` (persona, scenario, design thinking), `04` (top-down) |
| 3 Reflection | `02` and `04` (the bottom-up / top-down loop) |
| 4 Charts and encoding | `04` (chart by function), `05-GraphicDesign`, `05b-Extra-GraphicDesignGuidelines`, `06-Dashboards`, `01-Introduction` (accessibility guidelines), `GeoHandout` only if a map is used |
| 5 Interaction | `07-Interaction` |
| 6 Implementation | `06-Dashboards`, `05b`, `01-Introduction` (accessibility guidelines) |
| 7 Reflections | none, the content comes from the students |

## Tools

- **Python** for everything that is analysis or data preparation: `pandas`, `matplotlib` or `seaborn` (`altair` is also fine, it is taught in the course). Check which libraries are installed before using them.
- **Power BI Desktop** for the final dashboard (Part 6). Other tools only if the student agrees and it is recorded in `log.md`.
- The AI cannot open Power BI. For Part 6 it prepares the data, writes the DAX measures, and gives a precise build sheet (which visual, which fields, which colours, which alt text). The student builds it, and the AI checks the result from screenshots and from numbers. Never claim a dashboard feature works without checking it.

## Design decisions

### Writing the documents

- Simple style. Text is the main content; add a figure only when it is the evidence for what is being said (an EDA chart, a sketch, a screenshot).
- Continuous prose, written like a report. The brief says the delivery is not a question-answer text nor a list of bullets. Short tables are fine for data dictionaries.
- Every figure has a title, a caption, a source and a one-sentence alternative text in the `.md`. The documents follow the same accessibility rules as the dashboard.
- Every design choice names the course concept behind it (for example "Weber's law", "pre-attentive colour", "Shneiderman's mantra"). No choice is justified only by taste.
- Every number in the text comes from code that was executed, and that code is in the part's `code` folder.

### Writing the code

- Simple, as if a second-year computer engineering student had written it. Plain `pandas` and `matplotlib`, small functions or none, no classes, no clever one-liners.
- A comment above each block saying what it does and why.
- Read the raw data from `Course information/hotel_bookings_dataset.csv`. Write results only inside the part's own `code/..._output` folder or `data/processed/`.
- Fixed seed (`42`) wherever there is any randomness (sampling), so every run gives the same result.
- Each program runs from top to bottom without manual steps.

### `log.md`

One line per entry: `date | task | what | who decided (student, or AI proposal approved by student) | why`.
It records every decision, every deviation from these documents, and every use of AI. This feeds `ACKNOWLEDGMENTS.md`, which the brief requires.

## Done means

A task is done only when: the folder matches this file, the code ran and its output exists, the numbers in the text match that output, `.md` and `.pdf` have the same text, the relevant checks in `spec.md` pass, and the log line is written.
