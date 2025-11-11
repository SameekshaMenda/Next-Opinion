import pandas as pd

doctor_data = pd.read_csv("data/doctor_list.csv")
doctor_data.columns = [c.strip().lower() for c in doctor_data.columns]

print("✅ Doctor dataset loaded successfully.")
print("📋 Columns:", list(doctor_data.columns))
print("🔹 Sample entry:", doctor_data.head(1).to_dict(orient="records"))
