from typing import List
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session

from app.connectors.postgres import get_session
from app.schemas.common import EmployeeCreate, EmployeeRead, EmployeeUpdate, DepartmentRead
from app.services.employees import (
    create_employee,
    list_employees,
    get_employee,
    update_employee,
    delete_employee,
    create_department,
    list_departments,
)

router = APIRouter()


def get_db():
    with get_session() as session:
        yield session

@router.post("/", response_model=EmployeeRead)
def create(payload: EmployeeCreate, db: Session = Depends(get_db)):
    return create_employee(db, payload)

@router.get("/", response_model=List[EmployeeRead])
def list_(db: Session = Depends(get_db)):
    return list_employees(db)

@router.get("/{employee_id}", response_model=EmployeeRead)
def get(employee_id: int, db: Session = Depends(get_db)):
    emp = get_employee(db, employee_id)
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")
    return emp

@router.patch("/{employee_id}", response_model=EmployeeRead)
def update(employee_id: int, payload: EmployeeUpdate, db: Session = Depends(get_db)):
    emp = update_employee(db, employee_id, payload)
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")
    return emp

@router.delete("/{employee_id}")
def delete(employee_id: int, db: Session = Depends(get_db)):
    ok = delete_employee(db, employee_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Employee not found")
    return {"deleted": True}

@router.post("/departments", response_model=DepartmentRead)
def create_dept(name: str, db: Session = Depends(get_db)):
    return create_department(db, name)

@router.get("/departments", response_model=List[DepartmentRead])
def list_dept(db: Session = Depends(get_db)):
    return list_departments(db)
