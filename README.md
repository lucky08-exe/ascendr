# ascendr.
FastAPI + static frontend. Run: `pip install -r requirements.txt && python app.py` → http://127.0.0.1:8000
Routes: `/` landing, `/catalogue`, `/api/{health,credentials,credentials/{id},filters,stats}`, `/docs`.
Put your `credentials.db` next to `app.py`. Empty/missing DB → placeholder rows (`"placeholder": true`).
