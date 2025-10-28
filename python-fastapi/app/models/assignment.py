from sqlalchemy import Column, Integer, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship

from app.models.base import Base  # Assuming 'Base' is your declarative_base()

class ShiftAssignment(Base):
    """
    Represents the association table (many-to-many relationship)
    linking an Employee to a specific Shift they are assigned to.
    """
    
    # --- Table Configuration ---
    
    __tablename__ = "shift_assignments"
    
    # --- Columns ---
    
    # Primary key for this association table
    id = Column(Integer, primary_key=True, index=True)
    
    # Foreign key linking to the 'employees' table.
    # 'ondelete="CASCADE"' means if an Employee is deleted, their assignments are also deleted.
    employee_id = Column(Integer, ForeignKey("employees.id", ondelete="CASCADE"), nullable=False)
    
    # Foreign key linking to the 'shifts' table.
    # 'ondelete="CASCADE"' means if a Shift is deleted, all assignments to it are also deleted.
    shift_id = Column(Integer, ForeignKey("shifts.id", ondelete="CASCADE"), nullable=False)

    # --- Relationships ---
    
    # Defines the relationship to the 'Employee' model.
    # 'back_populates' links this to the 'assignments' attribute on the Employee model,
    # allowing access like `my_assignment.employee`.
    employee = relationship("Employee", back_populates="assignments")
    
    # Defines the relationship to the 'Shift' model.
    # 'back_populates' links this to the 'assignments' attribute on the Shift model,
    # allowing access like `my_assignment.shift`.
    shift = relationship("Shift", back_populates="assignments")

    # --- Table-level Arguments ---
    
    __table_args__ = (
        # Ensures that the combination of employee_id and shift_id must be unique.
        # This prevents the same employee from being assigned to the exact same shift more than once.
        UniqueConstraint("employee_id", "shift_id", name="uq_employee_shift"),
    )