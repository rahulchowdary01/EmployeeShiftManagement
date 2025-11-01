from typing import List, Dict, Any, Optional
from collections import defaultdict
import json
from datetime import date as date_type, datetime, timedelta
import openai
import os
from dotenv import load_dotenv

load_dotenv()

class AIService:
    def __init__(self):
        openai.api_key = os.getenv("OPENAI_API_KEY")
    
    def _call_openai(self, prompt: str, *, max_tokens: int = 600, temperature: float = 0.7) -> Optional[str]:
        """Utility wrapper that safely calls OpenAI and returns raw content."""

        if not openai.api_key:
            raise RuntimeError("OpenAI API key is not configured")

        response = openai.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=max_tokens,
            temperature=temperature,
        )
        return response.choices[0].message.content

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
            content = self._call_openai(prompt)
            return {"success": True, "recommendations": content}
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
            content = self._call_openai(prompt)
            return {"success": True, "suggestions": content}
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
            content = self._call_openai(prompt)
            return {"success": True, "insights": content}
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
            content = self._call_openai(prompt)
            return {"success": True, "response": content}
        except Exception as e:
            return {"success": False, "error": str(e)}

    def generate_schedule_proposal(
        self,
        employees: List[Dict[str, Any]],
        shifts: List[Dict[str, Any]],
        assignments: List[Dict[str, Any]],
        *,
        start_date: date_type,
        end_date: date_type,
    ) -> Dict[str, Any]:
        """Generate a proactive schedule proposal for the requested window."""

        period_shifts = [
            shift for shift in shifts
            if start_date <= datetime.fromisoformat(str(shift["date"])).date() <= end_date
        ]

        prompt = f"""
        You are an intelligent workforce scheduler. Using the data below, create an optimized shift assignment plan for the period {start_date} to {end_date}.

        Employees: {employees}
        Shifts (target window only): {period_shifts}
        Existing Assignments: {assignments}

        Goals:
        - Ensure every shift in the window is assigned to exactly one available employee.
        - Balance workload fairly across employees.
        - Avoid overlapping assignments for any employee.
        - Prioritize matching shift_type preferences if visible from data.

        Respond strictly as JSON with the following structure:
        {{
          "summary": "...",
          "assignments": [
            {{
              "shift_id": <int>,
              "employee_id": <int>,
              "reason": "Why this employee fits"
            }},
            ...
          ]
        }}
        """

        ai_error: Optional[str] = None
        ai_raw: Optional[str] = None
        parsed_assignments: Optional[List[Dict[str, Any]]] = None
        summary: Optional[str] = None

        try:
            ai_raw = self._call_openai(prompt, max_tokens=900, temperature=0.4)
        except Exception as e:
            ai_error = str(e)

        if ai_raw:
            try:
                payload = json.loads(ai_raw)
                if isinstance(payload, dict):
                    parsed_assignments = payload.get("assignments")
                    summary = payload.get("summary")
            except json.JSONDecodeError:
                parsed_assignments = None

        valid_shift_ids = {
            int(shift["id"])
            for shift in period_shifts
            if isinstance(shift, dict) and "id" in shift and str(shift["id"]).isdigit()
        }

        def _coerce_int(value: Any) -> Optional[int]:
            try:
                return int(value)
            except (TypeError, ValueError):
                return None

        filtered_assignments: List[Dict[str, Any]] = []
        dropped_out_of_window = False

        if isinstance(parsed_assignments, list):
            for item in parsed_assignments:
                if not isinstance(item, dict):
                    continue

                shift_id = _coerce_int(item.get("shift_id") or item.get("shift", {}).get("id"))
                employee_id = _coerce_int(item.get("employee_id") or item.get("employee", {}).get("id"))
                if shift_id is None or employee_id is None:
                    continue

                if not valid_shift_ids or shift_id not in valid_shift_ids:
                    dropped_out_of_window = True
                    continue

                reason_raw = item.get("reason") or item.get("explanation")
                reason = str(reason_raw).strip() if isinstance(reason_raw, (str, bytes)) else None

                filtered_assignments.append(
                    {
                        "shift_id": shift_id,
                        "employee_id": employee_id,
                        "reason": reason if reason else None,
                    }
                )

        parsed_assignments = filtered_assignments if filtered_assignments else None

        if dropped_out_of_window:
            window_msg = (
                "AI response referenced shifts outside the requested window; "
                "those suggestions were discarded."
            )
            ai_error = f"{ai_error}. {window_msg}".strip(". ") if ai_error else window_msg

        if not parsed_assignments:
            parsed_assignments = self._fallback_schedule(employees, period_shifts, assignments)
            if parsed_assignments:
                summary = (
                    "Generated using in-app fairness heuristic due to AI unavailability. "
                    "Assignments rotate employees while avoiding conflicts."
                )

        return {
            "success": bool(parsed_assignments),
            "summary": summary,
            "proposed_assignments": parsed_assignments or [],
            "raw_response": ai_raw,
            "ai_error": ai_error,
            "window": {
                "start": start_date.isoformat(),
                "end": end_date.isoformat(),
            },
        }

    def _fallback_schedule(
        self,
        employees: List[Dict[str, Any]],
        shifts: List[Dict[str, Any]],
        assignments: List[Dict[str, Any]],
    ) -> List[Dict[str, Any]]:
        """Deterministic schedule generator used when LLM output is unavailable."""

        if not employees or not shifts:
            return []

        def parse_shift_window(shift: Dict[str, Any]) -> tuple[datetime, datetime]:
            shift_date = datetime.fromisoformat(str(shift["date"])).date()
            start_str = str(shift["start_time"])
            end_str = str(shift["end_time"])

            def parse_time(value: str):
                for fmt in ("%H:%M:%S", "%H:%M"):
                    try:
                        return datetime.strptime(value, fmt).time()
                    except ValueError:
                        continue
                # If parsing fails, default to midnight to keep schedule deterministic
                return datetime.strptime("00:00", "%H:%M").time()

            start_dt = datetime.combine(shift_date, parse_time(start_str))
            end_dt = datetime.combine(shift_date, parse_time(end_str))
            if end_dt <= start_dt:
                end_dt += timedelta(days=1)
            return start_dt, end_dt

        already_assigned_shift_ids = {a["shift_id"] for a in assignments}
        pending_shifts = [s for s in shifts if s["id"] not in already_assigned_shift_ids]

        # Build existing schedules per employee to avoid overlaps
        employee_schedules: Dict[int, List[tuple[datetime, datetime]]] = defaultdict(list)
        for assignment in assignments:
            shift = next((s for s in shifts if s["id"] == assignment["shift_id"]), None)
            if not shift:
                continue
            window = parse_shift_window(shift)
            employee_schedules[assignment["employee_id"]].append(window)

        workload = defaultdict(int)
        for assignment in assignments:
            workload[assignment["employee_id"]] += 1

        proposals: List[Dict[str, Any]] = []

        def has_overlap(employee_id: int, window: tuple[datetime, datetime]) -> bool:
            for existing in employee_schedules.get(employee_id, []):
                if existing[0] < window[1] and existing[1] > window[0]:
                    return True
            return False

        for shift in sorted(pending_shifts, key=lambda s: (s["date"], s["start_time"])):
            window = parse_shift_window(shift)
            # Sort employees by workload, then id to keep deterministic ordering
            sorted_employees = sorted(
                employees,
                key=lambda e: (workload[e["id"]], e["id"]),
            )

            assigned_employee_id: Optional[int] = None
            for employee in sorted_employees:
                emp_id = employee["id"]
                if has_overlap(emp_id, window):
                    continue
                assigned_employee_id = emp_id
                break

            if assigned_employee_id is None:
                # No one available without conflict; skip shift in fallback
                continue

            employee_schedules[assigned_employee_id].append(window)
            workload[assigned_employee_id] += 1

            proposals.append(
                {
                    "shift_id": shift["id"],
                    "employee_id": assigned_employee_id,
                    "reason": "Fairness heuristic assigned available employee without conflicts.",
                }
            )

        return proposals

    def analyze_workforce_patterns(
        self,
        workforce_data: Dict[str, Any],
    ) -> Dict[str, Any]:
        """Analyze workforce data and return structured insights.

        This acts as a lightweight heuristic fallback so that the /ai/analyze-workforce
        endpoint remains useful even when the LLM is unavailable.
        """

        employees: List[Dict[str, Any]] = workforce_data.get("employees") or []
        shifts: List[Dict[str, Any]] = workforce_data.get("shifts") or []
        assignments: List[Dict[str, Any]] = workforce_data.get("assignments") or []

        employees_by_id = {
            emp.get("id"): emp for emp in employees if emp.get("id") is not None
        }
        shifts_by_id = {
            shift.get("id"): shift for shift in shifts if shift.get("id") is not None
        }

        department_usage: Dict[str, Dict[str, Any]] = defaultdict(lambda: {
            "employees": set(),
            "assignments": 0,
        })

        for emp in employees:
            emp_id = emp.get("id")
            if emp_id is None:
                continue
            department = emp.get("department_id") or "Unassigned"
            department_usage[department]["employees"].add(emp_id)

        shift_type_counts: Dict[str, int] = defaultdict(int)

        for assignment in assignments:
            emp_id = assignment.get("employee_id")
            shift_id = assignment.get("shift_id")
            if emp_id in employees_by_id:
                department = employees_by_id[emp_id].get("department_id") or "Unassigned"
                department_usage[department]["assignments"] += 1
            shift = shifts_by_id.get(shift_id)
            if shift:
                shift_type = shift.get("shift_type") or "UNCLASSIFIED"
                shift_type_counts[shift_type] += 1

        department_summary: List[Dict[str, Any]] = []
        for department, stats in department_usage.items():
            employee_count = len(stats["employees"])
            assignment_count = stats["assignments"]
            department_summary.append(
                {
                    "department": department,
                    "employee_count": employee_count,
                    "assignment_count": assignment_count,
                    "avg_assignments_per_employee": round(
                        assignment_count / employee_count, 2
                    ) if employee_count else 0.0,
                }
            )

        department_summary.sort(
            key=lambda item: item["avg_assignments_per_employee"], reverse=True
        )

        peak_shift_type, peak_shift_count = max(
            shift_type_counts.items(), key=lambda item: item[1], default=(None, 0)
        )

        recommendations: List[str] = []
        for entry in department_summary:
            avg_load = entry["avg_assignments_per_employee"]
            if avg_load >= 4:
                recommendations.append(
                    f"Department {entry['department']} carries a high workload (avg {avg_load}). Consider hiring or redistributing shifts."
                )
            elif avg_load <= 1:
                recommendations.append(
                    f"Department {entry['department']} appears underutilized (avg {avg_load}). Explore cross-training or additional responsibilities."
                )

        if peak_shift_type:
            recommendations.append(
                f"{peak_shift_type} shifts have the highest utilization with {peak_shift_count} assignments. Ensure coverage and contingency planning."
            )

        return {
            "success": True,
            "summary": {
                "employee_count": len(employees),
                "shift_count": len(shifts),
                "assignment_count": len(assignments),
            },
            "department_summary": department_summary,
            "shift_type_distribution": shift_type_counts,
            "recommendations": recommendations or [
                "Workload distribution looks balanced. Continue monitoring for anomalies."
            ],
            "requested_analysis_type": workforce_data.get("analysis_type", "comprehensive"),
        }

# Global instance
ai_service = AIService()
