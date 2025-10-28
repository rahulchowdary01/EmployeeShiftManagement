from typing import List, Optional, Dict
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.models.assignment import ShiftAssignment
from app.models.employee import Employee
from app.models.shift import Shift
from app.schemas.common import AssignmentCreate


def assign_employee(db: Session, payload: AssignmentCreate) -> ShiftAssignment:
    assignment = ShiftAssignment(**payload.model_dump())
    db.add(assignment)
    db.flush()
    return assignment


def list_assignments(db: Session) -> List[ShiftAssignment]:
    return list(db.scalars(select(ShiftAssignment)))


def auto_balance_assignments(db: Session) -> Dict[str, int]:
    employees = list(db.scalars(select(Employee)))
    shifts = list(db.scalars(select(Shift)))

    if not employees or not shifts:
        return {"created": 0}

    created = 0
    employee_to_count = {e.id: 0 for e in employees}
    for assignment in db.scalars(select(ShiftAssignment)):
        employee_to_count[assignment.employee_id] = employee_to_count.get(assignment.employee_id, 0) + 1

    employee_ids_sorted = sorted(employee_to_count.keys(), key=lambda k: employee_to_count[k])
    i = 0
    for shift in shifts:
        existing = list(db.scalars(select(ShiftAssignment).where(ShiftAssignment.shift_id == shift.id)))
        if existing:
            continue
        employee_id = employee_ids_sorted[i % len(employee_ids_sorted)]
        db.add(ShiftAssignment(employee_id=employee_id, shift_id=shift.id))
        employee_to_count[employee_id] += 1
        created += 1
        employee_ids_sorted = sorted(employee_to_count.keys(), key=lambda k: employee_to_count[k])
        i += 1

    db.flush()
    return {"created": created}
