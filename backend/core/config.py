import os
from dotenv import load_dotenv
import google.generativeai as genai

# Load environment variables
load_dotenv()

# Configure Gemini API
genai.configure(api_key=os.getenv("GENIE_API_KEY"))
print("🔑 Gemini API Key Loaded:", bool(os.getenv("GENIE_API_KEY")))
