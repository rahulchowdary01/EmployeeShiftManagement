"""
Health check endpoint for monitoring system status.

This module provides a simple health check endpoint that can be used
by load balancers, monitoring systems, or deployment tools to verify
that the API service is running and responsive.
"""

from fastapi import APIRouter

# Create router instance for health-related endpoints
router = APIRouter()

@router.get("/health", tags=["health"]) 
async def health() -> dict:
    """
    Health check endpoint to verify API service status.
    
    Returns:
        dict: Simple status response indicating the service is operational
        
    Example:
        GET /health
        Response: {"status": "ok"}
    """
    return {"status": "ok"}
