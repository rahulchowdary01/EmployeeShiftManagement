from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes.employees import router as employees_router
from app.routes.shifts import router as shifts_router
from app.routes.assignments import router as assignments_router
from app.routes.health import router as health_router

app = FastAPI(title="Employee Shift Management System", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_router)
app.include_router(employees_router, prefix="/employees", tags=["employees"]) 
app.include_router(shifts_router, prefix="/shifts", tags=["shifts"]) 
app.include_router(assignments_router, prefix="/assignments", tags=["assignments"]) 
