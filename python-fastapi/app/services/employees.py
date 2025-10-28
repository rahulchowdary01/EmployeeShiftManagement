from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.models.employee import Employee, Department
from app.models.assignment import ShiftAssignment
from app.schemas.common import EmployeeCreate, EmployeeUpdate


def create_employee(db: Session, payload: EmployeeCreate) -> Employee:
    employee = Employee(**payload.model_dump())
    db.add(employee)
    db.flush()
    return employee


def list_employees(db: Session) -> List[Employee]:
    return list(db.scalars(select(Employee)))


def get_employee(db: Session, employee_id: int) -> Optional[Employee]:
    return db.get(Employee, employee_id)


def update_employee(db: Session, employee_id: int, payload: EmployeeUpdate) -> Optional[Employee]:
    employee = db.get(Employee, employee_id)
    if not employee:
        return None
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(employee, field, value)
    db.flush()
    return employee


def delete_employee(db: Session, employee_id: int) -> bool:
    employee = db.get(Employee, employee_id)
    if not employee:
        return False
    
    # Delete all assignments for this employee first
    db.query(ShiftAssignment).filter(ShiftAssignment.employee_id == employee_id).delete()
    
    # Then delete the employee
    db.delete(employee)
    return True


def create_department(db: Session, name: str) -> Department:
    dept = Department(name=name)
    db.add(dept)
    db.flush()
    return dept


def list_departments(db: Session) -> List[Department]:
    return list(db.scalars(select(Department)))
