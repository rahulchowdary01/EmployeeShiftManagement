from alembic import op
import sqlalchemy as sa

revision = '0001_init'
down_revision = None
branch_labels = None
depends_on = None

def upgrade() -> None:
    op.create_table(
        'departments',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('name', sa.String(length=100), nullable=False, unique=True),
    )
    op.create_table(
        'employees',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('first_name', sa.String(length=100), nullable=False),
        sa.Column('last_name', sa.String(length=100), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('phone', sa.String(length=30), nullable=True),
        sa.Column('avatar_url', sa.String(length=500), nullable=True),
        sa.Column('start_date', sa.Date(), nullable=False),
        sa.Column('department_id', sa.Integer(), sa.ForeignKey('departments.id')),
    )
    op.create_index('ix_employees_email', 'employees', ['email'], unique=True)
    op.create_table(
        'shifts',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('date', sa.Date(), nullable=False),
        sa.Column('start_time', sa.Time(), nullable=False),
        sa.Column('end_time', sa.Time(), nullable=False),
        sa.Column('shift_type', sa.Enum('MORNING', 'AFTERNOON', 'NIGHT', name='shifttype'), nullable=False),
    )
    op.create_unique_constraint('uq_shift_date_name', 'shifts', ['date', 'name'])
    op.create_table(
        'shift_assignments',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('employee_id', sa.Integer(), sa.ForeignKey('employees.id', ondelete='CASCADE'), nullable=False),
        sa.Column('shift_id', sa.Integer(), sa.ForeignKey('shifts.id', ondelete='CASCADE'), nullable=False),
    )
    op.create_unique_constraint('uq_employee_shift', 'shift_assignments', ['employee_id', 'shift_id'])

def downgrade() -> None:
    op.drop_constraint('uq_employee_shift', 'shift_assignments', type_='unique')
    op.drop_table('shift_assignments')
    op.drop_constraint('uq_shift_date_name', 'shifts', type_='unique')
    op.drop_table('shifts')
    op.drop_index('ix_employees_email', table_name='employees')
    op.drop_table('employees')
    op.drop_table('departments')
