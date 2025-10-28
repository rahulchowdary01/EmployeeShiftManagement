from sqlalchemy import Column, Integer, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship

from app.models.base import Base

class ShiftAssignment(Base):
    __tablename__ = "shift_assignments"
    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id", ondelete="CASCADE"), nullable=False)
    shift_id = Column(Integer, ForeignKey("shifts.id", ondelete="CASCADE"), nullable=False)

    employee = relationship("Employee", back_populates="assignments")
    shift = relationship("Shift", back_populates="assignments")

    __table_args__ = (
        UniqueConstraint("employee_id", "shift_id", name="uq_employee_shift"),
    )
