from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.connectors.postgres import get_session
from app.schemas.common import AssignmentCreate, AssignmentRead
from app.services.assignments import assign_employee, list_assignments, auto_balance_assignments

router = APIRouter()

def get_db():
    with get_session() as session:
        yield session

@router.post("/", response_model=AssignmentRead)
def create(payload: AssignmentCreate, db: Session = Depends(get_db)):
    return assign_employee(db, payload)

@router.get("/", response_model=List[AssignmentRead])
def list_(db: Session = Depends(get_db)):
    return list_assignments(db)

@router.post("/auto-balance")
def auto_balance(db: Session = Depends(get_db)):
    return auto_balance_assignments(db)
