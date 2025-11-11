import json
import re
from difflib import SequenceMatcher
import google.generativeai as genai
from core.gemini_utils import get_related_terms_with_gemini
from core.data_loader import doctor_data

def call_gemini(extracted_text):
    model = genai.GenerativeModel("gemini-2.0-flash-lite")
    prompt = f"""
    You are a senior clinical AI assistant providing a second medical opinion.
    Analyze the following medical text and return a JSON list of 3–5 possible conditions:
    {extracted_text}
    Each entry should include:
    - disease
    - risk (as %)
    - Doctor's Name
    - explanation
    """

    response = model.generate_content(prompt)
    text = response.text.strip()

    try:
        data = json.loads(text)
    except Exception:
        try:
            start, end = text.find("["), text.rfind("]")
            data = json.loads(text[start:end + 1]) if start != -1 else []
        except Exception:
            data = [{
                "disease": "Parsing error",
                "risk": "N/A",
                "Doctor's Name": "N/A",
                "explanation": text
            }]
    return data


def text_similarity(a, b):
    return SequenceMatcher(None, a.lower(), b.lower()).ratio()


def match_doctors_from_dataset(disease_name, top_n=3):
    """Match doctors from the dataset using precise scoring & Gemini keywords."""
    if not disease_name:
        print("⚠️ No disease name provided.")
        return []

    print(f"\n🧠 Matching doctors for: {disease_name}")
    df = doctor_data.copy()

    gemini_terms = get_related_terms_with_gemini(disease_name)
    disease_tokens = set(re.findall(r"[a-zA-Z]+", disease_name.lower()))
    disease_tokens.update(gemini_terms)

    stopwords = {"disease", "risk", "syndrome", "increased", "possible", "of", "or",
                 "disorder", "condition", "problem", "illness", "issue", "health"}
    disease_tokens = {t for t in disease_tokens if t not in stopwords}

    results = []

    def safe_float(x, default=0.0):
        try:
            return float(x)
        except Exception:
            return default

    max_rating = df["rating"].apply(safe_float).max() or 5.0
    max_exp = df["experience (years)"].apply(safe_float).max() or 30.0

    for _, row in df.iterrows():
        combined = " ".join([
            str(row.get("speciality", "")),
            str(row.get("keywords", "")),
            str(row.get("treated_diseases", "")),
        ]).lower()

        doc_tokens = set(re.findall(r"[a-zA-Z]+", combined))
        overlap = len(disease_tokens.intersection(doc_tokens)) / max(1, len(disease_tokens))
        fuzzy_scores = [text_similarity(t, combined) for t in disease_tokens]
        fuzzy = max(fuzzy_scores) if fuzzy_scores else 0.0

        rating = safe_float(row.get("rating"))
        exp = safe_float(row.get("experience (years)"))
        final_score = (
            0.6 * max(overlap, fuzzy)
            + 0.25 * (rating / max_rating)
            + 0.15 * (exp / max_exp)
        )

        if final_score > 0.25:
            results.append({
                "name": row.get("doctor's name", "Dr. Unknown"),
                "speciality": row.get("speciality", "N/A"),
                "location": row.get("location", "N/A"),
                "experience": row.get("experience (years)", "N/A"),
                "rating": row.get("rating", "N/A"),
                "score": round(final_score, 3)
            })

    results = sorted(results, key=lambda x: x["score"], reverse=True)
    print(f"🏁 Found {len(results)} doctors with score > 0.25")

    if not results:
        fallback_map = {
            "lipid": "Cardiologist",
            "cholesterol": "Cardiologist",
            "heart": "Cardiologist",
            "cvd": "Cardiologist",
            "brain": "Neurologist",
            "skin": "Dermatologist",
            "eczema": "Dermatologist",
            "acne": "Dermatologist",
            "pregnancy": "Gynecologist",
            "diabetes": "Endocrinologist",
            "asthma": "Pulmonologist",
        }
        for term, spec in fallback_map.items():
            if term in disease_name.lower() or term in " ".join(gemini_terms):
                print(f"🩺 Fallback mapping: {term} → {spec}")
                results = (
                    df[df["speciality"].str.lower().str.contains(spec.lower(), na=False)]
                    .sort_values(by="rating", ascending=False)
                    .head(top_n)
                    .to_dict(orient="records")
                )
                break

    if results:
        print("🏆 Top matches:")
        for d in results[:3]:
            print(f"   → {d['name']} ({d['speciality']}) ⭐{d['rating']} | {d['score']}")
    else:
        print("⚠️ No direct matches found; fallback will apply.")

    return results[:top_n]
