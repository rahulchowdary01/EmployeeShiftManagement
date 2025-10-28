"""
Base model configuration for SQLAlchemy ORM.

This module provides the declarative base class that all database models
inherit from, enabling SQLAlchemy's ORM functionality.
"""

from sqlalchemy.orm import declarative_base

# Create the declarative base class for all database models
# This provides the foundation for SQLAlchemy's ORM functionality
Base = declarative_base()
