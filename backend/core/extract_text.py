import os, tempfile
import fitz
from PIL import Image
import pytesseract

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

    # 🚨 DO NOT DELETE FILE
    # We need this file for doctor email attachment
    # os.remove(temp_path)

    return {
        "text": text.strip(),
        "file_path": temp_path,
        "filename": filename
    }
