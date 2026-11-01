"""ascendr. — FastAPI backend + static frontend.

Reads credentials.db (SQLite). If the file is missing or the `credentials`
table is empty, the API transparently serves built-in placeholder rows
(responses carry "placeholder": true). Drop in a populated credentials.db
and restart; no code changes needed as long as the schema below matches.
"""
import re
import sqlite3
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, HTTPException, Query
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

BASE = Path(__file__).parent
DB_PATH = BASE / "credentials.db"
STATIC = BASE / "static"

# Expected schema. type: lab | course | learning_path
# level: introductory | intermediate | advanced | unspecified (lowercase)
SCHEMA = """
CREATE TABLE IF NOT EXISTS credentials(
  id TEXT PRIMARY KEY, title TEXT NOT NULL, description TEXT, duration TEXT,
  url TEXT, type TEXT, level TEXT, duration_minutes INTEGER,
  recommended INTEGER DEFAULT 0, rank INTEGER);
CREATE VIRTUAL TABLE IF NOT EXISTS credentials_fts USING fts5(id, title, description);
"""

PLACEHOLDERS = [
    ("Placeholder: Cloud Fundamentals Lab", "lab", "introductory", 25),
    ("Placeholder: Working with Containers", "lab", "intermediate", 50),
    ("Placeholder: Networking Essentials", "course", "introductory", 120),
    ("Placeholder: Data Analytics Foundations", "course", "introductory", 90),
    ("Placeholder: Machine Learning Workflows", "course", "advanced", 240),
    ("Placeholder: Security Fundamentals", "lab", "intermediate", 45),
    ("Placeholder: Cloud Engineer Path", "learning_path", "intermediate", 600),
    ("Placeholder: Data Engineer Path", "learning_path", "advanced", 720),
]

BRACKETS = {
    "<30m": "duration_minutes <= 30",
    "<1h": "duration_minutes > 30 AND duration_minutes <= 60",
    "1-3h": "duration_minutes > 60 AND duration_minutes <= 180",
    ">3h": "duration_minutes > 180",
}
SORTS = {
    "duration_asc": "c.duration_minutes ASC, c.title",
    "duration_desc": "c.duration_minutes DESC, c.title",
    "title_asc": "c.title COLLATE NOCASE ASC",
    "title_desc": "c.title COLLATE NOCASE DESC",
}

_placeholder_conn: Optional[sqlite3.Connection] = None


def _placeholder_db() -> sqlite3.Connection:
    global _placeholder_conn
    if _placeholder_conn is None:
        c = sqlite3.connect(":memory:", check_same_thread=False)
        c.row_factory = sqlite3.Row
        c.executescript(SCHEMA)
        c.executemany(
            "INSERT INTO credentials(id,title,description,type,level,duration_minutes,url)"
            " VALUES(?,?,?,?,?,?,NULL)",
            [(f"placeholder_{i}", t, "Placeholder description. Replace by filling credentials.db.", k, l, m)
             for i, (t, k, l, m) in enumerate(PLACEHOLDERS, 1)],
        )
        c.execute("INSERT INTO credentials_fts(id,title,description)"
                  " SELECT id,title,description FROM credentials")
        _placeholder_conn = c
    return _placeholder_conn


def get_db():
    """Return (connection, is_placeholder, has_fts)."""
    if DB_PATH.exists():
        try:
            conn = sqlite3.connect(f"file:{DB_PATH}?mode=ro", uri=True, check_same_thread=False)
            conn.row_factory = sqlite3.Row
            n = conn.execute("SELECT COUNT(*) FROM credentials").fetchone()[0]
            if n > 0:
                fts = conn.execute(
                    "SELECT 1 FROM sqlite_master WHERE name='credentials_fts'").fetchone()
                return conn, False, bool(fts)
            conn.close()
        except sqlite3.Error:
            pass  # missing table / unreadable file -> placeholders
    return _placeholder_db(), True, True


def _csv(v: Optional[str]) -> list[str]:
    return [x.strip() for x in (v or "").split(",") if x.strip() and x.strip() != "all"]


def _row(r: sqlite3.Row) -> dict:
    return {k: r[k] for k in ("id", "title", "description", "type", "level", "duration_minutes", "url")}


app = FastAPI(title="ascendr. API")


@app.get("/api/health")
def health():
    conn, ph, _ = get_db()
    n = conn.execute("SELECT COUNT(*) FROM credentials").fetchone()[0]
    return {"status": "ok", "database": "placeholder" if ph else "credentials.db", "rows": n}


@app.get("/api/credentials")
def credentials(
    q: str = "", type: str = "all", level: str = "all",
    duration_bracket: str = "all", sort: str = "relevance",
    page: int = Query(1, ge=1), page_size: int = Query(24, ge=1, le=100),
):
    conn, ph, has_fts = get_db()
    where, args, join = [], [], ""
    order = "COALESCE(c.rank, 1000000), c.title COLLATE NOCASE"
    tokens = re.findall(r"\w+", q)
    if tokens:
        if has_fts:
            join = "JOIN credentials_fts ON credentials_fts.id = c.id"
            where.append("credentials_fts MATCH ?")
            args.append(" ".join(t + "*" for t in tokens))
            if sort == "relevance":
                order = "bm25(credentials_fts)"
        else:
            for t in tokens:
                where.append("(c.title LIKE ? OR c.description LIKE ?)")
                args += [f"%{t}%", f"%{t}%"]
    for col, vals in (("c.type", _csv(type)), ("c.level", _csv(level))):
        if vals:
            where.append(f"{col} IN ({','.join('?' * len(vals))})")
            args += vals
    br = [BRACKETS[b] for b in _csv(duration_bracket) if b in BRACKETS]
    if br:
        where.append("(" + " OR ".join(f"({b.replace('duration_minutes', 'c.duration_minutes')})" for b in br) + ")")
    order = SORTS.get(sort, order)  # unknown/relevance keeps default above
    w = ("WHERE " + " AND ".join(where)) if where else ""
    total = conn.execute(f"SELECT COUNT(*) FROM credentials c {join} {w}", args).fetchone()[0]
    rows = conn.execute(
        f"SELECT c.* FROM credentials c {join} {w} ORDER BY {order} LIMIT ? OFFSET ?",
        args + [page_size, (page - 1) * page_size],
    ).fetchall()
    return {"total": total, "page": page, "page_size": page_size,
            "placeholder": ph, "items": [_row(r) for r in rows]}


@app.get("/api/credentials/{cred_id}")
def credential(cred_id: str):
    conn, _, _ = get_db()
    r = conn.execute("SELECT * FROM credentials WHERE id=?", (cred_id,)).fetchone()
    if not r:
        raise HTTPException(404, "Credential not found")
    return _row(r)


@app.get("/api/filters")
def filters():
    conn, ph, _ = get_db()
    count = lambda col: {r[0] or "unspecified": r[1] for r in
                         conn.execute(f"SELECT {col}, COUNT(*) FROM credentials GROUP BY {col}")}
    dur = {k: conn.execute(f"SELECT COUNT(*) FROM credentials WHERE {v}").fetchone()[0]
           for k, v in BRACKETS.items()}
    return {"type": count("type"), "level": count("level"), "duration_bracket": dur, "placeholder": ph}


@app.get("/api/stats")
def stats():
    conn, ph, _ = get_db()
    total, avg = conn.execute("SELECT COUNT(*), AVG(duration_minutes) FROM credentials").fetchone()
    by = {r[0]: r[1] for r in conn.execute("SELECT type, COUNT(*) FROM credentials GROUP BY type")}
    return {"total": total, "by_type": by, "avg_duration_minutes": round(avg or 0), "placeholder": ph}


@app.get("/", include_in_schema=False)
def home():
    return FileResponse(STATIC / "index.html")


@app.get("/catalogue", include_in_schema=False)
def catalogue():
    return FileResponse(STATIC / "catalogue.html")


app.mount("/static", StaticFiles(directory=STATIC), name="static")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="127.0.0.1", port=8000, reload=True)
