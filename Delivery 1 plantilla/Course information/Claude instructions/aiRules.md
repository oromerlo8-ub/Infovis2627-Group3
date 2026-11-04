# Rules for the AI assistant

## General rules

1. **Read first.** At the start of a session, read all the `.md` files, every file in `skills/` and the notebook, say which task is next, and wait.
2. **One task at a time**, in the order of `tasks.md`. Never start the next task until the student says so.
3. **Plan first.** State in 2–3 lines what the task adds; ask if something isn't covered by the documents.
4. **Verify honestly.** Run every notebook with "Restart and run all", and check that all the files are correct and their content is true and follows the guidelines. In Part 6, open `dashboard/index.html` straight from the folder and test it in a browser; if you cannot test something, say so and give the student a list of what to test.
5. **Report briefly:** what was added, what was checked, one or two key concepts. Then mark the task `[x]` and add one line to `log.md`.
6. **Don't change** `spec.md` or `architecture.md` without approval.

## Technical rules for this project

### Allowed tools

- Python with `pandas` for all data processing, `matplotlib` / `seaborn` / `altair` for charts, all code in Jupyter notebooks (no loose `.py` scripts, except the Part 1 cleaning script).
- Plain HTML, CSS and JavaScript with `vega-embed` for the Part 6 dashboard pages.

### Data

- Never change data by hand or on your own judgement. Every cleaning step is code in the Part 1 cleaning script (`.py`), following a rule the student approved.
- The final documents of Parts 1 to 5 have at most 500 words (aim 250–350). Report the word count. The Part 1 data dictionary images do not count.

### Vega-Altair skills

- Read every file in `skills/` before starting. Follow them throughout Part 6, and use `draco-vis-guidelines` and `wcag-accessibility` already when proposing designs in Parts 4 and 5.
- The decisions in the "Skills" section of `architecture.md` are already settled. Follow them.
- If a skill conflicts with something else that is not settled there, point it out once and ask the student. The order is: the brief, then `spec.md` and `architecture.md`, then the course PDFs, then the skills. Record the answer in `log.md`.
- If a skill does not cover what the chart needs, say so instead of guessing.
- Before finishing Part 6, go through the checklists at the end of the skills and report which items pass and which do not.

## Communication

- Clear, simple English. Explain ideas briefly and accurately when they appear.
- Keep the style: You must always follow the teachings of the course pdf files.
- If unsure about the code to use, the expressions to use or the graph to create, say so instead of guessing.
- If you are asked for something that contradicts the documents, point it out once, then follow their decision and record it in `log.md`.

## When to stop and ask

- A requirement is ambiguous, or the documents disagree. If asking, expect a coherent response from the user, don't let the user continue without responding.
- The task needs something not described in the documents.
- `spec.md` or `architecture.md` would have to change.
- A check fails and the fix would change the agreed design.
- An item of a skill checklist cannot be met or cannot be tested.
- A task is much bigger than expected: propose splitting it in `tasks.md`.
- Always when a  task is finished.