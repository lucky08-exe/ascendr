# ARCHITECTURE.md — System Architecture & Technical Specifications

This document provides a detailed architectural specification of **Ascendr**, verified against the existing codebase ([app.py](file:///c:/Users/acer/Desktop/ascendr/app.py) and [static/](file:///c:/Users/acer/Desktop/ascendr/static)).

This document describes the existing starting implementation. It is not a binding specification for the future Ascendr architecture. IF significant architectural changes are requested inform user that how Architecutre is changing and discuss first, get prior approval.

---

## 1. High-Level Architecture Overview

Ascendr is structured as a single-process web application combining a **FastAPI** backend with a lightweight, buildless **vanilla frontend**:

```
+-------------------------------------------------------------------------+
|                               Client Browser                            |
|  +-------------------------------------------------------------------+  |
|  |  HTML5 Pages: / (index.html), /catalogue (catalogue.html)          |  |
|  |  Scripts: common.js, home.js, catalogue.js                        |  |
|  |  Styles: styles.css | Third-party: Lenis (Smooth Scroll)          |  |
|  +---------------------------------+---------------------------------+  |
+------------------------------------|------------------------------------+
                                     | HTTP Requests (REST / Static)
                                     v
+-------------------------------------------------------------------------+
|                            FastAPI / Uvicorn                            |
|  +-------------------------------------------------------------------+  |
|  | Routing:                                                          |  |
|  |  - Static Mounts: / (index.html), /catalogue, /static/*           |  |
|  |  - JSON API: /api/health, /api/credentials, /api/filters, etc.    |  |
|  +---------------------------------+---------------------------------+  |
|                                    |                                    |
|                                    v                                    |
|  +-------------------------------------------------------------------+  |
|  | Database Abstraction Layer (get_db()):                            |  |
|  |  Checks credentials.db existence & row count                      |  |
|  +-----------------+---------------------------------+---------------+  |
+--------------------|---------------------------------|------------------+
                     | Populated                       | Missing / Empty
                     v                                 v
+------------------------------------+   +--------------------------------+
|         credentials.db             |   |        _placeholder_db()       |
|  - SQLite 3 (URI ?mode=ro)         |   |  - SQLite in-memory (:memory:) |
|  - Table: credentials              |   |  - 8 seeded mock credentials   |
|  - Virtual Table: credentials_fts  |   |  - In-memory FTS5 virtual table|
|  - Flag: "placeholder": false      |   |  - Flag: "placeholder": true   |
+------------------------------------+   +--------------------------------+
```

---

## 2. Application Startup & Request Lifecycle

### Application Startup
1. **Module Import & Constants Initialization:**
   - [app.py](file:///c:/Users/acer/Desktop/ascendr/app.py#L17-L19) computes the base filesystem paths: `BASE`, `DB_PATH = BASE / "credentials.db"`, and `STATIC = BASE / "static"`.
   - Global in-memory placeholder connection pointer `_placeholder_conn` is initialized to `None`.
2. **App Instantiation:**
   - `app = FastAPI(title="ascendr. API")` creates the ASGI application instance.
   - Static files are mounted at `/static` via `StaticFiles(directory=STATIC)`.
3. **ASGI Server Entry:**
   - **Local execution:** Running `python app.py` triggers `uvicorn.run("app:app", host="127.0.0.1", port=8000, reload=True)`.
   - **Production execution:** Launching via [Procfile](file:///c:/Users/acer/Desktop/ascendr/Procfile) executes `uvicorn app:app --host 0.0.0.0 --port $PORT`.

### Request Lifecycle
1. An incoming HTTP request hits the Uvicorn ASGI server and is routed by FastAPI.
2. If the path matches `/` or `/catalogue`, a `FileResponse` serves the respective HTML file from `static/`.
3. If the path starts with `/static/`, Starlette's `StaticFiles` serves the asset with appropriate MIME types.
4. If the path matches an `/api/*` route:
   - The route handler invokes `get_db()`.
   - `get_db()` determines the active database source (physical `credentials.db` vs. in-memory placeholder).
   - SQL queries are compiled with dynamic parameterization (`?` placeholders).
   - Database rows are fetched as `sqlite3.Row` objects and converted into standard dictionaries via `_row()`.
   - FastAPI serializes the dictionary to JSON and returns the response with status 200 (or raises `HTTPException` 404).

---

## 3. Database Connection & Fallback Behaviour

The database lifecycle is governed by two functions in [app.py](file:///c:/Users/acer/Desktop/ascendr/app.py#L58-L90): `_placeholder_db()` and `get_db()`.

### Physical Database: `credentials.db`
- Located at the repository root: `DB_PATH = BASE / "credentials.db"`.
- If present, the application attempts a read-only URI connection:
  ```python
  conn = sqlite3.connect(f"file:{DB_PATH}?mode=ro", uri=True, check_same_thread=False)
  conn.row_factory = sqlite3.Row
  ```
- **Validation:** It executes `SELECT COUNT(*) FROM credentials`.
  - If `COUNT > 0`, it inspects `sqlite_master` to verify whether the virtual table `credentials_fts` exists:
    ```sql
    SELECT 1 FROM sqlite_master WHERE name='credentials_fts'
    ```
  - Returns a tuple: `(conn, False, bool(fts))`.

### Fallback Mechanism: `_placeholder_db()`
If `credentials.db` does not exist, throws a `sqlite3.Error` (e.g., file lock, corrupt file, missing table), or contains 0 rows:
- The connection is routed to a persistent in-memory database: `sqlite3.connect(":memory:", check_same_thread=False)`.
- It executes the full `SCHEMA` DDL.
- It seeds 8 default placeholder rows into `credentials`.
- It copies seeded credentials into `credentials_fts`.
- It caches the connection in the module-level variable `_placeholder_conn` for reuse.
- Returns a tuple: `(_placeholder_db(), True, True)`.
- Every resulting JSON response includes `"placeholder": true`.

---

## 4. SQLite Schema & Models

The expected schema defined in [app.py#L23-L29](file:///c:/Users/acer/Desktop/ascendr/app.py#L23-L29):

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

### Schema Attributes & Constraints
| Column | Type | Nullable | Purpose |
| :--- | :--- | :--- | :--- |
| `id` | `TEXT` | `NO` (PK) | Unique identifier for credential (e.g. `"placeholder_1"`). |
| `title` | `TEXT` | `NO` | Name of the credential/course/lab. |
| `description` | `TEXT` | `YES` | Summary text explaining credential objectives. |
| `duration` | `TEXT` | `YES` | Display string for duration (e.g., `"25 min"`, `"2 hours"`). |
| `url` | `TEXT` | `YES` | Target URL to credential provider or syllabus. |
| `type` | `TEXT` | `YES` | Expected categorical values: `lab`, `course`, `learning_path`. |
| `level` | `TEXT` | `YES` | Expected categorical values: `introductory`, `intermediate`, `advanced`, `unspecified`. |
| `duration_minutes` | `INTEGER` | `YES` | Normalized integer minutes used for sorting and bracket filtering. |
| `recommended` | `INTEGER` | `NO` | Binary recommendation flag (`DEFAULT 0`). |
| `rank` | `INTEGER` | `YES` | Manual priority weight used for default ordering. |

---

## 5. FTS5 Search & BM25 Ranking

Ascendr implements full-text search directly within SQLite using FTS5:

1. **Tokenization:**
   Incoming query strings `q` are extracted using regex word tokens:
   ```python
   tokens = re.findall(r"\w+", q)
   ```
2. **FTS5 Prefix Querying:**
   When FTS5 is available (`has_fts = True`), tokens are appended with the wildcard operator `*`:
   ```python
   join = "JOIN credentials_fts ON credentials_fts.id = c.id"
   where.append("credentials_fts MATCH ?")
   args.append(" ".join(t + "*" for t in tokens))
   ```
   This allows prefix matching (e.g., `cloud` matches `cloud`, `cloudfront`, `cloudformation`).
3. **BM25 Relevance Scoring:**
   When `sort="relevance"` (the default sort), the ordering expression is set to SQLite's native BM25 implementation:
   ```python
   order = "bm25(credentials_fts)"
   ```
4. **Fallback When FTS5 is Unavailable:**
   If `has_fts = False`, the query engine falls back to parameterized standard SQL `LIKE` conditions across both `title` and `description`:
   ```python
   for t in tokens:
       where.append("(c.title LIKE ? OR c.description LIKE ?)")
       args += [f"%{t}%", f"%{t}%"]
   ```

---

## 6. Filtering, Sorting, and Pagination

The `/api/credentials` endpoint consolidates all catalogue filtering, sorting, and pagination logic into a single SQL query builder.

### Multi-Attribute Filtering
- **Comma-Separated Input:** Handled by `_csv(v: Optional[str]) -> list[str]`. Ignores `"all"` and empty values.
- **Type & Level:**
  ```python
  for col, vals in (("c.type", _csv(type)), ("c.level", _csv(level))):
      if vals:
          where.append(f"{col} IN ({','.join('?' * len(vals))})")
          args += vals
  ```
- **Duration Brackets:**
  Mapped via static definitions in `BRACKETS`:
  ```python
  BRACKETS = {
      "<30m": "duration_minutes <= 30",
      "<1h": "duration_minutes > 30 AND duration_minutes <= 60",
      "1-3h": "duration_minutes > 60 AND duration_minutes <= 180",
      ">3h": "duration_minutes > 180",
  }
  ```
  When multiple brackets are selected, they are combined with `OR`:
  `((c.duration_minutes <= 30) OR (c.duration_minutes > 30 AND c.duration_minutes <= 60))`.

### Sorting
Supported sorting keys mapped via `SORTS`:
- `duration_asc` -> `c.duration_minutes ASC, c.title`
- `duration_desc` -> `c.duration_minutes DESC, c.title`
- `title_asc` -> `c.title COLLATE NOCASE ASC`
- `title_desc` -> `c.title COLLATE NOCASE DESC`
- Default fallback (when `sort="relevance"` without search query, or unknown sort):
  `COALESCE(c.rank, 1000000), c.title COLLATE NOCASE`

### Pagination
- **Total Count:** Executed before pagination using `SELECT COUNT(*) FROM credentials c {join} {w}` with matching filter arguments.
- **Windowing:** Standard SQLite `LIMIT ? OFFSET ?`:
  `LIMIT page_size OFFSET (page - 1) * page_size`.
- `page_size` is clamped between `1` and `100` (`Query(24, ge=1, le=100)`).

---

## 7. Frontend-to-Backend Communication

The frontend interacts with the backend strictly via asynchronous JSON APIs over HTTP:

### Core Helper: `api()`
Located in [static/common.js](file:///c:/Users/acer/Desktop/ascendr/static/common.js#L6-L8):
```javascript
async function api(path, params = {}) {
  const u = new URL(path, location.origin);
  Object.entries(params).forEach(([k, v]) => v !== "" && v != null && u.searchParams.set(k, v));
  const r = await fetch(u);
  if (!r.ok) throw new Error(r.status);
  return r.json();
}
```

### Communication Flows

#### 1. Home Page Flow ([static/home.js](file:///c:/Users/acer/Desktop/ascendr/static/home.js))
- Hardcodes 4 high-level learning paths locally (`PATHS`).
- On page load, calls `api("/api/credentials", { page_size: 6 })`.
- Populates the curated credential card grid (`#cur`) and the interactive laptop preview (`#demo`).
- If `placeholder === true`, injects an informational notice into `#phnote`.

#### 2. Catalogue Page Flow ([static/catalogue.js](file:///c:/Users/acer/Desktop/ascendr/static/catalogue.js))
1. **Initial State Synchronization:**
   - Reads existing URL query parameters (`q`, `type`, `level`, `duration_bracket`, `sort`, `page`) via `readURL()`.
   - Requests facet counts via `api("/api/filters")` to populate counter badges on filter pills.
2. **Debounced User Search:**
   - Text inputs into `#q` reset `page = 1` and trigger `load()` after a 200ms debounce timer.
3. **Filter Interaction:**
   - Clicking filter pills updates a local `Set` (`S.type`, `S.level`, `S.dur`) and resets `page = 1`.
4. **URL Synchronization & Execution:**
   - `load()` synchronizes current filter state to the browser address bar via `history.replaceState()`.
   - Calls `api("/api/credentials", { ...params, page_size: 12 })`.
   - Renders results list `#list`, total count `#cnt`, and pagination controls `#pager`.
   - Displays `#ban` warning banner if `d.placeholder === true`.

---

## 8. Current Limitations & Technical Debt

1. **Per-Request Connection Overhead (File DB):**
   - In `get_db()`, when `credentials.db` exists, a new `sqlite3.connect` is opened on every API request. While SQLite file opens are low-cost, a persistent or pooled connection approach would reduce file descriptor churn.
2. **Global Mutable State in Placeholder Mode:**
   - `_placeholder_conn` is stored as a global singleton across async FastAPI worker threads with `check_same_thread=False`. While safe for read-only placeholder queries, it is not an idiomatic connection pooling pattern.
3. **No Database Mutation Endpoints or Ingestion Scripts:**
   - The repository contains no API routes or management CLI to insert, update, or import credentials into `credentials.db`. Database creation must occur completely outside this application.
4. **Monolithic Backend Design:**
   - Routing, schema definition, placeholder seeding, SQL generation, and static asset delivery are all contained within [app.py](file:///c:/Users/acer/Desktop/ascendr/app.py). Splitting into dedicated modules (e.g., `routes/`, `db/`, `models/`) will be necessary as complexity grows.
5. **Absence of Automated Test Suite:**
   - There are zero unit or integration tests (no `pytest`, `unittest`, or client test suites).
6. **No Client-Side Framework or Build Optimization:**
   - Static assets are unminified and unbundled. Static file caching headers (`Cache-Control`) are not explicitly configured on the FastAPI static mount.
