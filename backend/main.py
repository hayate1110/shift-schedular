from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware

from auth.dependencies import get_current_user
from database import engine
from models import Base, User
from routers.auth import router as auth_router
from routers.users import router as users_router
from routers.shift_preferences import router as shift_preferences_router
from routers.shifts import router as shifts_router

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Shift Management API",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://shift-schedular-one.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(users_router)
app.include_router(shift_preferences_router)
app.include_router(shifts_router)

@app.get("/")
def read_root():
    return {"message": "Shift Management API"}


