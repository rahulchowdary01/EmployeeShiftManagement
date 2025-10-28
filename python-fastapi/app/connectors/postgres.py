import os
from contextlib import contextmanager
from typing import Iterator

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session  # <-- Added 'Session' for type hinting

# --- Database Configuration ---

# Get the database connection string from an environment variable.
# If "DATABASE_URL" isn't set, it uses a default local PostgreSQL connection string.
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+psycopg2://ems_user:ems_pass@localhost:5432/ems_db",
)

# Create the main SQLAlchemy engine.
# 'pool_pre_ping=True' checks if connections in the pool are still alive before use.
# 'future=True' enables SQLAlchemy 2.0-style (modern) usage.
engine = create_engine(DATABASE_URL, pool_pre_ping=True, future=True)

# Create a 'session factory' (a class) that will be used to create new session objects.
# 'autocommit=False' and 'autoflush=False' are standard settings for transactional control.
# 'bind=engine' connects this session factory to our database engine.
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine, future=True)


# --- Session Management ---

@contextmanager
def get_session() -> Iterator[Session]:
    """
    Provides a transactional database session using a context manager.

    This function handles the session lifecycle (creation, commit, rollback, close)
    to ensure database connections are managed correctly and safely.

    Usage:
        with get_session() as session:
            # ... perform database operations with 'session' ...
            session.add(some_object)
    """
    # Create a new session instance from our factory
    session = SessionLocal()
    
    try:
        # 'yield' the session to the code inside the 'with' block
        yield session
        
        # If the 'with' block completes without errors, commit the transaction
        session.commit()
        
    except Exception:
        # If an error occurs inside the 'with' block, roll back all changes
        session.rollback()
        
        # Re-raise the exception so it can be handled by the calling code
        raise
        
    finally:
        # This block executes regardless of whether an exception occurred.
        # Close the session to release its resources and return the
        # connection to the connection pool.
        session.close()