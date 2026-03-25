# =============================================================================
# app.py  —  SQL Atlas  |  FastAPI Application Entry Point
# =============================================================================
# PURPOSE:
#   This is the root of the backend server. It creates the FastAPI app,
#   registers all routes, configures CORS, and starts the server.
#
# HOW TO RUN (from the /backend folder):
#   uvicorn app:app --reload --port 8000
#
# The API will be available at:  http://localhost:8000
# Auto-generated docs at:        http://localhost:8000/docs
# =============================================================================

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routes import router
from db import create_tables

# -----------------------------------------------------------------------------
# 1. Create the FastAPI application instance
# -----------------------------------------------------------------------------
app = FastAPI(
    title="SQL Atlas API",
    description="Backend API for the SQL Atlas geography learning game.",
    version="1.0.0",
)

# -----------------------------------------------------------------------------
# 2. CORS — allow the frontend (running on a different port/domain) to call us
#    TODO: In production, replace "*" with your actual Vercel/Netlify frontend URL
#    Example: allow_origins=["https://sql-atlas.vercel.app"]
# -----------------------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],          # <-- tighten this in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -----------------------------------------------------------------------------
# 3. Register all API routes (defined in routes.py)
#    All routes will be prefixed with /api
# -----------------------------------------------------------------------------
app.include_router(router, prefix="/api")

# -----------------------------------------------------------------------------
# 4. Startup event — runs once when the server starts
#    Creates DB tables if they don't already exist
# -----------------------------------------------------------------------------
@app.on_event("startup")
async def on_startup():
    create_tables()

# -----------------------------------------------------------------------------
# 5. Health-check root route — useful to confirm the server is alive
# -----------------------------------------------------------------------------
@app.get("/")
def root():
    return {"status": "SQL Atlas API is running 🌍"}
