from typing import List, Dict, Any
import openai
import os
from dotenv import load_dotenv

load_dotenv()

class AIService:
    def __init__(self):
        openai.api_key = os.getenv("OPENAI_API_KEY")
    
    def optimize_shift_schedule(self, employees: List[Dict], shifts: List[Dict], assignments: List[Dict]) -> Dict[str, Any]:
        """AI-powered shift optimization recommendations"""
        
        prompt = f"""
        You are an expert workforce management AI. Analyze the following shift schedule data and provide optimization recommendations.
        
        Employees: {employees}
        Shifts: {shifts}
        Current Assignments: {assignments}
        
        Please provide:
        1. Workload balance analysis
        2. Coverage gaps identification
        3. Optimization suggestions
        4. Fairness recommendations
        
        Format your response as JSON with keys: workload_analysis, coverage_gaps, optimizations, fairness_score
        """
        
        try:
            response = openai.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[{"role": "user", "content": prompt}],
                max_tokens=500,
                temperature=0.7
            )
            return {"success": True, "recommendations": response.choices[0].message.content}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def suggest_employee_assignments(self, employee_data: Dict, shift_requirements: Dict) -> Dict[str, Any]:
        """AI-powered employee assignment suggestions"""
        
        prompt = f"""
        You are an HR AI assistant. Analyze this employee profile and suggest optimal shift assignments.
        
        Employee Profile: {employee_data}
        Shift Requirements: {shift_requirements}
        
        Provide:
        1. Suitability score (1-10)
        2. Recommended shift types
        3. Potential conflicts or concerns
        4. Alternative suggestions
        
        Format as JSON with keys: suitability_score, recommended_shifts, concerns, alternatives
        """
        
        try:
            response = openai.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[{"role": "user", "content": prompt}],
                max_tokens=500,
                temperature=0.7
            )
            return {"success": True, "suggestions": response.choices[0].message.content}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def generate_shift_insights(self, historical_data: List[Dict]) -> Dict[str, Any]:
        """Generate insights from historical shift data"""
        
        prompt = f"""
        Analyze this historical shift management data and provide business insights.
        
        Historical Data: {historical_data}
        
        Provide:
        1. Peak hours analysis
        2. Employee performance patterns
        3. Cost optimization opportunities
        4. Predictive recommendations
        
        Format as JSON with keys: peak_analysis, performance_patterns, cost_optimization, predictions
        """
        
        try:
            response = openai.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[{"role": "user", "content": prompt}],
                max_tokens=500,
                temperature=0.7
            )
            return {"success": True, "insights": response.choices[0].message.content}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def chat_with_ai(self, user_query: str, context: Dict) -> Dict[str, Any]:
        """General AI chat for shift management questions"""
        
        prompt = f"""
        You are an AI assistant for employee shift management. Answer the user's question based on the provided context.
        
        User Question: {user_query}
        System Context: {context}
        
        Provide a helpful, accurate response about shift management, scheduling, or workforce optimization.
        """
        
        try:
            response = openai.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[{"role": "user", "content": prompt}],
                max_tokens=500,
                temperature=0.7
            )
            return {"success": True, "response": response.choices[0].message.content}
        except Exception as e:
            return {"success": False, "error": str(e)}

# Global instance
ai_service = AIService()
