import os
import json
import google.generativeai as genai

cache_file = "data/term_cache.json"
if os.path.exists(cache_file):
    with open(cache_file, "r") as f:
        term_cache = json.load(f)
else:
    term_cache = {}

# --- NEW FUNCTION FOR STRUCTURED AI ANALYSIS ---
def get_second_opinion_with_gemini(report_text, report_images=None):
    """
    Generates a structured medical second opinion from the report text using Gemini.
    """
    try:
        # Use a powerful model for complex analysis
        model = genai.GenerativeModel("gemini-2.5-flash") 
        
        # Define the expected JSON schema for structured output
        response_schema = {
            "type": "object",
            "properties": {
                "risk_score": {"type": "integer", "description": "Overall risk score from 0 (min) to 100 (max) based on findings."},
                "risk_category": {"type": "string", "enum": ["Low", "Medium", "High"], "description": "Categorization of the risk score."},
                "suggested_specialty": {"type": "string", "description": "The most appropriate medical specialty for referral (e.g., Cardiology, Neurology)."},
                "patient_summary": {"type": "string", "description": "A concise, professional summary of the patient's condition for the consulting doctor."},
                "differential_diagnosis": {
                    "type": "array",
                    "description": "Top 3 possible conditions with confidence percentage.",
                    "items": {
                        "type": "object",
                        "properties": {
                            "condition": {"type": "string"},
                            "confidence_percent": {"type": "integer"}
                        }
                    }
                },
                "clinical_flags": {
                    "type": "array",
                    "description": "List of critical/abnormal values or significant findings from the report.",
                    "items": {"type": "string"}
                }
            },
            "required": ["risk_score", "risk_category", "suggested_specialty", "differential_diagnosis", "clinical_flags", "patient_summary"]
        }

        prompt = f"""
        You are an AI-powered medical diagnostic assistant providing a second opinion. 
        Analyze the following lab/medical report text. Provide a professional, structured analysis based ONLY on the data in the report.

        Report Text:
        ---
        {report_text}
        ---

        Generate the response strictly in the JSON format defined by the schema.
        """
        
        # Prepare content (text and optional images - assuming image handling logic elsewhere)
        contents = [prompt]
        
        response = model.generate_content(
            contents,
            config={"response_mime_type": "application/json", "response_schema": response_schema}
        )
        
        analysis_data = json.loads(response.text)
        print(f"✅ Gemini Analysis successful. Risk: {analysis_data.get('risk_category')}")
        return analysis_data

    except Exception as e:
        print("⚠️ Gemini analysis failed:", str(e))
        return {
            "error": "Gemini analysis failed",
            "message": str(e),
            "risk_score": 50,
            "risk_category": "Medium",
            "suggested_specialty": "General Medicine"
        }

# (Existing function kept for compatibility)
def get_related_terms_with_gemini(disease):
    """Ask Gemini for related medical terms and cache them locally."""
    disease = disease.lower().strip()
    if disease in term_cache:
        return term_cache[disease]

    try:
        model = genai.GenerativeModel("gemini-2.0-flash-lite")
        prompt = f"""
        You are a medical expert.
        List 8–10 short, comma-separated medical keywords related to "{disease}".
        Include symptoms, affected organs, causes, and related medical terms.
        Return ONLY a comma-separated list.
        """
        response = model.generate_content(prompt)
        keywords = [w.strip().lower() for w in response.text.split(",") if w.strip()]
        term_cache[disease] = keywords
        with open(cache_file, "w") as f:
            json.dump(term_cache, f, indent=2)
        print(f"🔮 Gemini keywords for {disease}: {keywords}")
        return keywords
    except Exception as e:
        print("⚠️ Gemini keyword generation failed:", str(e))
        return []