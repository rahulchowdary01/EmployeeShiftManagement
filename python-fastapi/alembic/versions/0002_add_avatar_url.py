from alembic import op
import sqlalchemy as sa

revision = '0002_add_avatar_url'
down_revision = '0001_init'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('employees', sa.Column('avatar_url', sa.String(length=500), nullable=True))


def downgrade() -> None:
    op.drop_column('employees', 'avatar_url')


