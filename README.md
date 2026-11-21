# ascendr.

**ascendr.** is a lightweight credential discovery platform designed to help learners discover, explore, and filter valuable learning credentials—including hands-on labs, skill courses, and structured learning paths.

The application pairs a high-performance **FastAPI** backend with a modern, responsive, dependency-free vanilla frontend.

---

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Technology Stack](#technology-stack)
- [Architecture](#architecture)
  - [Backend Architecture](#backend-architecture)
  - [Frontend Architecture](#frontend-architecture)
- [Project Directory Structure](#project-directory-structure)
- [Database & Search Implementation](#database--search-implementation)
  - [Schema Definition](#schema-definition)
  - [Full-Text Search (FTS5)](#full-text-search-fts5)
  - [In-Memory Placeholder Fallback](#in-memory-placeholder-fallback)
- [API Reference](#api-reference)
- [Installation & Local Setup](#installation--local-setup)
  - [Prerequisites](#prerequisites)
  - [Windows Setup](#windows-setup)
  - [macOS & Linux Setup](#macos--linux-setup)
  - [Running the Application](#running-the-application)
- [Supplying Data (`credentials.db`)](#supplying-data-credentialsdb)
- [Testing](#testing)
- [Contributing](#contributing)

---

## Overview

Ascendr brings educational credentials and structured skill pathways into a clean, searchable catalogue. Learners can search credentials by topic or keyword, refine listings by credential type, difficulty level, and duration, or explore staged learning paths from fundamentals through capstones.

---

## Key Features

- **Full-Text & Keyword Search:** Search credentials across titles and descriptions using SQLite FTS5 with prefix matching (`*`) and BM25 relevance ranking, with automatic fallback to SQL `LIKE` if FTS5 is not compiled into SQLite.
- **Multi-Faceted Filtering:**
  - **Type:** Filter by `lab` ("Hands-on lab"), `course` ("Skill course"), or `learning_path` ("Learning path"). Multi-selection supported via comma-delimited queries.
  - **Level:** Filter by `introductory`, `intermediate`, `advanced`, or `unspecified`.
  - **Duration Brackets:** Filter by estimated commitment (`<30m`, `<1h`, `1-3h`, `>3h`).
- **Flexible Sorting:** Sort results by relevance (BM25 or rank), shortest duration (`duration_asc`), longest duration (`duration_desc`), or alphabetically (`title_asc`, `title_desc`).
- **Paginated Results:** Configurable page size (defaults to 24 on the API, 12 on the catalogue UI; maximum 100).
- **Faceted Counters:** Dynamic count previews for every filter category via `/api/filters`.
- **Zero-Setup Placeholder Fallback:** If `credentials.db` is absent or empty, the application automatically initializes an in-memory SQLite database populated with demo data, signaling `"placeholder": true` to the client.
- **Smooth, Accessible UI:** Features smooth inertia scrolling powered by Lenis, accessible layout styling, reduced-motion media query support, and browser URL state synchronization for shareable search links.

---

## Technology Stack

### Backend
- **Language:** Python 3 (tested with Python 3.13)
- **Web Framework:** [FastAPI](https://fastapi.tiangolo.com/) (`>=0.115`)
- **ASGI Server:** [Uvicorn](https://www.uvicorn.org/) (`uvicorn[standard]>=0.30`)
- **Database:** SQLite 3 (Python standard library `sqlite3`) with SQLite FTS5 extension

### Frontend
- **Markup & Styling:** Vanilla HTML5, CSS3 (CSS custom properties, CSS Grid, Flexbox)
- **Client Scripting:** Modern ES6+ JavaScript (Fetch API, URLSearchParams, IntersectionObserver)
- **External CDN Dependencies:**
  - [Lenis v1.1.20](https://github.com/darkroomengineering/lenis) (smooth scrolling library)
  - Google Fonts (`EB Garamond` and `Figtree`)

### Deployment
- **Process Specification:** [Procfile](file:///c:/Users/acer/Desktop/ascendr/Procfile) for PaaS environments (e.g., Heroku, Render) using `$PORT`.

---

## Architecture

### Backend Architecture

The backend is implemented as a single, self-contained application module in [app.py](file:///c:/Users/acer/Desktop/ascendr/app.py):

1. **Routing & Delivery:**
   - Web routes serve the static HTML files (`/` serves `static/index.html`, `/catalogue` serves `static/catalogue.html`).
   - Static assets (`.css`, `.js`) are mounted under `/static` via Starlette `StaticFiles`.
   - Dedicated RESTful JSON endpoints reside under `/api/*`.
2. **Database Connection Management (`get_db()`):**
   - Reads `credentials.db` from the project root in **read-only mode** (`file:credentials.db?mode=ro`, URI mode, `check_same_thread=False`).
   - If `credentials.db` is missing, unreadable, or empty, it initializes an in-memory SQLite database (`:memory:`) populated with 8 sample placeholder rows.
   - Database operations are strictly read-only at runtime; no runtime write operations or mutations are executed.
3. **Query Engine:**
   - Tokenizes search queries via regex (`\w+`).
   - When FTS5 is available and relevance sort is requested, applies BM25 scoring (`bm25(credentials_fts)`).
   - Dynamically builds parameterized SQL `WHERE` clauses for multi-value facet filtering.

### Frontend Architecture

The frontend is built without build tools, bundlers, or frameworks:

- **[static/index.html](file:///c:/Users/acer/Desktop/ascendr/static/index.html) & [static/home.js](file:///c:/Users/acer/Desktop/ascendr/static/home.js):** Landing page displaying interactive preview cards, staged learning path cards, and recent credentials fetched from `/api/credentials?page_size=6`.
- **[static/catalogue.html](file:///c:/Users/acer/Desktop/ascendr/static/catalogue.html) & [static/catalogue.js](file:///c:/Users/acer/Desktop/ascendr/static/catalogue.js):** Search and catalogue interface with debounced search input, interactive filter pill buttons, sort dropdown, pagination controls, and placeholder status notification.
- **[static/common.js](file:///c:/Users/acer/Desktop/ascendr/static/common.js):** Shared helpers including the `api()` fetch wrapper, HTML escaping (`esc()`), credential card generation (`card()`), Lenis smooth scrolling initialization, and intersection observers for scroll animations.
- **[static/styles.css](file:///c:/Users/acer/Desktop/ascendr/static/styles.css):** Global design system with typography, color tokens, responsive media queries (mobile breakpoint at `860px`), and reduced-motion overrides.

---

## Project Directory Structure

```text
ascendr/
├── .freebuff/
│   ├── .gitignore             # Ignores Freebuff metadata
│   └── project-id             # Freebuff project identifier
├── .gitignore                 # Ignores __pycache__/ and .venv/
├── Procfile                   # Process definition for web deployment
├── requirements.txt           # Python application dependencies
├── app.py                     # Backend application (FastAPI + SQLite)
├── README.md                  # Project documentation
└── static/                    # Frontend client assets
    ├── index.html             # Landing page
    ├── catalogue.html         # Credential catalogue & search interface
    ├── styles.css             # Design styles, layout & responsive rules
    ├── common.js              # Shared client utilities & Lenis init
    ├── home.js                # Home page path rendering & demo data
    └── catalogue.js           # Catalogue UI logic (search, filters, pagination)
```

---

## Database & Search Implementation

### Schema Definition

The application expects a SQLite 3 database named `credentials.db` located at the project root with the following tables:

```sql
CREATE TABLE IF NOT EXISTS credentials(
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  duration TEXT,
  url TEXT,
  type TEXT,
  level TEXT,
  duration_minutes INTEGER,
  recommended INTEGER DEFAULT 0,
  rank INTEGER
);

CREATE VIRTUAL TABLE IF NOT EXISTS credentials_fts USING fts5(id, title, description);
```

#### Field Specifications:
- `id` (`TEXT PRIMARY KEY`): Unique identifier for the credential (e.g. `placeholder_1`).
- `title` (`TEXT NOT NULL`): The title of the credential.
- `description` (`TEXT`): Full summary or description of the credential.
- `duration` (`TEXT`): Human-readable duration string (e.g., `"25 min"`, `"2 hours"`).
- `url` (`TEXT`): External link to the credential or course source.
- `type` (`TEXT`): Category; expected values: `lab`, `course`, `learning_path`.
- `level` (`TEXT`): Difficulty level; expected values: `introductory`, `intermediate`, `advanced`, `unspecified` (stored in lowercase).
- `duration_minutes` (`INTEGER`): Numerical duration in minutes, used for range filtering and duration sorting.
- `recommended` (`INTEGER DEFAULT 0`): Flag indicating if the credential is recommended (1 or 0).
- `rank` (`INTEGER`): Priority ordering index. If absent, the query engine falls back to `1000000`.

### Full-Text Search (FTS5)

- Full-text searching uses the `credentials_fts` virtual table indexing `id`, `title`, and `description`.
- Queries are tokenized and appended with wildcard prefixes (`token*`) to support partial-word matching.
- When `sort=relevance` (the default), results are ordered by `bm25(credentials_fts)`.
- If `credentials_fts` does not exist in `sqlite_master`, the application gracefully falls back to SQL `LIKE` clauses: `(c.title LIKE ? OR c.description LIKE ?)`.

### In-Memory Placeholder Fallback

When `credentials.db` is not found, cannot be opened, or contains zero rows:
1. `app.py` initializes an in-memory SQLite database (`:memory:`).
2. It executes the schema and seeds 8 built-in placeholder credentials covering introductory, intermediate, and advanced labs, courses, and learning paths.
3. Every API response includes `"placeholder": true`.
4. A warning banner is displayed in the catalogue UI to notify users that placeholder data is active.

---

## API Reference

Interactive API documentation is automatically provided by FastAPI when the server is running:
- **Swagger UI:** `http://127.0.0.1:8000/docs`
- **ReDoc:** `http://127.0.0.1:8000/redoc`
- **OpenAPI JSON:** `http://127.0.0.1:8000/openapi.json`

### Endpoints

#### 1. System Health
- **`GET /api/health`**
  - **Description:** Verifies service health, active database provider, and total records.
  - **Response (200 OK):**
    ```json
    {
      "status": "ok",
      "database": "placeholder",
      "rows": 8
    }
    ```
    *(When `credentials.db` is loaded, `"database"` returns `"credentials.db"`)*.

#### 2. Query Credentials
- **`GET /api/credentials`**
  - **Description:** Searches, filters, sorts, and paginates credentials.
  - **Query Parameters:**
    - `q` (string, optional, default `""`): Search query string.
    - `type` (string, optional, default `"all"`): Comma-separated list of types (`lab`, `course`, `learning_path`).
    - `level` (string, optional, default `"all"`): Comma-separated list of levels (`introductory`, `intermediate`, `advanced`, `unspecified`).
    - `duration_bracket` (string, optional, default `"all"`): Comma-separated duration brackets (`<30m`, `<1h`, `1-3h`, `>3h`).
    - `sort` (string, optional, default `"relevance"`): Sorting rule (`relevance`, `duration_asc`, `duration_desc`, `title_asc`, `title_desc`).
    - `page` (integer, optional, default `1`, minimum `1`): Current page index.
    - `page_size` (integer, optional, default `24`, minimum `1`, maximum `100`): Results per page.
  - **Response (200 OK):**
    ```json
    {
      "total": 8,
      "page": 1,
      "page_size": 24,
      "placeholder": true,
      "items": [
        {
          "id": "placeholder_1",
          "title": "Placeholder: Cloud Fundamentals Lab",
          "description": "Placeholder description. Replace by filling credentials.db.",
          "type": "lab",
          "level": "introductory",
          "duration_minutes": 25,
          "url": null
        }
      ]
    }
    ```

#### 3. Get Single Credential
- **`GET /api/credentials/{cred_id}`**
  - **Description:** Retrieves the credential matching `cred_id`.
  - **Response (200 OK):** Returns the credential object.
  - **Response (404 Not Found):** `{"detail": "Credential not found"}`.

#### 4. Filter Facet Counts
- **`GET /api/filters`**
  - **Description:** Returns aggregate count breakdowns for each filter option based on current database content.
  - **Response (200 OK):**
    ```json
    {
      "type": {
        "lab": 3,
        "course": 3,
        "learning_path": 2
      },
      "level": {
        "introductory": 3,
        "intermediate": 3,
        "advanced": 2
      },
      "duration_bracket": {
        "<30m": 1,
        "<1h": 2,
        "1-3h": 2,
        ">3h": 3
      },
      "placeholder": true
    }
    ```

#### 5. Summary Statistics
- **`GET /api/stats`**
  - **Description:** Computes global stats across all stored credentials.
  - **Response (200 OK):**
    ```json
    {
      "total": 8,
      "by_type": {
        "lab": 3,
        "course": 3,
        "learning_path": 2
      },
      "avg_duration_minutes": 235,
      "placeholder": true
    }
    ```

#### 6. Static Pages
- **`GET /`**: Delivers the home landing page (`static/index.html`).
- **`GET /catalogue`**: Delivers the catalogue page (`static/catalogue.html`).

---

## Installation & Local Setup

### Prerequisites
- **Python 3.10+** (Python 3.13 recommended). Python's standard library includes SQLite 3 with FTS5 support.
- `pip` package manager.

### Windows Setup

1. Open PowerShell or Command Prompt and clone the repository:
   ```powershell
   git clone <repository-url>
   cd ascendr
   ```

2. Create a virtual environment:
   ```powershell
   python -m venv .venv
   ```

3. Activate the virtual environment:
   - **PowerShell:**
     ```powershell
     .\.venv\Scripts\Activate.ps1
     ```
     *(Note: If script execution is restricted, run `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass` first)*
   - **Command Prompt:**
     ```cmd
     .\.venv\Scripts\activate.bat
     ```

4. Install dependencies:
   ```powershell
   pip install -r requirements.txt
   ```

### macOS & Linux Setup

1. Open a terminal and clone the repository:
   ```bash
   git clone <repository-url>
   cd ascendr
   ```

2. Create a virtual environment:
   ```bash
   python3 -m venv .venv
   ```

3. Activate the virtual environment:
   ```bash
   source .venv/bin/activate
   ```

4. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

### Running the Application

You can start the local development server in either of two ways:

#### Option 1: Direct Python Execution
```bash
python app.py
```
This runs Uvicorn on `http://127.0.0.1:8000` with auto-reloading enabled.

#### Option 2: Using the Uvicorn CLI
```bash
uvicorn app:app --reload --host 127.0.0.1 --port 8000
```

Once running, access the web interface at:
- **Landing Page:** [http://127.0.0.1:8000/](http://127.0.0.1:8000/)
- **Catalogue:** [http://127.0.0.1:8000/catalogue](http://127.0.0.1:8000/catalogue)
- **API Documentation:** [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

#### Production / PaaS Execution
As defined in [Procfile](file:///c:/Users/acer/Desktop/ascendr/Procfile):
```bash
uvicorn app:app --host 0.0.0.0 --port $PORT
```

---

## Supplying Data (`credentials.db`)

To replace the built-in placeholder data with real credentials:

1. Create a SQLite 3 database named `credentials.db` in the repository root directory (alongside `app.py`).
2. Ensure it contains the `credentials` table (and optionally `credentials_fts`) conforming to the schema described in [Schema Definition](#schema-definition).
3. Populate the table with rows.
4. Restart `app.py`. The server will detect the file, connect in read-only mode, and set `"placeholder": false`.

---

## Testing

> [!NOTE]
> **Automated tests are not currently present in this repository.** There is no test suite (`pytest` or `unittest` scripts) or continuous integration workflow configured at this time.

To verify that the application is operating correctly:
1. Start the server and navigate to `http://127.0.0.1:8000/api/health`.
2. Confirm that the JSON response returns `"status": "ok"`.
3. Open `http://127.0.0.1:8000/catalogue` to verify that search, filtering, and sorting operate without console errors.

---

## Contributing

Contributions to Ascendr are welcome! Here is how to get started:

1. **Fork & Branch:** Create a feature branch off `main`:
   ```bash
   git checkout -b feature/your-feature-name
   ```
2. **Architecture Guidelines:**
   - Keep dependencies minimal. The backend relies solely on `fastapi` and `uvicorn`.
   - The frontend is intentionally vanilla: avoid introducing heavy bundlers or frontend frameworks unless agreed upon.
   - Database access is read-only at runtime; do not add runtime mutation endpoints without discussing data persistence strategies.
3. **Future Opportunities:**
   - Establishing an automated test suite (e.g. `pytest` test cases for `/api/*` endpoints and search fallbacks).
   - Providing an offline data ingestion/ETL script to generate and populate `credentials.db`.
   - Adding CI/CD pipelines (e.g. GitHub Actions) for linting and validation.
4. **Submitting Changes:** Ensure code is cleanly formatted and submit a pull request with a clear description of changes.
