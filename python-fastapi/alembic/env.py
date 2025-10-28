from logging.config import fileConfig
import os
from sqlalchemy import engine_from_config, pool
from alembic import context

from app.models.base import Base
from app.models.employee import Employee, Department
from app.models.shift import Shift
from app.models.assignment import ShiftAssignment

config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

def get_url() -> str:
    return os.getenv("DATABASE_URL", "postgresql+psycopg2://ems_user:ems_pass@localhost:5432/ems_db")

config.set_main_option("sqlalchemy.url", get_url())

target_metadata = Base.metadata

def run_migrations_offline() -> None:
    context.configure(url=get_url(), target_metadata=target_metadata, literal_binds=True, compare_type=True)
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    connectable = engine_from_config(config.get_section(config.config_ini_section), prefix="sqlalchemy.", poolclass=pool.NullPool)
    with connectable.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata, compare_type=True)
        with context.begin_transaction():
            context.run_migrations()

if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
