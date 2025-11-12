import os
import psycopg2
from dotenv import load_dotenv
import google.generativeai as genai

load_dotenv()

# ✅ Gemini Configuration
genai.configure(api_key=os.getenv("GENIE_API_KEY"))

# ✅ Database Configuration
DB_URI = os.getenv("DATABASE_URL")

print("✅ Database URI Loaded:", DB_URI is not None)
print("🔑 Gemini API Key Loaded:", bool(os.getenv("GENIE_API_KEY")))

conn = psycopg2.connect(os.getenv("DATABASE_URL"))
cur = conn.cursor()
cur.execute("SELECT version();")
print(cur.fetchone())
cur.close()
conn.close()
