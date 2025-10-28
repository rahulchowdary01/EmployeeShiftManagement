from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.models.shift import Shift, ShiftType
from app.models.assignment import ShiftAssignment
from app.schemas.common import ShiftCreate


def create_shift(db: Session, payload: ShiftCreate) -> Shift:
    shift = Shift(**payload.model_dump())
    db.add(shift)
    db.flush()
    return shift


def list_shifts(db: Session) -> List[Shift]:
    return list(db.scalars(select(Shift)))


def get_shift(db: Session, shift_id: int):
    return db.get(Shift, shift_id)


def delete_shift(db: Session, shift_id: int) -> bool:
    shift = db.get(Shift, shift_id)
    if not shift:
        return False
    
    # Delete all assignments for this shift first
    db.query(ShiftAssignment).filter(ShiftAssignment.shift_id == shift_id).delete()
    
    # Then delete the shift
    db.delete(shift)
    return True
