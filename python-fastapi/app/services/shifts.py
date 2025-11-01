from datetime import date, timedelta
from typing import Dict, List, Optional, Tuple
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


def ensure_week_shifts(
    db: Session,
    *,
    target_start: date,
    target_end: date,
) -> Tuple[List[Shift], Dict[int, int]]:
    """Ensure shifts exist for the requested week.

    Returns the list of shifts covering the requested window and a mapping of
    newly cloned shift IDs -> source shift IDs (from the prior week).
    """

    all_shifts = list_shifts(db)
    target_shifts = [s for s in all_shifts if target_start <= s.date <= target_end]
    if target_shifts:
        return target_shifts, {}

    source_start = target_start - timedelta(days=7)
    source_end = target_end - timedelta(days=7)
    source_shifts = [s for s in all_shifts if source_start <= s.date <= source_end]

    clone_map: Dict[int, int] = {}
    for shift in source_shifts:
        clone = Shift(
            name=shift.name,
            date=shift.date + timedelta(days=7),
            start_time=shift.start_time,
            end_time=shift.end_time,
            shift_type=shift.shift_type,
        )
        db.add(clone)
        db.flush()
        clone_map[clone.id] = shift.id

    refreshed = list_shifts(db)
    target_shifts = [s for s in refreshed if target_start <= s.date <= target_end]
    return target_shifts, clone_map


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
