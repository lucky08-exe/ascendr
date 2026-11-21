# LEGACY_REFERENCE.md — CredBase (Ascendr V1) Architectural & Product Reference

> [!CAUTION]
> **Strict Design & Aesthetic Restriction:**
> This document and the legacy CredBase project serve **strictly as a reference for functional logic, domain data, user workflows, and product history**.
> - **Do NOT copy** CredBase's visual design, color palette, typography, visual layouts, components, or branding.
> - **Do NOT reproduce** its page styles.
> - Ascendr V2 must establish its own unique visual identity and UI direction.

---

## 1. Executive Summary & Original Product Concept

* **Original Product Name:** CredBase (later referred to as ascendr. V1).
* **Reference Artifacts:**
  * Live Website: [https://credbase.vercel.app](https://credbase.vercel.app)
  * GitHub Repository: [https://github.com/lucky08-exe/credBase](https://github.com/lucky08-exe/credBase)
* **Core Value Proposition:**
  CredBase was developed as a specialized search engine, filtering system, and discovery directory for official Google Cloud educational credentials. The platform indexed **1,318 active credentials** (scraped from Google Skills), categorizing them into hands-on labs, skill courses, and multi-course learning paths. Its goal was to help learners navigate the fragmented Google Cloud Skills Boost ecosystem by filtering by duration, difficulty, and keyword, with direct launch links into hands-on lab environments.

---

## 2. Features Actually Implemented vs. Planned / Incomplete

### A. Actually Implemented in Production (Verified)

| Feature | Implementation Details | Verified Status |
| :--- | :--- | :--- |
| **Catalog Scraper Pipeline** | `pipeline/collect_catalog.py` automated multi-page JSON fetching from `https://www.skills.google/catalog/list`. | Shipped & Verified |
| **Data Cleaning & Normalization** | `pipeline/clean_catalog.py` canonicalized URLs, parsed duration strings into integer minutes (`duration_minutes`), and normalized types. | Shipped & Verified |
| **SQLite + FTS5 BM25 Engine** | Indexed 1,318 items in `credentials.db` with an FTS5 virtual table (`credentials_fts`) for prefix search (`*`) and BM25 ranking. | Shipped & Verified |
| **Lab URL Context Preservation** | Preserved the `parent=catalog` query string on `/focuses/` URLs so Google Cloud hands-on labs launch directly into the active console session. | Shipped & Verified |
| **FastAPI REST API** | Endpoints `/api/health`, `/api/stats`, `/api/filters`, `/api/credentials`, and `/api/credentials/{id}`. | Shipped & Verified |
| **Search & Faceted Filters UI** | Catalogue page with search query debounce (350ms), multi-select category pills, duration brackets, sorting, and pagination. | Shipped & Verified |
| **URL Parameter Synchronization** | Synchronized state (`q`, `type`, `level`, `duration_bracket`, `sort`, `page`) with the browser address bar. | Shipped & Verified |
| **Quick View Modal** | Modal overlay on the catalogue page displaying descriptions, badges, and a "Copy Link" clipboard button. | Shipped & Verified |
| **Curated Learning Paths UI** | 5 multi-stage curated paths with dedicated subpages (`/paths/[slug]`) and external resource links. | Shipped & Verified |

### B. Planned, Incomplete, or Decorative Ideas (Not in Runtime)

| Feature / Idea | Promised / Visual Appearance | Verified Reality |
| :--- | :--- | :--- |
| **"AI Guide" / Conversational AI** | A prominent landing page section titled *"01 / Tell us anything — Start with what's on your mind"* with prompt input *"I want to build something with AI..."*. | **Purely decorative form.** Submitting the form simply executed `router.push('/catalogue?q=' + prompt)`. There was **no LLM, no RAG, no chatbot, and no API connection to any AI model** in the runtime. |
| **Catalog AI Enrichment** | Documented in `docs/V2_ENRICHMENT_HANDOFF.md` to extract skills, career paths, and domains using Gemini Flash. | **Offline prototype only.** Stored as a 10-record sample in `v2_enrichment/enriched_10.json` with manual dictionaries. Never integrated into SQLite or the web application. |
| **Individual Credential Pages** | Links to individual credentials. | Only implemented as a client-side modal (`Quick View`); standalone credential detail pages did not exist. |
| **Paid vs. Free Filter** | Database column `paid INTEGER`. | Omitted from frontend filters because almost all catalog records were free or credit-based, making the filter redundant. |
| **User Accounts & Tracking** | Visual icon buttons for user profiles. | No backend auth, user sessions, or personal progress tracking existed. |

---

## 3. Main User Flows & Interactions

1. **Discovery & Search Flow:**
   - User lands on `/`.
   - Enters a natural language phrase or topic into the prompt bar (e.g. *"Kubernetes"* or *"Break into AI"*).
   - Prompt redirects to `/catalogue?q=<encoded-query>`.
   - Results render in a 3-column responsive grid with badges for credential type (`Lab`, `Course`, `Learning Path`), level dots (`Introductory`, `Intermediate`, `Advanced`), and duration.
2. **Faceted Filtering Flow:**
   - In `/catalogue`, user filters by type, level, or duration bracket (`<30m`, `<1h`, `1-3h`, `>3h`).
   - Counts beside each filter pill update dynamically based on the active dataset via `/api/filters`.
   - Active filters appear as dismissible pill tags above the results.
   - User can reset all filters with one click.
3. **Inspection & Launch Flow:**
   - Clicking **"Quick View"** opens a modal overlay with the complete description, metadata badges, and a "Copy Link" button.
   - Clicking **"Launch ↗"** opens the direct Google Cloud training or lab focus URL in a new tab.
4. **Structured Path Flow:**
   - User navigates to `/paths` to view 5 guided journeys:
     1. *First steps into AI / ML*
     2. *Backend development foundations*
     3. *Cloud computing fundamentals*
     4. *Build a first practical project*
     5. *Prepare for technical internships*
   - Clicking a journey opens `/paths/[slug]`, which displays a 3-stage breakdown with actionable outcomes and external Google/web.dev study links.

---

## 4. Backend Architecture, Database & Data Handling

### Architecture
- **Framework:** FastAPI with Uvicorn.
- **Serverless Support:** Used `Mangum` ASGI adapter to support AWS Lambda / Vercel serverless deployment alongside standard Render containers.
- **Middleware:** `CORSMiddleware` (allowing `*`) and a custom `no-cache` header injector.

### Database Engine & Schema
- **File:** `credentials.db` (2.5 MB SQLite database).
- **Table Definition:**
  ```sql
  CREATE TABLE credentials (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      duration TEXT,
      url TEXT UNIQUE NOT NULL,
      type TEXT,
      level TEXT,
      duration_minutes INTEGER,
      recommended INTEGER DEFAULT 0,
      rank INTEGER
  );

  CREATE VIRTUAL TABLE credentials_fts USING fts5(id, title, description);
  ```
- **Dataset Composition (1,318 total rows):**
  - **Types:** Labs (688), Courses (538), Learning Paths (92).
  - **Levels:** Introductory (722), Intermediate (420), Advanced (70), Unspecified (106).
  - **Durations:** `<30m` (507), `<1h` (253), `1-3h` (235), `>3h` (323). Average duration: 312 minutes.

### Search Query Logic
- Words were cleaned of non-alphanumeric characters and wrapped in prefix quotes: `'"kubernetes"* "cluster"*'`.
- Subquery matching:
  ```sql
  WHERE c.id IN (SELECT id FROM credentials_fts WHERE credentials_fts MATCH ?)
  ```
- BM25 ordering:
  ```sql
  ORDER BY (
      SELECT bm25(credentials_fts)
      FROM credentials_fts
      WHERE credentials_fts.id = c.id AND credentials_fts MATCH ?
  ) ASC, c.title ASC
  ```

---

## 5. Frontend Functionality (Behavioral Overview)

* **Original Frontend Framework:** Next.js 16 (App Router), React 19, Tailwind CSS v4, Lucide icons.
* **Delivery Mechanism:** Built via `next build` static export (`output: 'export'`) and synchronized to the FastAPI `static/` directory via a custom `sync-static.js` script.
* **Client Behavior:**
  - **Debouncing:** Search bar debounced at 350ms to prevent rapid query fires.
  - **URL State Binding:** All query parameters were bidirectional—updating filters pushed to the browser history, and loading a shared link restored all checkboxes, search text, and pagination state.
  - **Clipboard Support:** Modern `navigator.clipboard.writeText` with temporary visual confirmation ("Copied!").
  - **Responsive Layout:** Sidebar filters collapsed into a slide-over mobile drawer below 1024px.

---

## 6. AI Functionality Assessment

* **State in CredBase:** **Zero functional AI.**
  - The "AI Guide" on the landing page was a cosmetic redirection to keyword search.
  - The RAG architecture, conversational guidance, and intelligent recommendations envisioned for Ascendr were not implemented in the legacy codebase.
  - The prototype in `v2_enrichment/` only demonstrated that LLM-based categorization of credentials was feasible offline.

---

## 7. Reusable Domain Knowledge & Ideas for Ascendr V2

1. **Real Data Pipeline & Catalog Content:**
   - The dataset of 1,318 Google Cloud credentials (`catalog.json` and `credentials.db`) is fully compatible with Ascendr V2's schema.
   - The data collection logic (`pipeline/collect_catalog.py`) can be reused to refresh or augment the credential catalog.
2. **Lab Focus URL Rule (`parent=catalog`):**
   - Google Skills lab URLs (`https://www.skills.google/focuses/<id>?parent=catalog`) fail or misbehave if query parameters are stripped. This business rule must be preserved in V2.
3. **Structured Learning Paths Concept:**
   - The 5 paths and their 3-stage progression models (`first-steps-ai-ml`, `backend-foundations`, `cloud-computing`, etc.) provide valuable domain structure that should be formalized into backend data rather than hardcoded in templates.
4. **Enriched Taxonomy Concept:**
   - The schema proposed in `V2_ENRICHMENT_HANDOFF.md` (identifying `skills`, `domains`, `career_paths`, and `certification_alignment`) is ideal for powering **Ascendr AI**'s RAG context.
5. **Direct Test Suite Pattern:**
   - `test_direct.py` provided a clean, dependency-free sanity test pattern verifying both API endpoints and static file responses directly without needing complex test fixtures.

---

## 8. Limitations, Technical Debt & Anti-Patterns to Avoid

1. **Avoid Overcomplicated Build Pipelines:**
   - CredBase maintained a Next.js 16 + React 19 + Tailwind setup that exported static files copied into FastAPI via custom sync scripts. This created synchronization overhead and duplicate routing logic between Next.js and FastAPI.
   - V2's buildless vanilla frontend avoids this entire layer of complexity.
2. **Do Not Hardcode Paths in Frontend Code:**
   - In CredBase, learning paths were hardcoded in Next.js TypeScript files (`paths/[slug]/page.tsx`), completely disconnected from `credentials.db`. In V2, learning paths should be stored as structured data accessible via `/api/paths`.
3. **Inefficient FTS5 Subqueries:**
   - CredBase used `WHERE c.id IN (SELECT id FROM credentials_fts MATCH ?)` which is less performant than a direct table `JOIN` with indexed matching.
4. **Faux AI Features:**
   - CredBase labeled a plain search redirection form as "AI Guide". V2 must deliver genuine conversational guidance via **Ascendr AI** (RAG-backed LLM chat).
5. **Lack of Dedicated Credential Detail Pages:**
   - CredBase relied exclusively on quick-view modals, preventing deep linking to individual credentials. V2 should support dedicated credential routes (`/credentials/{id}`).
