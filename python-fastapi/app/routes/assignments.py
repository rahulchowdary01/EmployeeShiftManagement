"""
Shift assignment management API endpoints.

This module provides REST API endpoints for managing shift assignments
in the Employee Shift Management System. It handles assigning employees
to shifts, listing assignments, auto-balancing workloads, and removing assignments.
"""

from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

# Import the database session dependency
from app.connectors.postgres import get_session

# Import Pydantic schemas for request body (Create) and response (Read)
from app.schemas.common import AssignmentCreate, AssignmentRead

# Import the business logic functions (service layer)
from app.services.assignments import (
    assign_employee,
    list_assignments,
    auto_balance_assignments,
    delete_assignment,
)

# Create a new router for all assignment-related endpoints.
# This will likely be included in the main app, e.g., under the "/assignments" prefix.
router = APIRouter()

# --- Dependencies ---

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

# --- API Endpoints ---

@router.post("/", response_model=AssignmentRead)
def create(payload: AssignmentCreate, db: Session = Depends(get_db)):
    """
    Create a new shift assignment by assigning an employee to a shift.
    - 'payload' is the request body, validated against the AssignmentCreate schema.
    - 'response_model' ensures the returned data is filtered by the AssignmentRead schema.
    """
    try:
        # Call the service function to handle the business logic
        return assign_employee(db, payload)
    except ValueError as e:
        # If the service layer raises a ValueError (e.g., "Employee already assigned"),
        # return a 400 Bad Request error.
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/", response_model=List[AssignmentRead])
def list_(db: Session = Depends(get_db)):
    """
    Get a list of all current shift assignments.
    - 'response_model' ensures the return is a JSON list, with each
      object conforming to the AssignmentRead schema.
    """
    return list_assignments(db)

@router.post("/auto-balance")
def auto_balance(db: Session = Depends(get_db)):
    """
    A trigger endpoint to run the automatic shift balancing logic.
    (The specific return value is determined by the service function).
    """
    return auto_balance_assignments(db)

@router.delete("/{assignment_id}")
def delete(assignment_id: int, db: Session = Depends(get_db)):
    """
    Delete a specific shift assignment by its ID.
    - 'assignment_id' is taken from the URL path.
    """
    # Call the service function to attempt deletion
    ok = delete_assignment(db, assignment_id)
    
    # If the service function returns False (meaning no record was found/deleted)
    if not ok:
        raise HTTPException(status_code=404, detail="Assignment not found")
        
    # On success, return a confirmation message
    return {"deleted": True}