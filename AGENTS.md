# AGENTS.md — Development Guidelines for AI Agents

This document defines persistent rules, architectural constraints, and standard operating workflows for AI coding agents working on **Ascendr**.

The existing architecture describes the starting implementation, not necessarily the intended final architecture. The user may request architectural changes as the remake evolves. Do not treat existing design decisions as permanent constraints.

---

## 1. Project Context & Architecture

- **Backend:** Python with **FastAPI** (`fastapi>=0.115`) and **Uvicorn** (`uvicorn[standard]>=0.30`).
- **Backend Structure:** Currently implemented in a single monolithic file: [app.py](file:///c:/Users/acer/Desktop/ascendr/app.py).
- **Database Engine:** Standard library `sqlite3` connecting in read-only URI mode (`file:credentials.db?mode=ro`).
- **Search Engine:** **SQLite FTS5** virtual table (`credentials_fts`) with prefix matching (`*`) and BM25 ranking, with fallback to SQL `LIKE`.
- **Placeholder Mechanism:** If `credentials.db` is missing, unreadable, or empty, [app.py](file:///c:/Users/acer/Desktop/ascendr/app.py) falls back to an in-memory SQLite database (`_placeholder_db()`) and flags responses with `"placeholder": true`.
- **Frontend:** Vanilla HTML5, CSS3, and ES6+ JavaScript located in [static/](file:///c:/Users/acer/Desktop/ascendr/static).
- **No Build Tools:** No npm, webpack, Vite, or frontend frameworks. Do not introduce a Node.js/npm pipeline unless explicitly instructed.

---

## 2. Core Development Principles

1. **Inspect Before Modifying:** Always inspect existing code and related files before proposing or writing changes.
2. **Preserve Architecture:** Respect the lightweight, single-file backend and vanilla frontend layout unless architectural refactoring is explicitly requested.
3. **Avoid Unnecessary Dependencies:** Do not add third-party libraries, ORMs (e.g., SQLAlchemy), or frameworks without explicit instruction. Prefer Python standard library and existing dependencies.
4. **Clean & Maintainable Code:** Write readable, idiomatic Python and JavaScript with clear variable naming and appropriate comments.
5. **API Response Consistency:** Maintain consistent API response schemas:
   - Query responses return `{ "total": int, "page": int, "page_size": int, "placeholder": bool, "items": [...] }`.
   - Single item responses return the standard dictionary or 404 with `{"detail": "..."}`.
   - Aggregate endpoints (`/api/filters`, `/api/stats`) must maintain existing dictionary structures and include `"placeholder": bool`.
6. **Careful Database Connection Handling:**
   - Always open connections safely and handle potential SQLite errors.
   - Respect read-only access flags (`?mode=ro`, `check_same_thread=False`).
   - Do not leak connection handles.
7. **Preserve SQLite Schema Compatibility:**
   - Table `credentials` columns: `id`, `title`, `description`, `duration`, `url`, `type`, `level`, `duration_minutes`, `recommended`, `rank`.
   - Virtual table `credentials_fts` columns: `id`, `title`, `description`.
   - Any schema changes must be backward-compatible with existing queries.
8. **Data Protection:**
   - **Never delete, overwrite, or recreate `credentials.db`** without explicit user approval.
9. **Security & Secrets:** Never hardcode or commit API keys, secrets, tokens, or sensitive credentials.
10. **Ground Truth Over Speculation:** Do not invent features, assume unimplemented endpoints exist, or hallucinate environment variables. Distinguish verified facts from assumptions.

---

## 3. Working Workflow

When executing any development task:

1. **Understand Requirements:** Carefully analyze what was requested before touching code.
2. **Identify Target Files & Dependencies:** Map the exact files, routes, or assets that need adjustment.
3. **Explain the Plan:** For non-trivial modifications or refactoring, provide a concise explanation of the proposed approach before applying edits.
4. **Make Focused, Incremental Changes:** Edit only what is necessary to complete the task. Avoid unnecessary code churn or reformatting unrelated blocks.
5. **Run Checks & Verification:**
   - Execute syntax checks (`python -m py_compile app.py`).
   - Verify health and endpoint responses (`/api/health`, `/api/credentials`).
   - Verify frontend script validity if modified.
6. **Report Clearly:** State modified files, validation results, and any technical debt, risks, or remaining concerns.

---

## 4. Git Rules

- **No Unauthorized Commits or Pushes:** Never run `git commit` or `git push` unless explicitly permitted by the user.
- **Do Not Overwrite Unrelated Work:** Preserve uncommitted user changes in the working directory.
- **No Branching/Worktrees Without Approval:** Do not create branches, worktrees, or stashes unless explicitly asked.

---

## 5. Communication Standards

- **Explain Technical Decisions:** Clearly explain why a specific implementation choice was made.
- **Acknowledge Uncertainty:** If requirements are ambiguous or data is missing, state the uncertainty explicitly rather than guessing.
- **Highlight Technical Debt:** Point out edge cases, missing test coverage, or potential scalability bottlenecks when relevant.
- **Truthful Verification:** Never claim a feature, fix, or endpoint was tested unless actual execution commands were run and verified.

---

## 6. Project References & Historical Context (CredBase)

### Reference Links & Documentation
- **Primary Legacy Specification:** [docs/LEGACY_REFERENCE.md](file:///c:/Users/acer/Desktop/ascendr/docs/LEGACY_REFERENCE.md) (comprehensive analysis of CredBase features, architecture, database schemas, and product history).
- **Current Ascendr Website (V2 starting point):** https://ascendr-lakshya.vercel.app
- **Original Project (CredBase):**
  - Website: https://credbase.vercel.app
  - GitHub Repository: https://github.com/lucky08-exe/credBase

### How to Use Historical References
When the user explicitly mentions the old website, original project, CredBase, or asks to reuse, compare, or refer to previous functionality:
1. **Consult `docs/LEGACY_REFERENCE.md` First:** Treat [docs/LEGACY_REFERENCE.md](file:///c:/Users/acer/Desktop/ascendr/docs/LEGACY_REFERENCE.md) as the **primary reference** for understanding the old project. Consult it before inspecting the old repository.
2. **Avoid Redundant Re-Analysis:** Do **not** repeatedly re-clone or re-analyze the entire legacy repository for information that is already verified and documented in `LEGACY_REFERENCE.md`.
3. **Targeted Deep Dives Only:** Revisit the original GitHub repository or live website only when the requested detail is missing, ambiguous, or requires targeted verification.
4. **Distinguish Implemented vs. Planned:** Always distinguish between features that were actually implemented in production and ideas that were merely planned or cosmetic.
5. **No Binding Architectural Inheritance:** **Never treat the old architecture or implementation as binding requirements for V2.** Use observations to understand product requirements and domain logic, but implement solutions tailored to V2's lightweight stack.

### Strict Design Restriction (Zero Aesthetic Copying)
> [!CAUTION]
> **Do NOT use the old CredBase website or repository as UI, visual, or branding inspiration.**
>
> - **Do not copy** its color scheme, typography, visual style, layouts, components, or overall aesthetic.
> - **Do not reproduce** its page designs.
> - **V2 must establish its own distinct visual identity and UI direction.**
> - The old project serves strictly as a reference for **functional logic, data requirements, and product history ONLY**.

---

## 7. Ascendr V2 Product Direction & Target Structure

- **Core Product Identity:** Ascendr is an **AI-focused learning guidance platform**.
- **Central Feature:** **Ascendr AI**, a RAG-based chatbot that conversational guides students towards relevant credentials.
- **Omnipresent Access:** The chatbot must remain **accessible throughout the entire application** (persistent across page transitions).
- **Goal-Oriented Pathways:** Predefined learning paths cater to users who already know their learning goals.
- **Supporting Role of Search/Catalogue:** Credential search and catalogue filtering are supporting tools, not the primary product experience.

### Multi-Page Evolution Plan
The current V2 repository represents a single-page starting point where certain links do not yet lead to separate, fully realized pages. V2 will expand into a modular multi-page application comprising:
1. **Landing Page:** Introduces the platform with Ascendr AI as the focal point.
2. **Ascendr AI Interface:** Embedded or global conversational assistant guiding learners.
3. **Learning Paths Pages:** Dedicated views for guided journey sequences.
4. **Credential Catalogue & Search:** Supporting exploration and faceted filtering.
5. **Credential Detail Pages:** Dedicated single-credential views with metadata and deep links.
6. **Supporting Pages:** Contextual pages added incrementally as development progresses.
