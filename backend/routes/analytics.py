"""
Analytics routes for AI-powered insights.
Uses google-genai to generate text insights from fleet database metrics.
"""
from flask import Blueprint, jsonify, current_app
from sqlalchemy import func
import os
import json
from datetime import datetime, timedelta

from models import db, DrivingEvent, Bus, Trip, Driver

analytics_bp = Blueprint('analytics', __name__)

def get_fleet_stats():
    """Aggregate stats from the database to feed to Gemini."""
    today = datetime.utcnow().date()
    start_of_today = datetime.combine(today, datetime.min.time())
    
    # Total events today
    total_events_today = DrivingEvent.query.filter(DrivingEvent.timestamp >= start_of_today).count()
    
    # Events by type
    events_by_type = db.session.query(
        DrivingEvent.event_type, 
        func.count(DrivingEvent.id)
    ).group_by(DrivingEvent.event_type).all()
    event_type_breakdown = {t: c for t, c in events_by_type}
    
    # High severity events
    high_severity_count = DrivingEvent.query.filter_by(severity='HIGH').count()
    
    # Active buses
    active_buses = Bus.query.filter_by(is_active=True).count()
    
    # Worst offending routes (by event count)
    buses_with_events = db.session.query(
        Bus.registration_number, 
        Bus.route, 
        func.count(DrivingEvent.id).label('event_count')
    ).join(DrivingEvent, Bus.id == DrivingEvent.bus_id) \
     .group_by(Bus.id) \
     .order_by(db.text('event_count DESC')) \
     .limit(3).all()
    
    worst_buses = [{"registration": b.registration_number, "route": b.route, "events": b.event_count} for b in buses_with_events]

    return {
        "summary": {
            "total_events_today": total_events_today,
            "high_severity_events_all_time": high_severity_count,
            "active_buses_tracked": active_buses
        },
        "event_breakdown_all_time": event_type_breakdown,
        "worst_performing_buses": worst_buses,
        "timestamp": datetime.utcnow().isoformat()
    }

@analytics_bp.route('/api/analytics/insights', methods=['GET'])
def generate_insights():
    """
    Fetch DB stats and pass them to Gemini API to generate insights.
    Returns structured JSON containing markdown strings.
    """
    api_key = os.getenv('GEMINI_API_KEY')
    
    # If no API key is provided, return mock insights for local dev/demo
    if not api_key or api_key == 'your_gemini_api_key_here':
        return jsonify({
            "status": "success",
            "is_mock": True,
            "data": {
                "overall_summary": "Overall fleet safety is currently **stable**. There has been a slight increase in typical rush hour anomalies, but nothing requiring immediate emergency intervention.",
                "key_findings": [
                    "**Hotspot Identified**: 68% of all HIGH severity events (mainly Aggressive Turns) happen near the central junction. This might indicate poor road design rather than bad driving.",
                    "**Time Pattern**: Tailgating incidents spike by 40% between 5:00 PM and 7:00 PM (rush hour).",
                    "**Vehicle Specific**: Bus KL-01-AB-1234 accounts for roughly 30% of all recent harsh braking events."
                ],
                "recommendations": [
                    "Schedule a brief refresher on safe braking distances for the driver of KL-01-AB-1234.",
                    "Investigate the central junction area to see if bus stops or routing can be slightly adjusted to avoid the aggressive turn hotspot."
                ]
            }
        })
    
    try:
        from google import genai
        from google.genai import types
        
        client = genai.Client(api_key=api_key)
        
        stats = get_fleet_stats()
        
        prompt = f"""
        You are an elite AI Fleet Intelligence Analyst for the 'OnboardRash' driving analytics platform. 
        Your job is to analyze raw fleet telemetry data and provide actionable, executive-level insights.
        
        Use the following real-time database statistics to generate your report:
        {json.dumps(stats, indent=2)}
        
        Provide the output as a valid JSON object EXACTLY matching this schema:
        {{
            "overall_summary": "A 2-3 sentence high-level summary of the fleet's current safety posture.",
            "key_findings": [
                "Finding 1 (can include markdown bolding)",
                "Finding 2",
                "Finding 3"
            ],
            "recommendations": [
                "Actionable recommendation 1",
                "Actionable recommendation 2"
            ]
        }}
        
        Keep it professional, data-driven, and concise. Do NOT include markdown code blocks around the JSON output, just output the raw JSON.
        """
        
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
            ),
        )
        
        # Parse the JSON response
        try:
            insight_data = json.loads(response.text)
            return jsonify({
                "status": "success",
                "is_mock": False,
                "data": insight_data
            })
        except json.JSONDecodeError:
            current_app.logger.error(f"Failed to parse Gemini response as JSON: {response.text}")
            return jsonify({"error": "Failed to parse AI response"}), 500
            
    except Exception as e:
        current_app.logger.error(f"Error communicating with Gemini API: {str(e)}")
        return jsonify({"error": str(e)}), 500
