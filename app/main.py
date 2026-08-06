from fastapi import FastAPI

app = FastAPI(
    title="Secure Esports Tournament Management Platform",
    version="1.0.0"
)

@app.get("/")
def home():
    return {
        "message": "Welcome to Secure Esports Tournament Management Platform"
    }