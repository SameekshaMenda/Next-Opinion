import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.header import Header
from email.mime.application import MIMEApplication
from dotenv import load_dotenv
import re

load_dotenv()

SMTP_SERVER = "smtp.gmail.com"
SMTP_PORT = 587

EMAIL_ADDRESS = os.getenv("MAIL_USERNAME")
EMAIL_PASSWORD = os.getenv("MAIL_PASSWORD")


def remove_emojis_and_unicode(text):
    # Remove emojis and all non ASCII characters
    return text.encode("ascii", "ignore").decode()

def send_email(to, subject, body, attachment_paths=None):
    """Send UTF-8 safe emails with attachments."""
    if not EMAIL_ADDRESS or not EMAIL_PASSWORD:
        print("❌ Email config missing (MAIL_USERNAME or MAIL_PASSWORD empty)")
        return

    try:
        # Create message container
        msg = MIMEMultipart()
        msg["From"] = str(Header(EMAIL_ADDRESS, "utf-8"))
        msg["To"] = str(Header(to, "utf-8"))
        msg["Subject"] = Header(subject, "utf-8")

        # 🔥 Ensure full UTF-8 support for email content
        msg.attach(MIMEText(body, "plain", "utf-8"))

        # -----------------------------
        # 📎 Attachments (UTF-8 Safe)
        # -----------------------------
        if attachment_paths:
            for file_path in attachment_paths:
                try:
                    if not os.path.exists(file_path):
                        print(f"⚠️ Attachment not found: {file_path}")
                        continue

                    with open(file_path, "rb") as f:
                        file_data = f.read()

                    filename = os.path.basename(file_path)

                    part = MIMEApplication(file_data, Name=filename)
                    # UTF-8 encode filename so Gmail accepts it safely
                    part.add_header(
                        "Content-Disposition",
                        f'attachment; filename="{Header(filename, "utf-8").encode()}"'
                    )

                    msg.attach(part)
                    print(f"📎 Attached: {filename}")

                except Exception as e:
                    print(f"❌ Failed attaching {file_path}: {e}")

        # -----------------------------
        # ✉️ SEND MAIL (UTF-8 Safe)
        # -----------------------------
        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        server.starttls()
        server.login(EMAIL_ADDRESS, EMAIL_PASSWORD)

        server.sendmail(EMAIL_ADDRESS, to, msg.as_string())
        server.quit()

        print(f"📧 Email successfully sent → {to}")

    except Exception as e:
        print("❌ Email sending failed:", e)
