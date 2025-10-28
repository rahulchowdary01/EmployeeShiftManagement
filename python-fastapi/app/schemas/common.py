"""
Pydantic schemas for data validation and serialization.

This module defines the data models used for API request/response validation
and serialization across the Employee Shift Management System.
"""

from datetime import date, time
from typing import Optional
from pydantic import BaseModel, EmailStr


# ============================================================================
# DEPARTMENT SCHEMAS
# ============================================================================

class DepartmentBase(BaseModel):
    """Base schema for department data."""
    name: str

class DepartmentCreate(DepartmentBase):
    """Schema for creating a new department."""
    pass

class DepartmentRead(DepartmentBase):
    """Schema for reading department data with ID."""
    id: int
    
    class Config:
        """Pydantic configuration for ORM compatibility."""
        from_attributes = True


# ============================================================================
# EMPLOYEE SCHEMAS
# ============================================================================

class EmployeeBase(BaseModel):
    """Base schema for employee data with all required fields."""
    first_name: str
    last_name: str
    email: EmailStr  # Validates email format automatically
    phone: Optional[str] = None
    department_id: Optional[int] = None
    avatar_url: Optional[str] = None  # URL to employee's profile picture

class EmployeeCreate(EmployeeBase):
    """Schema for creating a new employee."""
    pass

class EmployeeUpdate(BaseModel):
    """Schema for updating employee data - all fields optional for partial updates."""
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    department_id: Optional[int] = None
    avatar_url: Optional[str] = None

class EmployeeRead(EmployeeBase):
    """Schema for reading employee data with ID."""
    id: int
    
    class Config:
        """Pydantic configuration for ORM compatibility."""
        from_attributes = True


# ============================================================================
# SHIFT SCHEMAS
# ============================================================================

class ShiftBase(BaseModel):
    """Base schema for shift data."""
    name: str
    date: date
    start_time: time
    end_time: time
    shift_type: str  # MORNING, AFTERNOON, or NIGHT

class ShiftCreate(ShiftBase):
    """Schema for creating a new shift."""
    pass

class ShiftRead(ShiftBase):
    """Schema for reading shift data with ID."""
    id: int
    
    class Config:
        """Pydantic configuration for ORM compatibility."""
        from_attributes = True


# ============================================================================
# ASSIGNMENT SCHEMAS
# ============================================================================

class AssignmentBase(BaseModel):
    """Base schema for shift assignment data."""
    employee_id: int
    shift_id: int

class AssignmentCreate(AssignmentBase):
    """Schema for creating a new shift assignment."""
    pass

class AssignmentRead(AssignmentBase):
    """Schema for reading assignment data with ID."""
    id: int
    
    class Config:
        """Pydantic configuration for ORM compatibility."""
        from_attributes = True
