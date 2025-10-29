#!/bin/sh
set -e

echo "Starting application..."

# Run migrations (continue even if already applied)
echo "Running database migrations..."
alembic upgrade head || echo "Migration completed or already applied"

# Get port from environment or default to 8000
PORT=${PORT:-8000}
echo "Starting server on port $PORT"

# Start the application
exec uvicorn app.main:app --host 0.0.0.0 --port $PORT

