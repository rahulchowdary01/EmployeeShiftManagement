from typing import List
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session

from app.connectors.postgres import get_session
from app.schemas.common import ShiftCreate, ShiftRead
from app.services.shifts import create_shift, list_shifts, get_shift, delete_shift

router = APIRouter()

def get_db():
    with get_session() as session:
        yield session

@router.post("/", response_model=ShiftRead)
def create(payload: ShiftCreate, db: Session = Depends(get_db)):
    return create_shift(db, payload)

@router.get("/", response_model=List[ShiftRead])
def list_(db: Session = Depends(get_db)):
    return list_shifts(db)

@router.get("/{shift_id}", response_model=ShiftRead)
def get(shift_id: int, db: Session = Depends(get_db)):
    sh = get_shift(db, shift_id)
    if not sh:
        raise HTTPException(status_code=404, detail="Shift not found")
    return sh

@router.delete("/{shift_id}")
def delete(shift_id: int, db: Session = Depends(get_db)):
    ok = delete_shift(db, shift_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Shift not found")
    return {"deleted": True}
