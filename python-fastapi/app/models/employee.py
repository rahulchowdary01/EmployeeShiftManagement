from datetime import date
from sqlalchemy import Column, Integer, String, Date, ForeignKey
from sqlalchemy.orm import relationship

from app.models.base import Base  # Assuming 'Base' is your declarative_base()

class Department(Base):
    """
    Represents a department within the organization (e.g., "Engineering", "Sales").
    """
    
    # --- Table Configuration ---
    
    __tablename__ = "departments"
    
    # --- Columns ---
    
    # Primary key for the department
    id = Column(Integer, primary_key=True, index=True)
    
    # Name of the department. Must be unique and cannot be null.
    name = Column(String(100), unique=True, nullable=False)

    # --- Relationships ---
    
    # Defines the "one" side of the one-to-many relationship with Employee.
    # It allows access to all employees in this department via `my_department.employees`.
    # 'back_populates' links this to the 'department' attribute on the Employee model.
    employees = relationship("Employee", back_populates="department")

class Employee(Base):
    """
    Represents an employee in the system.
    """
    
    # --- Table Configuration ---
    
    __tablename__ = "employees"
    
    # --- Columns ---
    
    # Primary key for the employee
    id = Column(Integer, primary_key=True, index=True)
    
    # Employee's first name
    first_name = Column(String(100), nullable=False)
    
    # Employee's last name
    last_name = Column(String(100), nullable=False)
    
    # Employee's email address. Must be unique.
    # 'index=True' optimizes queries that search by email.
    email = Column(String(255), unique=True, nullable=False, index=True)
    
    # Employee's phone number (optional)
    phone = Column(String(30), nullable=True)
    
    # URL to the employee's profile picture (optional)
    avatar_url = Column(String(500), nullable=True)
    
    # Date the employee started. Defaults to the current date if not provided.
    start_date = Column(Date, default=date.today, nullable=False)
    
    # Foreign key linking to the 'departments' table.
    # An employee can optionally belong to one department.
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=True)

    # --- Relationships ---
    
    # Defines the "many" side of the one-to-many relationship with Department.
    # It allows access to the employee's department via `my_employee.department`.
    # 'back_populates' links this to the 'employees' attribute on the Department model.
    department = relationship("Department", back_populates="employees")
    
    # Defines the "one" side of a one-to-many relationship with ShiftAssignment.
    # This links an employee to all their shift assignments.
    # 'cascade="all, delete-orphan"' means:
    # 1. 'all': Operations (like adding) on an Employee are cascaded to their assignments.
    # 2. 'delete-orphan': If a ShiftAssignment is removed from this employee's
    #    'assignments' list, the ShiftAssignment record itself is deleted from the database.
    #    It also means if the Employee is deleted, all their assignments are deleted.
    assignments = relationship("ShiftAssignment", back_populates="employee", cascade="all, delete-orphan")