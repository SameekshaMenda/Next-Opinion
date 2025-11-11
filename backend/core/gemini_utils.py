import os
import json
import google.generativeai as genai

cache_file = "data/term_cache.json"
if os.path.exists(cache_file):
    with open(cache_file, "r") as f:
        term_cache = json.load(f)
else:
    term_cache = {}

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
