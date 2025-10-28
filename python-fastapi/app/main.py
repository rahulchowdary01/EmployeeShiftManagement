from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

from app.routes.employees import router as employees_router
from app.routes.shifts import router as shifts_router
from app.routes.assignments import router as assignments_router
from app.routes.health import router as health_router

app = FastAPI(title="Employee Shift Management System", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

uploads_dir = os.getenv("UPLOADS_DIR", "/app/uploads")
os.makedirs(uploads_dir, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=uploads_dir), name="uploads")

app.include_router(health_router)
app.include_router(employees_router, prefix="/employees", tags=["employees"]) 
app.include_router(shifts_router, prefix="/shifts", tags=["shifts"]) 
app.include_router(assignments_router, prefix="/assignments", tags=["assignments"]) 
