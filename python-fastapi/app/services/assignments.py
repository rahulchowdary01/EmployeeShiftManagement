from typing import List, Dict, Optional
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.models.assignment import ShiftAssignment
from app.models.employee import Employee
from app.models.shift import Shift
from app.schemas.common import AssignmentCreate, AssignmentUpdate


def _validate_assignment_rules(
    db: Session,
    *,
    employee_id: int,
    shift_id: int,
    ignore_assignment_id: Optional[int] = None,
) -> Shift:
    """
    Shared validation logic to ensure an assignment obeys business rules.

    Returns the target shift if validation passes.
    """

    shift = db.get(Shift, shift_id)
    if not shift:
        raise ValueError("Shift not found")

    # Prevent duplicate assignment for the same employee/shift combination
    exists_same = db.scalars(
        select(ShiftAssignment)
        .where(
            ShiftAssignment.employee_id == employee_id,
            ShiftAssignment.shift_id == shift_id,
        )
    ).first()

    if exists_same and exists_same.id != ignore_assignment_id:
        raise ValueError("This employee is already assigned to this shift")

    from sqlalchemy import and_

    # Prevent overlapping assignments on the same date for the employee
    overlap = list(
        db.scalars(
            select(ShiftAssignment)
            .join(Shift, Shift.id == ShiftAssignment.shift_id)
            .where(
                and_(
                    ShiftAssignment.employee_id == employee_id,
                    Shift.date == shift.date,
                    ShiftAssignment.id != ignore_assignment_id if ignore_assignment_id else True,
                    Shift.start_time < shift.end_time,
                    Shift.end_time > shift.start_time,
                )
            )
        )
    )

    if overlap:
        raise ValueError("Employee already assigned to an overlapping shift")

    return shift


def assign_employee(db: Session, payload: AssignmentCreate) -> ShiftAssignment:
    _validate_assignment_rules(db, employee_id=payload.employee_id, shift_id=payload.shift_id)

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


def delete_assignment(db: Session, assignment_id: int) -> bool:
    assignment = db.get(ShiftAssignment, assignment_id)
    if not assignment:
        return False
    db.delete(assignment)
    return True


def update_assignment(db: Session, assignment_id: int, payload: AssignmentUpdate) -> ShiftAssignment:
    assignment = db.get(ShiftAssignment, assignment_id)
    if not assignment:
        raise ValueError("Assignment not found")

    new_employee_id = payload.employee_id if payload.employee_id is not None else assignment.employee_id
    new_shift_id = payload.shift_id if payload.shift_id is not None else assignment.shift_id

    _validate_assignment_rules(
        db,
        employee_id=new_employee_id,
        shift_id=new_shift_id,
        ignore_assignment_id=assignment.id,
    )

    assignment.employee_id = new_employee_id
    assignment.shift_id = new_shift_id
    db.flush()
    return assignment
