from datetime import time, date
from sqlalchemy import Column, Integer, String, Time, Date, Enum, UniqueConstraint
from sqlalchemy.orm import relationship
import enum

from app.models.base import Base

class ShiftType(str, enum.Enum):
    MORNING = "MORNING"
    AFTERNOON = "AFTERNOON"
    NIGHT = "NIGHT"

class Shift(Base):
    __tablename__ = "shifts"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    date = Column(Date, nullable=False, index=True)
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)
    shift_type = Column(Enum(ShiftType), nullable=False)

    assignments = relationship("ShiftAssignment", back_populates="shift", cascade="all, delete-orphan")

    __table_args__ = (
        UniqueConstraint("date", "name", name="uq_shift_date_name"),
    )
