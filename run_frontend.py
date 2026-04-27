import uvicorn
from fastapi import FastAPI, Response
from fastapi.staticfiles import StaticFiles

app = FastAPI()

# Add a middleware to completely disable browser caching
@app.middleware("http")
async def disable_cache(request, call_next):
    response = await call_next(request)
    response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, max-age=0"
    response.headers["Pragma"] = "no-cache"
    response.headers["Expires"] = "0"
    return response

app.mount("/", StaticFiles(directory="frontend", html=True), name="frontend")

if __name__ == "__main__":
    print("\n" + "="*50)
    print(" SQL ATLAS FRONTEND DEV SERVER (NO CACHE)")
    print(" Go to: http://127.0.0.1:8080")
    print("="*50 + "\n")
    uvicorn.run(app, host="127.0.0.1", port=8080)
