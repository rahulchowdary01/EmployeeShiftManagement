"""
AI-powered workforce management API endpoints.

This module provides REST API endpoints for AI-powered features including
shift optimization, employee assignment suggestions, business insights,
workforce analysis, and conversational AI chat functionality using LangChain.
"""

from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.connectors.postgres import get_session
from app.services.ai_service import ai_service
from app.services.employees import list_employees
from app.services.shifts import list_shifts
from app.services.assignments import list_assignments

# Create a new router for all AI-related endpoints.
# This will likely be included in the main app, e.g., under the "/ai" prefix.
router = APIRouter()

# --- Dependencies ---

def get_db():
    """
    A FastAPI dependency that creates and yields a database session per request.
    It uses the 'get_session' context manager to ensure the session is
    - Committed if the request is successful.
    - Rolled back if an exception occurs.
    - Always closed after the request is finished.
    """
    with get_session() as session:
        yield session

# --- Pydantic Models ---
# These models define the expected JSON structure for request bodies.

class ChatRequest(BaseModel):
    """Pydantic model for the /chat endpoint request body."""
    query: str

class WorkforceAnalysisRequest(BaseModel):
    """Pydantic model for the /analyze-workforce endpoint request body."""
    analysis_type: str = "comprehensive"

# --- API Endpoints ---

@router.post("/optimize-schedule")
async def optimize_schedule(db: Session = Depends(get_db)):
    """
    API endpoint to get AI-powered shift schedule optimization recommendations.
    It fetches all relevant data and passes it to the AI service.
    """
    try:
        # 1. Fetch all data from the database using service functions
        employees = list_employees(db)
        shifts = list_shifts(db)
        assignments = list_assignments(db)
        
        # 2. Convert SQLAlchemy models into simple dicts.
        # This is crucial because the AI service (or any external API)
        # doesn't understand SQLAlchemy objects, but it understands JSON/dicts.
        employees_data = [
            {
                "id": emp.id,
                "name": f"{emp.first_name} {emp.last_name}",
                "email": emp.email,
                "phone": emp.phone,
                "department_id": emp.department_id
            }
            for emp in employees
        ]
        
        shifts_data = [
            {
                "id": shift.id,
                "name": shift.name,
                "date": shift.date,
                "start_time": shift.start_time,
                "end_time": shift.end_time,
                "shift_type": shift.shift_type
            }
            for shift in shifts
        ]
        
        assignments_data = [
            {
                "id": assignment.id,
                "employee_id": assignment.employee_id,
                "shift_id": assignment.shift_id
            }
            for assignment in assignments
        ]
        
        # 3. Call the AI service with the formatted data
        result = ai_service.optimize_shift_schedule(employees_data, shifts_data, assignments_data)
        return result
        
    except Exception as e:
        # Generic error handler for any failure during the process
        raise HTTPException(status_code=500, detail=f"AI optimization failed: {str(e)}")

@router.post("/suggest-assignment")
async def suggest_assignment(employee_id: int, shift_id: int, db: Session = Depends(get_db)):
    """
    Get AI-powered assignment suggestions for a *specific* employee and shift.
    The 'employee_id' and 'shift_id' are passed as query parameters.
    """
    try:
        # 1. Fetch all data (note: this could be optimized to fetch only one)
        employees = list_employees(db)
        shifts = list_shifts(db)
        
        # 2. Find the specific employee and shift from the lists (in-memory search)
        employee = next((emp for emp in employees if emp.id == employee_id), None)
        shift = next((s for s in shifts if s.id == shift_id), None)
        
        # 3. Validate that both exist
        if not employee or not shift:
            raise HTTPException(status_code=404, detail="Employee or shift not found")
        
        # 4. Serialize the *specific* employee and shift for the AI context
        employee_data = {
            "id": employee.id,
            "name": f"{employee.first_name} {employee.last_name}",
            "email": employee.email,
            "phone": employee.phone,
            "department_id": employee.department_id
        }
        
        shift_requirements = {
            "id": shift.id,
            "name": shift.name,
            "date": shift.date,
            "start_time": shift.start_time,
            "end_time": shift.end_time,
            "shift_type": shift.shift_type
        }
        
        # 5. Call the AI service
        result = ai_service.suggest_employee_assignments(employee_data, shift_requirements)
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI suggestion failed: {str(e)}")

@router.post("/insights")
async def get_insights(db: Session = Depends(get_db)):
    """Get AI-powered insights from historical assignment and shift data."""
    try:
        # 1. Fetch data
        assignments = list_assignments(db)
        shifts = list_shifts(db)
        
        # 2. Create a "historical data" list by merging assignments with their shifts.
        # This provides richer context for the AI to analyze.
        historical_data = []
        for assignment in assignments:
            # Find the matching shift for this assignment
            shift = next((s for s in shifts if s.id == assignment.shift_id), None)
            if shift:
                # Append the combined data
                historical_data.append({
                    "assignment_id": assignment.id,
                    "employee_id": assignment.employee_id,
                    "shift_date": shift.date,
                    "shift_type": shift.shift_type,
                    "start_time": shift.start_time,
                    "end_time": shift.end_time
                })
        
        # 3. Call the AI service with the combined historical data
        result = ai_service.generate_shift_insights(historical_data)
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI insights failed: {str(e)}")

@router.post("/chat")
async def chat_with_ai(request: ChatRequest, db: Session = Depends(get_db)):
    """
    A LangChain-powered AI chat assistant that has access to high-level
    context about the current system state.
    """
    try:
        # 1. Fetch data to build a "context" snapshot
        employees = list_employees(db)
        shifts = list_shifts(db)
        assignments = list_assignments(db)
        
        # 2. Create a context dictionary.
        # This context is passed to the AI along with the user's query,
        # allowing the AI to answer questions like "How many employees are in the system?"
        context = {
            "total_employees": len(employees),
            "total_shifts": len(shifts),
            "total_assignments": len(assignments),
            "recent_activity": "System operational", # Example static context
            "langchain_enabled": True
        }
        
        # 3. Call the AI chat service with the user's query and the built context
        result = ai_service.chat_with_ai(request.query, context)
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI chat failed: {str(e)}")

@router.post("/analyze-workforce")
async def analyze_workforce(request: WorkforceAnalysisRequest, db: Session = Depends(get_db)):
    """Advanced LangChain-powered workforce pattern analysis."""
    try:
        # 1. Fetch all data
        employees = list_employees(db)
        shifts = list_shifts(db)
        assignments = list_assignments(db)
        
        # 2. Package all system data into a single comprehensive dictionary.
        # This is for deep analysis tasks where the AI needs to see everything
        # to find complex patterns (e.g., department-level shift distribution).
        workforce_data = {
            "employees": [
                {
                    "id": emp.id,
                    "name": f"{emp.first_name} {emp.last_name}",
                    "email": emp.email,
                    "phone": emp.phone,
                    "department_id": emp.department_id,
                    "avatar_url": emp.avatar_url
                }
                for emp in employees
            ],
            "shifts": [
                {
                    "id": shift.id,
                    "name": shift.name,
                    "date": shift.date,
                    "start_time": shift.start_time,
                    "end_time": shift.end_time,
                    "shift_type": shift.shift_type
                }
                for shift in shifts
            ],
            "assignments": [
                {
                    "id": assignment.id,
                    "employee_id": assignment.employee_id,
                    "shift_id": assignment.shift_id
                }
                for assignment in assignments
            ],
            # Pass along the requested analysis type from the user
            "analysis_type": request.analysis_type,
            "timestamp": "2024-01-01T00:00:00Z" # Example metadata
        }
        
        # 3. Call the AI service for advanced analysis
        result = ai_service.analyze_workforce_patterns(workforce_data)
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Workforce analysis failed: {str(e)}")

@router.get("/langchain-info")
async def langchain_info():
    """
    A static endpoint that returns information about the
    LangChain integration. Useful for debugging or as a health check.
    """
    return {
        "framework": "LangChain",
        "version": "0.1.0",
        "features": [
            "PromptTemplate for structured prompts",
            "LLMChain for chained operations", 
            "ChatOpenAI for OpenAI integration",
            "SystemMessage and HumanMessage for conversation",
            "Advanced workforce analytics"
        ],
        "endpoints": [
            "/ai/optimize-schedule - LangChain prompt templates",
            "/ai/suggest-assignment - LLMChain for suggestions", 
            "/ai/insights - Structured prompt analysis",
            "/ai/chat - Conversational AI with context",
            "/ai/analyze-workforce - Advanced pattern analysis"
        ],
        "langchain_components": {
            "ChatOpenAI": "OpenAI GPT-3.5-turbo integration",
            "PromptTemplate": "Structured prompt management",
            "LLMChain": "Chained language model operations",
            "SystemMessage": "System-level context messages",
            "HumanMessage": "User input messages"
        }
    }