from flask import Flask, request, jsonify
from flask_cors import CORS
import google.generativeai as genai
import json
import os
from dotenv import load_dotenv
import fitz  # PyMuPDF for PDF text extraction
from PIL import Image
import pytesseract
import tempfile
import pandas as pd
import re
from difflib import SequenceMatcher

# ===============================
# ⚙️ Setup
# ===============================
load_dotenv()
genai.configure(api_key=os.getenv("GENIE_API_KEY", "YOUR_GEMINI_API_KEY"))

app = Flask(__name__)
CORS(app)

# ===============================
# 💾 Load doctor dataset
# ===============================
doctor_data = pd.read_csv("doctor_list.csv")
doctor_data.columns = [c.strip().lower() for c in doctor_data.columns]

print("✅ Doctor dataset loaded successfully.")
print("📋 Columns:", list(doctor_data.columns))
print("🔹 Sample entry:", doctor_data.head(1).to_dict(orient="records"))

# Temporary storage (no DB yet)
reports = []
chats = []
next_report_id = 1


# ===============================
# 🧩 Utility: Extract text from uploaded files
# ===============================
def extract_text_from_file(file):
    filename = file.filename.lower()
    temp_path = os.path.join(tempfile.gettempdir(), filename)
    file.save(temp_path)

    text = ""
    try:
        if filename.endswith(".pdf"):
            with fitz.open(temp_path) as doc:
                for page in doc:
                    text += page.get_text("text")
        elif filename.endswith((".png", ".jpg", ".jpeg")):
            img = Image.open(temp_path)
            text = pytesseract.image_to_string(img)
        elif filename.endswith(".txt"):
            with open(temp_path, "r", encoding="utf-8") as f:
                text = f.read()
        else:
            text = "Unsupported file format."
    except Exception as e:
        text = f"Error reading file: {str(e)}"
    finally:
        os.remove(temp_path)

    return text.strip()


# ===============================
# 💡 Cached Gemini keyword generation
# ===============================
cache_file = "term_cache.json"
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
        Return ONLY a comma-separated list, no sentences.
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


# ===============================
# 🧠 Second Opinion (Gemini)
# ===============================
def call_gemini(extracted_text):
    model = genai.GenerativeModel("gemini-2.0-flash-lite")
    prompt = f"""
    You are a senior clinical AI assistant providing a second medical opinion.
    Analyze the following medical text and return a JSON list of 3–5 possible conditions:
    {extracted_text}
    Each entry should include:
    - disease
    - risk (as %)
    -Doctor's Name
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


# ===============================
# 🧠 Smart Doctor Matching (Gemini + fuzzy logic)
# ===============================
def text_similarity(a, b):
    """Basic fuzzy similarity."""
    return SequenceMatcher(None, a.lower(), b.lower()).ratio()

# def match_doctors_from_dataset(disease_name, top_n=3):
#     """Match doctors based on Gemini keywords + fuzzy semantic similarity."""
#     if not disease_name:
#         print("⚠️ No disease name provided.")
#         return []

#     print(f"\n🧠 DEBUG: Matching doctors for -> {disease_name}")
#     df = doctor_data.copy()

#     gemini_terms = get_related_terms_with_gemini(disease_name)
#     disease_tokens = set(re.findall(r"[a-zA-Z]+", disease_name.lower()))
#     disease_tokens.update(gemini_terms)
#     print(f"🧬 Tokens used for matching: {disease_tokens}")

#     results = []

#     def safe_float(x, default=0.0):
#         try:
#             return float(x)
#         except Exception:
#             return default

#     max_rating = df["rating"].apply(safe_float).max() or 5.0
#     max_exp = df["experience (years)"].apply(safe_float).max() or 30.0

#     for _, row in df.iterrows():
#         combined = " ".join([
#             str(row.get("speciality", "")),
#             str(row.get("keywords", "")),
#             str(row.get("treated_diseases", ""))
#         ]).lower()

#         # fuzzy semantic matching
#         tokens_in_doc = set(re.findall(r"[a-zA-Z]+", combined))
#         overlap = len(tokens_in_doc.intersection(disease_tokens)) / max(1, len(disease_tokens))

# # fuzzy match fallback
#         sim_scores = [text_similarity(t, combined) for t in disease_tokens]
#         fuzzy = max(sim_scores) if sim_scores else 0.0

# # combine both
#         match_score = max(overlap, fuzzy)

#         rating = safe_float(row.get("rating"))
#         exp = safe_float(row.get("experience (years)"))

#         final_score = (0.7 * match_score) + (0.2 * (rating / max_rating)) + (0.1 * (exp / max_exp))

#         if final_score > 0.1:  # threshold to avoid noise
#             results.append({
#                 "name": row.get("doctor's name", "Dr. Unknown"),
#                 "speciality": row.get("speciality", "N/A"),
#                 "location": row.get("location", "N/A"),
#                 "experience": row.get("experience (years)", "N/A"),
#                 "rating": row.get("rating", "N/A"),
#                 "score": round(final_score, 3)
#             })

#     results = sorted(results, key=lambda x: x["score"], reverse=True)
#     print(f"🏁 Found {len(results)} matching doctors.")

#     # fallback if no match
#     if not results:
#         if any(k in disease_name for k in ["heart", "lipid", "cholesterol", "cvd", "cardio", "vascular"]):
#             results = df[df["speciality"].str.lower().str.contains("cardio", na=False)].head(top_n).to_dict(orient="records")
#         else:
#             results = df.sort_values(by="rating", ascending=False).head(top_n).to_dict(orient="records")

#     return results[:top_n]

def match_doctors_from_dataset(disease_name, top_n=3):
    """Match doctors from the dataset using precise scoring & Gemini keywords."""
    if not disease_name:
        print("⚠️ No disease name provided.")
        return []

    print(f"\n🧠 Matching doctors for: {disease_name}")
    df = doctor_data.copy()

    # Step 1: Get Gemini keywords
    gemini_terms = get_related_terms_with_gemini(disease_name)
    disease_tokens = set(re.findall(r"[a-zA-Z]+", disease_name.lower()))
    disease_tokens.update(gemini_terms)

    # Step 2: Remove generic stopwords to improve precision
    stopwords = {
        "disease", "risk", "syndrome", "increased", "possible", "of", "or",
        "disorder", "condition", "problem", "illness", "issue", "health"
    }
    disease_tokens = {t for t in disease_tokens if t not in stopwords}

    print(f"🔍 Using refined disease tokens: {disease_tokens}")

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

        # Step 3: Token overlap score
        doc_tokens = set(re.findall(r"[a-zA-Z]+", combined))
        overlap = len(disease_tokens.intersection(doc_tokens)) / max(1, len(disease_tokens))

        # Step 4: Fuzzy match
        fuzzy_scores = [text_similarity(t, combined) for t in disease_tokens]
        fuzzy = max(fuzzy_scores) if fuzzy_scores else 0.0

        # Step 5: Weighted scoring
        rating = safe_float(row.get("rating"))
        exp = safe_float(row.get("experience (years)"))
        final_score = (
            0.6 * max(overlap, fuzzy)
            + 0.25 * (rating / max_rating)
            + 0.15 * (exp / max_exp)
        )

        if final_score > 0.25:  # stricter threshold now
            results.append({
                "name": row.get("doctor's name", "Dr. Unknown"),
                "speciality": row.get("speciality", "N/A"),
                "location": row.get("location", "N/A"),
                "experience": row.get("experience (years)", "N/A"),
                "rating": row.get("rating", "N/A"),
                "score": round(final_score, 3)
            })

    # Step 6: Sort results
    results = sorted(results, key=lambda x: x["score"], reverse=True)
    print(f"🏁 Found {len(results)} doctors with score > 0.25")

    # Step 7: Smart fallback
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

    # Step 8: Show top 3 matches in logs
    if results:
        print("🏆 Top matches:")
        for d in results[:3]:
            print(f"   → {d['name']} ({d['speciality']}) ⭐{d['rating']} | {d['score']}")
    else:
        print("⚠️ No direct matches found; fallback will apply.")

    return results[:top_n]


# ===============================
# 🩺 API: Generate Second Opinion
# ===============================
@app.route("/api/second_opinion", methods=["POST"])
def second_opinion():
    global next_report_id

    extracted_text = ""
    user_name = request.form.get("user_name", "Anonymous")

    if "file" in request.files:
        extracted_text = extract_text_from_file(request.files["file"])
    else:
        payload = request.get_json() or {}
        extracted_text = (
            payload.get("lab_report", "")
            + "\n"
            + payload.get("prescription", "")
            + "\n"
            + payload.get("doctor_notes", "")
        )

    ai_result = call_gemini(extracted_text)

    # map diseases → doctors
    for entry in ai_result:
        disease = entry.get("disease", "")
        entry["recommended_doctors"] = match_doctors_from_dataset(disease)

    report = {
        "id": next_report_id,
        "user_name": user_name,
        "extracted_text": extracted_text,
        "ai_result": ai_result,
        "final_report": None
    }
    reports.append(report)
    next_report_id += 1

    return jsonify({"status": "success", "report_id": report["id"], "ai_result": ai_result})


# ===============================
# 📋 Reports and Chat Endpoints
# ===============================
@app.route("/api/report/<int:report_id>", methods=["GET"])
def get_report(report_id):
    report = next((r for r in reports if r["id"] == report_id), None)
    if not report:
        return jsonify({"status": "error", "message": "Report not found"}), 404
    return jsonify({"status": "success", "report": report})


@app.route("/api/report/<int:report_id>/finalize", methods=["POST"])
def finalize_report(report_id):
    report = next((r for r in reports if r["id"] == report_id), None)
    if not report:
        return jsonify({"status": "error", "message": "Report not found"}), 404
    report["final_report"] = request.json.get("final_report", "")
    return jsonify({"status": "success", "message": "Final report saved"})


@app.route("/api/chat/<int:report_id>", methods=["GET"])
def get_chat(report_id):
    filtered = [m for m in chats if m["report_id"] == report_id]
    return jsonify({"status": "success", "messages": filtered})


@app.route("/api/chat/<int:report_id>/send", methods=["POST"])
def send_chat(report_id):
    payload = request.get_json() or {}
    chats.append({
        "report_id": report_id,
        "sender": payload.get("sender", "user"),
        "message": payload.get("message", "")
    })
    return jsonify({"status": "success"})


# ===============================
# 👨‍⚕️ Doctor Directory API
# ===============================
@app.route("/api/doctors", methods=["GET"])
def get_all_doctors():
    """List all doctors or filter by speciality, keyword, or location."""
    speciality = request.args.get("speciality", "").lower()
    keyword = request.args.get("keyword", "").lower()
    location = request.args.get("location", "").lower()

    filtered = doctor_data.copy()
    if speciality:
        filtered = filtered[filtered["speciality"].str.lower().str.contains(speciality, na=False)]
    if keyword:
        filtered = filtered[filtered["keywords"].str.lower().str.contains(keyword, na=False)]
    if location:
        filtered = filtered[filtered["location"].str.lower().str.contains(location, na=False)]

    doctors = filtered.to_dict(orient="records")
    return jsonify({
        "status": "success",
        "count": len(doctors),
        "doctors": doctors
    })


# ===============================
# 🏁 Run app
# ===============================
if __name__ == "__main__":
    app.run(debug=True)
