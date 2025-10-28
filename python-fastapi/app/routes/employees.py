"""
Employee management API endpoints.

This module provides REST API endpoints for managing employees and departments
in the Employee Shift Management System. It handles CRUD operations for employees,
file uploads for profile pictures, and department management.
"""

from typing import List
from fastapi import APIRouter, HTTPException, Depends, UploadFile, File
from fastapi.responses import JSONResponse
import os
from sqlalchemy.orm import Session
import uuid  # Import uuid for generating unique filenames

# Import the database session dependency
from app.connectors.postgres import get_session

# Import Pydantic schemas for request/response validation
from app.schemas.common import EmployeeCreate, EmployeeRead, EmployeeUpdate, DepartmentRead

# Import the business logic functions (service layer)
from app.services.employees import (
    create_employee,
    list_employees,
    get_employee,
    update_employee,
    delete_employee,
    create_department,
    list_departments,
)

# Create a new router for all employee-related endpoints.
# This will likely be included in the main app, e.g., under the "/employees" prefix.
router = APIRouter()


def get_db():
    """
    A FastAPI dependency that creates and yields a database session per request.
    It uses the 'get_session' context manager to ensure the session is
    - Committed if the request is successful.
    - Rolled back if an exception occurs.
    - Always closed after the request is finished.
    """
    with get_session() as session:
        yield session

# --- Employee CRUD Endpoints ---

@router.post("/", response_model=EmployeeRead)
def create(payload: EmployeeCreate, db: Session = Depends(get_db)):
    """
    Create a new employee.
    - 'payload' is the JSON request body, validated against the EmployeeCreate schema.
    - 'response_model' ensures the returned employee data is filtered by the EmployeeRead schema.
    """
    return create_employee(db, payload)

@router.get("/", response_model=List[EmployeeRead])
def list_(db: Session = Depends(get_db)):
    """
    Get a list of all employees.
    - 'response_model' ensures the return is a JSON list, with each
      object conforming to the EmployeeRead schema.
    """
    return list_employees(db)

@router.get("/{employee_id}", response_model=EmployeeRead)
def get(employee_id: int, db: Session = Depends(get_db)):
    """
    Get a single employee by their ID.
    - 'employee_id' is taken from the URL path.
    """
    emp = get_employee(db, employee_id)
    # If the employee doesn't exist, return a 404 Not Found error
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")
    return emp

@router.patch("/{employee_id}", response_model=EmployeeRead)
def update(employee_id: int, payload: EmployeeUpdate, db: Session = Depends(get_db)):
    """
    Update an employee's details by their ID.
    - 'payload' is the JSON request body, validated against the EmployeeUpdate schema.
      (PATCH implies partial updates are allowed).
    """
    emp = update_employee(db, employee_id, payload)
    # If the employee doesn't exist, return a 404 Not Found error
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")
    return emp

@router.delete("/{employee_id}")
def delete(employee_id: int, db: Session = Depends(get_db)):
    """
    Delete an employee by their ID.
    """
    ok = delete_employee(db, employee_id)
    # If deletion failed (e.g., employee not found), return a 404
    if not ok:
        raise HTTPException(status_code=404, detail="Employee not found")
    # On success, return a confirmation message
    return {"deleted": True}

# --- Department Endpoints ---

@router.post("/departments", response_model=DepartmentRead)
def create_dept(name: str, db: Session = Depends(get_db)):
    """
    Create a new department.
    - 'name' is expected as a query parameter or form data (e.g., POST .../departments?name=Engineering).
    """
    # Note: For a JSON body, you'd typically use a Pydantic model like in `create_employee`.
    return create_department(db, name)

@router.get("/departments", response_model=List[DepartmentRead])
def list_dept(db: Session = Depends(get_db)):
    """
    Get a list of all departments.
    """
    return list_departments(db)

# --- File Upload Endpoint ---

@router.post("/upload-avatar")
async def upload_avatar(file: UploadFile = File(...)):
    """
    Upload an avatar image for an employee.
    This endpoint saves the file to a configured directory and returns its relative URL.
    - 'async def' is used because 'file.read()' is an async operation.
    - 'File(...)' indicates a required file upload.
    """
    # Get the target directory from an environment variable, with a default
    uploads_dir = os.getenv("UPLOADS_DIR", "/app/uploads")
    
    # Create the directory if it doesn't already exist
    os.makedirs(uploads_dir, exist_ok=True)
    
    name = file.filename or "avatar"
    
    # Create a unique, safe filename to prevent overwrites and security issues
    # e.g., "d2c1f0-avatar.png" instead of just "avatar.png"
    safe_name = f"{uuid.uuid4().hex}_{name.replace('/', '_')}"
    
    # Define the full path to save the file
    path = os.path.join(uploads_dir, safe_name)
    
    try:
        # Open the file in binary write mode ('wb')
        with open(path, "wb") as f:
            # Read the file content asynchronously and write it to the new file
            f.write(await file.read())
            
    except Exception as e:
        # Handle potential file writing errors
        raise HTTPException(status_code=500, detail=f"Failed to save file: {e}")
        
    # Return the relative URL, which the frontend can use to link to the image
    # (assuming '/uploads' is served as a static directory)
    return {"url": f"/uploads/{safe_name}"}