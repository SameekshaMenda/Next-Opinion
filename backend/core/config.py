import os
import psycopg2
from dotenv import load_dotenv
import google.generativeai as genai

load_dotenv()

# ✅ Gemini Configuration
genai.configure(api_key=os.getenv("Model"))

# ✅ Database Configuration
DB_URI = os.getenv("DATABASE_URL")

print("✅ Database URI Loaded:", DB_URI is not None)
print("🔑 NextOpinion model is loaded:", bool(os.getenv("Model")))

conn = psycopg2.connect(os.getenv("DATABASE_URL"))
cur = conn.cursor()
cur.execute("SELECT version();")
print(cur.fetchone())
cur.close()
conn.close()
