from datetime import date, time
from typing import Optional
from pydantic import BaseModel, EmailStr

class DepartmentBase(BaseModel):
    name: str

class DepartmentCreate(DepartmentBase):
    pass

class DepartmentRead(DepartmentBase):
    id: int
    class Config:
        from_attributes = True

class EmployeeBase(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    phone: Optional[str] = None
    department_id: Optional[int] = None

class EmployeeCreate(EmployeeBase):
    pass

class EmployeeUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    department_id: Optional[int] = None

class EmployeeRead(EmployeeBase):
    id: int
    class Config:
        from_attributes = True

class ShiftBase(BaseModel):
    name: str
    date: date
    start_time: time
    end_time: time
    shift_type: str

class ShiftCreate(ShiftBase):
    pass

class ShiftRead(ShiftBase):
    id: int
    class Config:
        from_attributes = True

class AssignmentBase(BaseModel):
    employee_id: int
    shift_id: int

class AssignmentCreate(AssignmentBase):
    pass

class AssignmentRead(AssignmentBase):
    id: int
    class Config:
        from_attributes = True
