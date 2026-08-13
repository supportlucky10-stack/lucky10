# Lucky10 — Full-Stack Application

Full-stack application architecture combining **React + TypeScript + Vite** on the frontend, **Python + FastAPI** on the backend, **PostgreSQL** for database persistence, and **Docker Compose** for orchestration.

## Architecture

```text
┌─────────────────┐       HTTP / REST       ┌─────────────────┐
│ React Frontend  │ <─────────────────────> │ FastAPI Backend │
│     :5173       │  (Authorization Bearer)  │     :8000       │
└─────────────────┘                         └────────┬────────┘
                                                     │
                                                     │ SQLAlchemy 2.x
                                                     ▼
                                            ┌─────────────────┐
                                            │   PostgreSQL    │
                                            │     :5432       │
                                            └─────────────────┘
```

- **Frontend**: `frontend/` (React + TypeScript + Vite)
- **Backend**: `backend/` (FastAPI + SQLAlchemy + JWT)
- **Database**: Single PostgreSQL database shared by Customer & Admin domains.

## Running with Docker Compose
```bash
docker-compose up --build
```

Access:
- Customer Application: http://localhost:5173/
- Admin Portal: http://localhost:5173/admin
- FastAPI Swagger Docs: http://localhost:8000/docs

## Running Locally

### 1. Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### 2. Frontend
```bash
cd frontend
npm install
npm run dev
```

## Default Credentials
- **Admin**: `admin` / `admin123`
- **Customer**: Click **Sign Up** on the customer sign in screen to register a fresh account.
