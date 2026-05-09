from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import config
from routes.routes import router

app = FastAPI(
    title="SQL Atlas API (PostgreSQL Edition)",
    description="Backend API for the SQL Atlas geography learning game, powered by Neon Postgres.",
    version="2.0.0",
)

origins = config.origins.split(',') if config.origins and config.origins != '*' else ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router, prefix="/api")

@app.get("/")
def read_root():
    return {"message": "SQL Atlas API is Live. Go to /docs for Swagger UI!"}
