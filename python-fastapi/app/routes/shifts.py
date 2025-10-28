"""
Shift management API endpoints.

This module provides REST API endpoints for managing work shifts
in the Employee Shift Management System. It handles CRUD operations
for shifts including creation, listing, retrieval, and deletion.
"""

from typing import List
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session

# Import the database session dependency
from app.connectors.postgres import get_session

# Import Pydantic schemas for request body (Create) and response (Read)
from app.schemas.common import ShiftCreate, ShiftRead

# Import the business logic functions (service layer)
from app.services.shifts import create_shift, list_shifts, get_shift, delete_shift

# Create a new router for all shift-related endpoints.
# This will likely be included in the main app, e.g., under the "/shifts" prefix.
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

# --- Shift CRUD Endpoints ---

@router.post("/", response_model=ShiftRead)
def create(payload: ShiftCreate, db: Session = Depends(get_db)):
    """
    Create a new shift.
    - 'payload' is the JSON request body, validated against the ShiftCreate schema.
    - 'response_model' ensures the returned data is filtered by the ShiftRead schema.
    """
    return create_shift(db, payload)

@router.get("/", response_model=List[ShiftRead])
def list_(db: Session = Depends(get_db)):
    """
    Get a list of all shifts.
    - 'response_model' ensures the return is a JSON list, with each
      object conforming to the ShiftRead schema.
    """
    return list_shifts(db)

@router.get("/{shift_id}", response_model=ShiftRead)
def get(shift_id: int, db: Session = Depends(get_db)):
    """
    Get a single shift by its ID.
    - 'shift_id' is taken from the URL path.
    """
    sh = get_shift(db, shift_id)
    
    # If the shift doesn't exist, return a 404 Not Found error
    if not sh:
        raise HTTPException(status_code=404, detail="Shift not found")
    
    return sh

@router.delete("/{shift_id}")
def delete(shift_id: int, db: Session = Depends(get_db)):
    """
    Delete a shift by its ID.
    """
    # Attempt to delete the shift using the service function
    ok = delete_shift(db, shift_id)
    
    # If the service returns False (not found or not deleted), raise a 404
    if not ok:
        raise HTTPException(status_code=404, detail="Shift not found")
        
    # On success, return a confirmation message
    return {"deleted": True}