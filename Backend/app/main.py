from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os

from .routers import users, auth, profile, jobs, applications, admin
from .db.database import engine, Base

# Import models so tables are registered
from .models.user import User
from .models.profile import Profile
from .models.job import JobListing
from .models.application import CandidateApplication
from .models.interview import Interview


app = FastAPI()


# ================= CORS CONFIG ================= #

frontend_url = os.getenv("FRONTEND_URL")

origins = [
    "http://localhost:5173",       # local vite
    "http://127.0.0.1:5173",
]

# Add deployed frontend if available
if frontend_url:
    origins.append(frontend_url)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ================= ROUTES ================= #

@app.get("/")
def home():
    return {"message": "SmartHire backend running 🚀"}


app.include_router(users.router)
app.include_router(auth.router)
app.include_router(profile.router)
app.include_router(jobs.router)
app.include_router(applications.router)
app.include_router(admin.router)


# ================= OPTIONAL ================= #

# Uncomment only if needed (first time DB setup)
# Base.metadata.create_all(bind=engine)