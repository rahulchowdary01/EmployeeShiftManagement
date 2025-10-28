from datetime import time, date
from sqlalchemy import Column, Integer, String, Time, Date, Enum, UniqueConstraint
from sqlalchemy.orm import relationship
import enum

from app.models.base import Base  # Assuming 'Base' is your declarative_base()

# Define an enumeration for the different types of shifts.
# Inheriting from 'str' and 'enum.Enum' makes its values act like strings,
# which is ideal for storing in the database.
class ShiftType(str, enum.Enum):
    MORNING = "MORNING"
    AFTERNOON = "AFTERNOON"
    NIGHT = "NIGHT"

class Shift(Base):
    """
    Represents a single work shift (e.g., "Morning Shift on 2025-10-28").
    """
    
    # --- Table Configuration ---
    
    __tablename__ = "shifts"
    
    # --- Columns ---
    
    # Primary key for the shift
    id = Column(Integer, primary_key=True, index=True)
    
    # A human-readable name for the shift (e.g., "Weekday Opener", "Weekend Close")
    name = Column(String(100), nullable=False)
    
    # The specific date this shift instance occurs on.
    # 'index=True' optimizes queries that filter by date.
    date = Column(Date, nullable=False, index=True)
    
    # The time the shift starts
    start_time = Column(Time, nullable=False)
    
    # The time the shift ends
    end_time = Column(Time, nullable=False)
    
    # The type of shift, using the 'ShiftType' enum defined above.
    # SQLAlchemy will store the string value (e.g., "MORNING").
    shift_type = Column(Enum(ShiftType), nullable=False)

    # --- Relationships ---
    
    # Defines the "one" side of a one-to-many relationship with ShiftAssignment.
    # This links a shift to all its employee assignments.
    # 'cascade="all, delete-orphan"' means if this Shift is deleted,
    # all ShiftAssignment records associated with it are also deleted.
    assignments = relationship("ShiftAssignment", back_populates="shift", cascade="all, delete-orphan")

    # --- Table-level Arguments ---
    
    __table_args__ = (
        # Ensures that the combination of a 'date' and 'name' must be unique.
        # This prevents creating two shifts with the same name on the same day
        # (e.g., two "Weekday Opener" shifts on 2025-10-28).
        UniqueConstraint("date", "name", name="uq_shift_date_name"),
    )