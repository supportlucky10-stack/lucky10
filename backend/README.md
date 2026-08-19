# Lucky10 FastAPI Backend

Production-ready Python FastAPI backend powering the Lucky10 Customer & Admin domains.

## Requirements
- Python 3.10+
- PostgreSQL (or local SQLite fallback)

## Environment Setup
1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
2. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Run the development server:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```
4. Access API Documentation:
   - Swagger UI: http://localhost:8000/docs
   - ReDoc: http://localhost:8000/redoc

## Admin Provisioning
- **Production**: Set `ADMIN_USERNAME` and `ADMIN_PASSWORD` environment variables in Railway for initial admin creation.
- **Local Dev**: Configurable via `ADMIN_USERNAME` / `ADMIN_PASSWORD` environment variables.
