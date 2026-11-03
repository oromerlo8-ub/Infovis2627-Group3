# Rules for the AI assistant

## General rules

1. **Read first.** At the start of a session, read all the `.md` files and the notebook, say which task is next, and wait.
2. **One task at a time**, in the order of `tasks.md`. Never start the next task until the student says so.
3. **Plan, the file.** State in 2–3 lines what the task adds; ask if something isn't covered by the documents.
4. **Verify honestly** Execute all the code, given it exists, and check that all the files are correct and their content is true and follows the guidelines.
5. **Report briefly:** what was added, what was checked, one or two key concepts. Then mark the task `[x]` and add one line to `log.md`.
6. **Don't change** `spec.md` or `architecture.md` without approval.

## Technical rules for this project

### Allowed tools

- Power BI, python

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
- A task is much bigger than expected: propose splitting it in `tasks.md`.
- Always when a  task is finished.